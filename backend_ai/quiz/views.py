import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Question, QuestionAttempt, Topic, Badge, UserBadge
from .services import generate_question, check_answer, generate_question_set, get_groq_client
from .auth_views import add_cors_headers
from django.views.decorators.csrf import csrf_exempt
import random
import logging

logger = logging.getLogger(__name__)

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
    If questions for the topic are insufficient (< 5), auto-generate them.
    
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
        
        target_topic = None
        
        # 1. Resolve Topic
        if topic_id:
            try:
                target_topic = Topic.objects.get(id=int(topic_id))
            except (ValueError, Topic.DoesNotExist):
                return Response(
                    {"error": "Invalid topic_id or topic not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif topic_name:
            target_topic = Topic.objects.filter(name__iexact=topic_name).first()
            
        # 2. Auto-generation logic (Generate Once)
        if target_topic:
            # Check current question count for this topic
            current_count = Question.objects.filter(topic=target_topic, is_active=True).count()
            
            # If less than 5 questions, generate more (target 10 total)
            if current_count < 5:
                logger.info(f"Topic '{target_topic.name}' has only {current_count} questions. Generating more...")
                try:
                    # Use a default difficulty of 2 if not provided
                    gen_diff = int(difficulty) if difficulty else 2
                    generate_question_set(
                        topic_name=target_topic.name,
                        difficulty=gen_diff,
                        count=10, 
                        mcq_count=5, 
                        max_workers=3
                    )
                except Exception as e:
                    logger.error(f"Auto-generation failed: {e}")
                    # Continue to try to return what we have
        
        # 3. Build query for result
        questions = Question.objects.filter(is_active=True)
        
        if target_topic:
             questions = questions.filter(topic=target_topic)
             
        if question_type:
            questions = questions.filter(question_type=question_type)

        # DEBUG LOGS - Print to console immediately
        print(f"🔍🔍🔍 DEBUG: target_topic = {target_topic}")
        print(f"🔍🔍🔍 DEBUG: target_topic.id = {target_topic.id if target_topic else 'None'}")
        total = questions.count()
        print(f"🔍🔍🔍 DEBUG: Total questions after filter = {total}")
        if total > 0:
            sample_topics = list(questions.values_list('topic_id', flat=True)[:10])
            print(f"🔍🔍🔍 DEBUG: Sample topic_ids in result = {sample_topics}")
            sample_ids = list(questions.values_list('id', flat=True)[:10])
            print(f"🔍🔍🔍 DEBUG: Sample question_ids = {sample_ids}")
        total = questions.count()
        logger.info(f"🔍 DEBUG: Total questions after filter = {total}")
        if total > 0:
            sample_topics = list(questions.values_list('topic_id', flat=True)[:5])
            logger.info(f"🔍 DEBUG: Sample topic_ids in result = {sample_topics}")

        # Get questions in consistent order (by ID)
        questions = questions.order_by('id')
        total = questions.count()
        if total == 0:
            return Response(
                {"error": "No questions found with those filters"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get first N questions in order (no randomization)
        limit = min(limit, total)
        ordered_questions = list(questions[:limit])
        
        return Response({
            "count": len(ordered_questions),
            "questions": [
                {
                    "question_id": q.id,
                    "question_type": q.question_type,
                    "difficulty": q.difficulty,
                    "question_text": q.question_text,
                    "code_template": q.code_template,
                    "options": q.options,
                    "topic": q.topic.name if q.topic else None,
                }
                for q in ordered_questions
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
        newly_unlocked_badges = []
        
        if request.user and request.user.is_authenticated:
            logger.info(f"✅ Saving attempt for user {request.user.username}, Q{question_id}, correct={check_result['correct']}")
            attempt = QuestionAttempt.objects.create(
                user=request.user,
                question=question,
                answer=user_answer,
                is_correct=check_result["correct"]
            )
            attempt_id = attempt.id
            
            # Auto-trigger badge check
            from .badge_service import BadgeService
            newly_unlocked_badges = BadgeService.check_and_unlock_badges(request.user, question)
            
            if newly_unlocked_badges:
                logger.info(f"🏆 Badges unlocked for {request.user.username}: {[b['badge_name'] for b in newly_unlocked_badges]}")
        else:
            logger.warning(f"⚠️ Attempt NOT saved - user not authenticated. request.user: {request.user}, is_authenticated: {request.user.is_authenticated if request.user else 'N/A'}")
        
        return Response({
            "attempt_id": attempt_id,
            "correct": check_result["correct"],
            "feedback": check_result["feedback"],
            "correct_answer": check_result["correct_answer"],
            "explanation": question.explanation or "",
            "saved": attempt_id is not None,  # Indicate if attempt was saved
            "authenticated": request.user.is_authenticated if request.user else False,  # Auth status
            "newly_unlocked_badges": newly_unlocked_badges  # New badges unlocked
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
        
        # Check if question has test cases
        if not question.test_cases:
            return Response(
                {"error": "This question has no test cases"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
    """Get current user's question attempts for a specific topic or all topics"""
    try:
        # If no user is logged in, return empty results
        if not request.user or not request.user.is_authenticated:
            return Response({
                "count": 0,
                "correct": 0,
                "incorrect": 0,
                "attempts": []
            })
        
        # ✅ GET topic_id dari query params
        topic_id = request.GET.get("topic_id") or request.query_params.get("topic_id")
        
        # ✅ JIKA topic_id tidak ada, kosong, 0, atau "all" = ambil semua topics
        if not topic_id or topic_id == "0" or topic_id == "all":
            # AMBIL SEMUA ATTEMPTS
            attempts = QuestionAttempt.objects.filter(
                user=request.user
            ).select_related('question', 'question__topic')
            
            correct_attempts = attempts.filter(is_correct=True)
            
            return Response({
                "count": attempts.count(),
                "correct": correct_attempts.count(),
                "incorrect": attempts.filter(is_correct=False).count(),
                "attempts": [
                    {
                        "id": a.id,
                        "question_id": a.question.id,
                        "question_text": a.question.question_text[:100],
                        "is_correct": a.is_correct,
                        "user_answer": a.answer,
                        "topic_id": a.question.topic.id if a.question.topic else None,
                        "topic_name": a.question.topic.name if a.question.topic else None,
                        "created_at": a.created_at.isoformat(),
                    }
                    for a in attempts[:50]  # Limit to last 50
                ]
            })
        
        # ✅ JIKA topic_id ada = validasi dan filter untuk topic specific
        try:
            topic_id = int(topic_id)
            # Verify topic exists
            topic = Topic.objects.get(id=topic_id)
        except (ValueError, Topic.DoesNotExist):
            return Response({
                "error": "Invalid topic_id",
                "count": 0,
                "correct": 0,
                "incorrect": 0,
                "attempts": []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ FILTER ATTEMPTS hanya untuk questions dalam topic ini
        attempts = QuestionAttempt.objects.filter(
            user=request.user,
            question__topic_id=topic_id
        ).select_related('question', 'question__topic')
        
        correct_attempts = attempts.filter(is_correct=True)
        
        return Response({
            "count": attempts.count(),
            "correct": correct_attempts.count(),
            "incorrect": attempts.filter(is_correct=False).count(),
            "attempts": [
                {
                    "id": a.id,
                    "question_id": a.question.id,
                    "question_text": a.question.question_text[:100],
                    "is_correct": a.is_correct,
                    "user_answer": a.answer,
                    "topic_id": a.question.topic.id if a.question.topic else None,
                    "topic_name": a.question.topic.name if a.question.topic else None,
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
                # Include question count, completion percentage, and lock status per topic
        result = []
        for topic in topics:
            # Get question count
            count = Question.objects.filter(topic_id=topic['id'], is_active=True).count()
            topic['question_count'] = count
            
            # Calculate completion percentage if user is authenticated
            completion_percentage = 0
            completed_count = 0
            is_locked = False
            
            if user:
                # Get user's attempts for this topic
                topic_questions = Question.objects.filter(topic_id=topic['id'], is_active=True)
                
                # Count correct attempts (only the most recent attempt per question)
                correct_count = 0
                for question in topic_questions:
                    # Get latest attempt for this question
                    latest_attempt = QuestionAttempt.objects.filter(
                        user=user,
                        question=question
                    ).order_by('-created_at').first()
                    
                    if latest_attempt and latest_attempt.is_correct:
                        correct_count += 1
                
                # Calculate completion based on 10 questions max (not total in database)
                # This ensures users can unlock next topic after completing 10 questions
                completed_count = min(correct_count, 10)
                completion_percentage = int((completed_count / 10) * 100)
                
                # Check if topic is locked (previous topic must be completed)
                if topic['order'] > 1:
                    # Get previous topic
                    previous_topic = Topic.objects.filter(order=topic['order'] - 1).first()
                    if previous_topic:
                        # Check if previous topic is completed (10 questions correct)
                        prev_questions = Question.objects.filter(topic_id=previous_topic.id, is_active=True)
                        
                        prev_correct = 0
                        for question in prev_questions:
                            latest_attempt = QuestionAttempt.objects.filter(
                                user=user,
                                question=question
                            ).order_by('-created_at').first()
                            
                            if latest_attempt and latest_attempt.is_correct:
                                prev_correct += 1
                        
                        # Previous topic must have at least 10 correct answers to unlock
                        prev_completed = min(prev_correct, 10)
                        is_locked = prev_completed < 10  # Lock if previous topic has less than 10 correct
                    else:
                        is_locked = True  # Lock if previous topic doesn't exist
            else:
                # Not authenticated - lock all topics except the first one
                is_locked = topic['order'] > 1
            
            topic['completion_percentage'] = completion_percentage
            topic['completed_count'] = completed_count  # Add completed count (X/10)
            topic['is_locked'] = is_locked
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


# ============================================
# BADGE ENDPOINTS
# ============================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@add_cors_headers
def get_user_badges(request):
    """
    Get user's earned badges and progress towards all badges
    
    Returns:
    {
        "earned": [...list of earned badges],
        "progress": {...progress data},
        "total_earned": 5
    }
    """
    try:
        from .badge_service import BadgeService
        
        badge_data = BadgeService.get_user_badges(request.user)
        
        return Response(badge_data)
    
    except Exception as e:
        logger.error(f"Error fetching user badges: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([AllowAny])
@add_cors_headers
def get_all_badges(request):
    """
    Get all available badges
    
    Returns list of all badges with their requirements
    """
    try:
        from .serializers import BadgeSerializer
        
        badges = Badge.objects.filter(is_active=True).order_by('badge_type')
        serializer = BadgeSerializer(badges, many=True)
        
        return Response({
            "count": badges.count(),
            "badges": serializer.data
        })
    
    except Exception as e:
        logger.error(f"Error fetching badges: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@csrf_exempt
@add_cors_headers
def check_badge_unlock(request):
    """
    Manually trigger badge check (optional, biasanya auto-triggered saat submit answer)
    
    POST data:
    {
        "question_id": 123  // optional, untuk check topic-specific badges
    }
    """
    try:
        from .badge_service import BadgeService
        
        question_id = request.data.get("question_id")
        question = None
        
        if question_id:
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                pass
        
        # Check dan unlock badges
        newly_unlocked = BadgeService.check_and_unlock_badges(request.user, question)
        
        return Response({
            "newly_unlocked": newly_unlocked,
            "count": len(newly_unlocked)
        })
    
    except Exception as e:
        logger.error(f"Error checking badges: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@csrf_exempt
@add_cors_headers
def chat_bot(request):
    """
    Chatbot endpoint for answering questions
    
    POST data:
    {
        "message": "user's question",
        "topic": "optional topic filter",
        "max_tokens": 220  // optional, default 220, max 400
    }
    """
    message = (request.data.get("message") or "").strip()
    topic = (request.data.get("topic") or "").strip()
    try:
        max_tokens = min(int(request.data.get("max_tokens", 220)), 400)
    except Exception:
        max_tokens = 220

    if not message:
        return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)
    if len(message) > 500:
        message = message[:500]

    system_prompt = (
        "Kamu tutor singkat untuk coding dan materi belajar di aplikasi. "
        "Jawab ringkas (<80 kata), bahasa Indonesia, beri contoh kode jika perlu. "
        "Jika pertanyaan di luar coding/materi, tolak dengan sopan dan singkat."
    )
    user_content = f"Topik: {topic}\nPertanyaan: {message}" if topic else message

    try:
        completion = get_groq_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.35,
            max_tokens=max_tokens,
        )
        answer = (completion.choices[0].message.content or "").strip()
        return Response({"answer": answer, "usage": getattr(completion, "usage", None)})
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return Response({"error": "chatbot unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@add_cors_headers
def get_pretest_questions(request):
    """
    Get all pretest questions (diagnostic test)
    Returns questions from all topics marked as is_pretest=True
    """
    try:
        pretest_questions = Question.objects.filter(
            is_pretest=True,
            is_active=True
        ).select_related('topic').order_by('topic__order', 'difficulty')
        
        questions_data = []
        for q in pretest_questions:
            questions_data.append({
                "question_id": q.id,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "topic": q.topic.name if q.topic else "General",
                "topic_id": q.topic.id if q.topic else None,
                "question_text": q.question_text,
                "code_template": q.code_template,
                "options": q.options,
                "explanation": q.explanation,
            })
        
        return Response({
            "questions": questions_data,
            "total": len(questions_data)
        })
    except Exception as e:
        logger.error(f"Error fetching pretest questions: {e}")
        return Response(
            {"error": "Failed to fetch pretest questions"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@add_cors_headers
def submit_pretest(request):
    """
    Submit pretest results and get topic recommendations
    
    POST data:
    {
        "answers": [
            {"question_id": 1, "user_answer": "A"},
            {"question_id": 2, "user_answer": "variable"},
            ...
        ]
    }
    
    Returns topic-by-topic analysis with recommended difficulty levels
    """
    try:
        answers = request.data.get("answers", [])
        if not answers:
            return Response(
                {"error": "answers array is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        topic_results = {}  # {topic_id: {"correct": 0, "total": 0, "topic_name": ""}}
        
        # Process each answer
        for answer_data in answers:
            question_id = answer_data.get("question_id")
            user_answer = answer_data.get("user_answer")
            
            try:
                question = Question.objects.get(id=question_id, is_pretest=True)
            except Question.DoesNotExist:
                continue
            
            # Check answer
            result = check_answer(
                user_answer=user_answer,
                correct_answer=question.answer_key,
                question_type=question.question_type,
                explanation=question.explanation or ""
            )
            is_correct = result.get("correct", False)
            
            # Save attempt
            QuestionAttempt.objects.create(
                user=user,
                question=question,
                answer=user_answer,
                is_correct=is_correct
            )
            
            # Track by topic
            if question.topic:
                topic_id = question.topic.id
                if topic_id not in topic_results:
                    topic_results[topic_id] = {
                        "topic_id": topic_id,
                        "topic_name": question.topic.name,
                        "correct": 0,
                        "total": 0,
                        "score": 0,
                        "recommended_difficulty": 1
                    }
                
                topic_results[topic_id]["total"] += 1
                if is_correct:
                    topic_results[topic_id]["correct"] += 1
        
        # Calculate scores and recommendations
        for topic_id, data in topic_results.items():
            if data["total"] > 0:
                score = round((data["correct"] / data["total"]) * 100)
                data["score"] = score
                
                # Recommend difficulty based on score
                if score >= 80:
                    data["recommended_difficulty"] = 3  # Hard
                elif score >= 50:
                    data["recommended_difficulty"] = 2  # Medium
                else:
                    data["recommended_difficulty"] = 1  # Easy
        
        # Calculate overall score
        total_correct = sum(d["correct"] for d in topic_results.values())
        total_questions = sum(d["total"] for d in topic_results.values())
        overall_score = round((total_correct / total_questions) * 100) if total_questions > 0 else 0
        
        return Response({
            "overall_score": overall_score,
            "total_correct": total_correct,
            "total_questions": total_questions,
            "topic_recommendations": list(topic_results.values())
        })
        
    except Exception as e:
        logger.error(f"Error submitting pretest: {e}")
        return Response(
            {"error": f"Failed to submit pretest: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
