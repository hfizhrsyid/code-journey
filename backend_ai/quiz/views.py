import json
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Question, QuestionAttempt, Topic
from .services import generate_question, check_answer, generate_question_set
from .auth_views import add_cors_headers
from django.views.decorators.csrf import csrf_exempt
import random
import logging

logger = logging.getLogger(__name__)


# Default distribution: 3 questions per difficulty 1..5
DEFAULT_DISTRIBUTION = getattr(
    settings,
    "QUESTION_DISTRIBUTION",
    [
        {"difficulty": 1, "count": 3},
        {"difficulty": 2, "count": 3},
        {"difficulty": 3, "count": 3},
        {"difficulty": 4, "count": 3},
        {"difficulty": 5, "count": 3},
    ],
)


def _select_progressive_questions(questions_queryset, distribution=None):
    """Select progressive questions based on a difficulty distribution."""
    dist = distribution or DEFAULT_DISTRIBUTION
    byDifficulty = {1: [], 2: [], 3: [], 4: [], 5: []}
    for q in questions_queryset:
        if q.difficulty in byDifficulty:
            byDifficulty[q.difficulty].append(q)

    progressive = []
    for item in dist:
        d = item.get("difficulty")
        c = item.get("count", 0)
        if d in byDifficulty:
            progressive.extend(byDifficulty[d][:c])

    return progressive

@api_view(["POST"])
@csrf_exempt
@add_cors_headers
def generate_question_view(request):
    """Generate a new AI question"""
    try:
        difficulty = request.data.get("difficulty")
        question_type = request.data.get("question_type")
        
        if not difficulty or not question_type:
            return Response(
                {"error": "Missing difficulty or question_type"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            difficulty = int(difficulty)
        except (ValueError, TypeError):
            return Response(
                {"error": "Difficulty must be integer 1-5"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            parsed = generate_question(difficulty, question_type)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"AI generation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Save to database (dengan explanation)
        q = Question.objects.create(
            question_type=question_type,
            difficulty=difficulty,
            question_text=parsed.get("question_text", ""),
            code_template=parsed.get("code_template"),
            options=parsed.get("options"),
            answer_key=parsed.get("answer_key"),
            explanation=parsed.get("explanation", "")  # SIMPAN EXPLANATION
        )
        
        return Response(
            {
                "success": True,
                "question_id": q.id,
                "question_text": parsed.get("question_text"),
                "code_template": parsed.get("code_template"),
                "options": parsed.get("options"),
                "explanation": parsed.get("explanation", ""),  # KIRIM EXPLANATION
                "question_type": question_type,
                "difficulty": difficulty
            },
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@csrf_exempt
@add_cors_headers
def check_answer_view(request):
    """Check user answer"""
    try:
        question_id = request.data.get("question_id")
        user_answer = request.data.get("answer")
        
        if not question_id or user_answer is None:
            return Response(
                {"error": "Missing question_id or answer"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            q = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response(
                {"error": "Question not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get explanation dari database
        explanation = q.explanation or ""
        
        # Check answer
        check_result = check_answer(
            str(user_answer),
            q.answer_key,
            q.question_type,
            explanation
        )
        
        # Save attempt
        if hasattr(request.user, 'id') and request.user.id:
            QuestionAttempt.objects.create(
                user_id=request.user.id,
                question=q,
                answer=user_answer,
                is_correct=check_result["correct"]
            )
        
        return Response({
            "correct": check_result["correct"],
            "feedback": check_result["feedback"],
            "correct_answer": check_result["correct_answer"],
            "explanation": check_result["explanation"]  # KIRIM EXPLANATION
        })
        
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@add_cors_headers
def get_question_view(request, question_id):
    """Retrieve a question"""
    try:
        q = Question.objects.get(id=question_id)
        return Response({
            "question_id": q.id,
            "question_type": q.question_type,
            "difficulty": q.difficulty,
            "question_text": q.question_text,
            "code_template": q.code_template,
            "options": q.options,
            "explanation": q.explanation  # KIRIM EXPLANATION
        })
    except Question.DoesNotExist:
        return Response(
            {"error": "Question not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@csrf_exempt
@add_cors_headers
def generate_question_set_view(request):
    """Generate a set of questions for a given topic"""
    try:
        topic = request.data.get("topic", "").strip()
        difficulty = request.data.get("difficulty", 2)
        count = request.data.get("count", 10)
        mcq_count = request.data.get("mcq_count", 5)
        max_workers = request.data.get("max_workers", 3)

        # Validate topic
        if not topic:
            return Response({"error": "Topic is required and cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        if len(topic) > 100:
            return Response({"error": "Topic must be 100 characters or less"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate difficulty
        try:
            difficulty = int(difficulty)
            if not 1 <= difficulty <= 5:
                raise ValueError("Difficulty must be between 1 and 5")
        except (ValueError, TypeError) as e:
            return Response({"error": f"Invalid difficulty: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate counts
        try:
            count = int(count)
            mcq_count = int(mcq_count)
            max_workers = int(max_workers)
        except (ValueError, TypeError):
            return Response({"error": "Count, mcq_count, and max_workers must be integers"}, status=status.HTTP_400_BAD_REQUEST)

        if count <= 0:
            return Response({"error": "Count must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)
        if count > 20:
            return Response({"error": "Count cannot exceed 20 questions per request"}, status=status.HTTP_400_BAD_REQUEST)
        if mcq_count < 0 or mcq_count > count:
            return Response({"error": f"mcq_count must be between 0 and {count}"}, status=status.HTTP_400_BAD_REQUEST)
        if max_workers < 1 or max_workers > 5:
            return Response({"error": "max_workers must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Generating {count} questions ({mcq_count} MCQ) for topic '{topic}' (difficulty: {difficulty})")

        try:
            questions = generate_question_set(topic, difficulty, count, mcq_count, max_workers)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in generate_question_set: {str(e)}")
            return Response(
                {"error": f"Failed to generate questions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "success": True,
            "created_count": len(questions),
            "requested_count": count,
            "questions": questions
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Unexpected error in generate_question_set_view: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================
# NEW DATABASE-FIRST ENDPOINTS (Step 3)
# ============================================

@api_view(["GET"])
@csrf_exempt
@add_cors_headers
def get_questions(request):
    """
    Get questions from database with filters
    
    Query params:
    - topic: Topic name (optional)
    - topic_id: Topic ID (optional, preferred)
    - difficulty: 1-5 (optional)
    - question_type: mcq, fill, coding (optional)
    - limit: Max results (default 10)
    """
    try:
        # Use request.GET for query parameters (works with both DRF and plain Django)
        topic_name = request.GET.get("topic") or request.query_params.get("topic")
        topic_id = request.GET.get("topic_id") or request.query_params.get("topic_id")
        difficulty = request.GET.get("difficulty") or request.query_params.get("difficulty")
        question_type = request.GET.get("question_type") or request.query_params.get("question_type")
        limit_param = request.GET.get("limit") or request.query_params.get("limit") or "10"
        limit = int(limit_param)
        
        # Build query
        questions = Question.objects.filter(is_active=True)
        
        # Filter by topic_id (preferred) or topic name
        if topic_id:
            try:
                questions = questions.filter(topic_id=int(topic_id))
            except ValueError:
                return Response(
                    {"error": "topic_id must be an integer"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif topic_name:
            questions = questions.filter(topic__name__iexact=topic_name)
        
        if difficulty:
            try:
                difficulty = int(difficulty)
                questions = questions.filter(difficulty=difficulty)
            except ValueError:
                return Response(
                    {"error": "Difficulty must be integer 1-5"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if question_type:
            questions = questions.filter(question_type=question_type)
        
        # Get random questions
        total = questions.count()
        if total == 0:
            return Response(
                {"error": "No questions found with those filters"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get random sample
        limit = min(limit, total)
        random_questions = random.sample(list(questions), limit)
        
        return Response({
            "count": len(random_questions),
            "questions": [
                {
                    "id": q.id,
                    "question_id": q.id,  # keep both keys for frontend compatibility
                    "question_type": q.question_type,
                    "difficulty": q.difficulty,
                    "question_text": q.question_text,
                    "code_template": q.code_template,
                    "options": q.options,
                    "answer_key": q.answer_key,
                    "explanation": q.explanation,
                    "topic": q.topic.name if q.topic else None,
                }
                for q in random_questions
            ]
        })
    
    except Exception as e:
        logger.error(f"Error fetching questions: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@csrf_exempt
@add_cors_headers
def submit_answer(request):
    """
    Submit answer and track attempt
    
    POST data:
    {
        "question_id": 123,
        "answer": "user's answer"
    }
    """
    try:
        question_id = request.data.get("question_id")
        user_answer = request.data.get("answer")
        
        if not question_id or user_answer is None:
            return Response(
                {"error": "Missing question_id or answer"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response(
                {"error": "Question not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check answer
        check_result = check_answer(
            str(user_answer),
            question.answer_key,
            question.question_type,
            question.explanation
        )
        
        # Track attempt (only if user is logged in)
        attempt_id = None
        if request.user and request.user.is_authenticated:
            attempt = QuestionAttempt.objects.create(
                user=request.user,
                question=question,
                answer=user_answer,
                is_correct=check_result["correct"]
            )
            attempt_id = attempt.id
        
        return Response({
            "attempt_id": attempt_id,
            "correct": check_result["correct"],
            "feedback": check_result["feedback"],
            "correct_answer": check_result["correct_answer"],
            "explanation": question.explanation or ""
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@csrf_exempt
@add_cors_headers
def run_code(request):
    """
    Run user's code against test cases
    
    POST data:
    {
        "question_id": 123,
        "code": "user's Python code"
    }
    """
    try:
        from .code_executor import execute_code_with_tests
        
        question_id = request.data.get("question_id")
        code = request.data.get("code")
        
        if not question_id or not code:
            return Response(
                {"error": "question_id and code are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get question
        try:
            question = Question.objects.get(id=question_id, is_active=True)
        except Question.DoesNotExist:
            return Response(
                {"error": "Question not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if question has test cases. If none, fall back to simple validation so the user is not blocked.
        if not question.test_cases:
            fallback = check_answer(
                str(code),
                question.answer_key,
                question.question_type,
                question.explanation,
            )

            if request.user and request.user.is_authenticated:
                QuestionAttempt.objects.create(
                    user=request.user,
                    question=question,
                    answer=code,
                    is_correct=fallback.get("correct", False),
                )

            return Response({
                "passed": 1 if fallback.get("correct") else 0,
                "failed": 0 if fallback.get("correct") else 1,
                "total": 1,
                "all_passed": bool(fallback.get("correct")),
                "test_results": [
                    {
                        "test_num": 1,
                        "input": "(no test cases configured)",
                        "expected": question.answer_key or "(n/a)",
                        "actual": "(not executed)",
                        "passed": bool(fallback.get("correct")),
                    }
                ],
                "feedback": fallback.get("feedback", ""),
                "correct_answer": fallback.get("correct_answer", ""),
                "explanation": question.explanation or "",
            }, status=status.HTTP_200_OK)
        
        # Execute code with test cases
        result = execute_code_with_tests(code, question.test_cases)
        
        # Save attempt if user is authenticated
        if request.user and request.user.is_authenticated:
            QuestionAttempt.objects.create(
                user=request.user,
                question=question,
                answer=code,
                is_correct=result['all_passed']
            )
        
        return Response({
            "passed": result['passed'],
            "failed": result['failed'],
            "total": result['total'],
            "all_passed": result['all_passed'],
            "test_results": result['results']
        })
    
    except Exception as e:
        logger.error(f"Error running code: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@csrf_exempt
@add_cors_headers
def get_user_attempts(request):
    """Get current user's question attempts"""
    try:
        # If no user is logged in, return empty results
        if not request.user or not request.user.is_authenticated:
            return Response({
                "count": 0,
                "correct": 0,
                "incorrect": 0,
                "attempts": []
            })
            
        attempts = QuestionAttempt.objects.filter(user=request.user).select_related('question')
        
        return Response({
            "count": attempts.count(),
            "correct": attempts.filter(is_correct=True).count(),
            "incorrect": attempts.filter(is_correct=False).count(),
            "attempts": [
                {
                    "id": a.id,
                    "question_id": a.question.id,
                    "question_text": a.question.question_text[:100],
                    "is_correct": a.is_correct,
                    "user_answer": a.answer,
                    "created_at": a.created_at.isoformat(),
                }
                for a in attempts[:50]  # Limit to last 50
            ]
        })
    
    except Exception as e:
        logger.error(f"Error fetching user attempts: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_topics(request):
    """Get list of available topics with lock status"""
    try:
        user = request.user if request.user.is_authenticated else None
        topics = Topic.objects.all().values('id', 'name', 'description', 'order')
        
        # Include question count, completion percentage, solved ids, and lock status per topic
        result = []
        for topic in topics:
            # Get question count
            available_count = Question.objects.filter(topic_id=topic['id'], is_active=True).count()
            topic['question_count'] = available_count
            
            # Calculate completion percentage if user is authenticated
            completion_percentage = 0
            is_locked = False
            solved_question_ids = []
            total_questions = 0
            correct_count = 0
            unlock_reason = ""
            
            distribution = getattr(settings, "QUESTION_DISTRIBUTION", DEFAULT_DISTRIBUTION)
            desired_total = sum([d.get("count", 0) for d in distribution]) or len(DEFAULT_DISTRIBUTION) * 3
            topic['question_distribution'] = distribution
            topic['total_questions'] = desired_total
            topic['available_questions'] = available_count

            if user:
                total_questions = desired_total

                # Count distinct correct attempts for this topic (most recent per question)
                attempts = (
                    QuestionAttempt.objects
                    .filter(user=user, question__topic_id=topic['id'], is_correct=True)
                    .order_by('-created_at')
                )
                seen_questions = set()
                for attempt in attempts:
                    qid = attempt.question_id
                    if qid in seen_questions:
                        continue
                    seen_questions.add(qid)
                    solved_question_ids.append({
                        "question_id": qid,
                        "index": len(solved_question_ids),
                    })
                correct_count = len(seen_questions)

                if total_questions > 0:
                    completion_percentage = int((correct_count / total_questions) * 100)

                # Check if topic is locked (previous topic must be completed)
                if topic['order'] > 1:
                    previous_topic = Topic.objects.filter(order=topic['order'] - 1).first()
                    if previous_topic:
                        prev_total = sum([d.get("count", 0) for d in distribution]) or len(DEFAULT_DISTRIBUTION) * 3

                        if prev_total > 0:
                            prev_correct = (
                                QuestionAttempt.objects
                                .filter(user=user, question__topic_id=previous_topic.id, is_correct=True)
                                .values('question_id')
                                .distinct()
                                .count()
                            )

                            prev_completion = int((prev_correct / prev_total) * 100)
                            is_locked = prev_completion < 80  # Lock if previous topic < 80%
                            if is_locked:
                                unlock_reason = "Selesaikan >=80% topik sebelumnya"
                        else:
                            is_locked = True  # Lock if previous topic has no questions
                            unlock_reason = "Topik sebelumnya belum tersedia"
            else:
                # Not authenticated - lock all topics except the first one
                is_locked = topic['order'] > 1
                if is_locked:
                    unlock_reason = "Masuk untuk membuka topik berikutnya"
            
            topic['completion_percentage'] = completion_percentage
            topic['correct_count'] = correct_count
            topic['total_questions'] = total_questions
            topic['solved_question_ids'] = solved_question_ids
            topic['question_distribution'] = distribution
            topic['is_locked'] = is_locked
            topic['unlock_reason'] = unlock_reason
            result.append(topic)
        
        # Sort by order
        result = sorted(result, key=lambda x: x['order'])
        
        return Response({
            "count": len(result),
            "topics": result
        })
    
    except Exception as e:
        logger.error(f"Error fetching topics: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )