import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Question, QuestionAttempt
from .services import generate_question, check_answer, generate_question_set
import random
import logging

logger = logging.getLogger(__name__)

@api_view(["POST"])
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
def generate_question_set_view(request):
    """Generate a set of questions for a given topic"""
    try:
        topic = request.data.get("topic")
        difficulty = request.data.get("difficulty", 2)
        count = int(request.data.get("count", 10))
        mcq_count = int(request.data.get("mcq_count", 5))

        if not topic:
            return Response({"error": "Missing topic"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            difficulty = int(difficulty)
        except (ValueError, TypeError):
            return Response({"error": "Invalid difficulty"}, status=status.HTTP_400_BAD_REQUEST)

        if count <= 0 or mcq_count < 0 or mcq_count > count:
            return Response({"error": "Invalid counts"}, status=status.HTTP_400_BAD_REQUEST)

        questions = generate_question_set(topic, difficulty, count, mcq_count)

        return Response({
            "success": True,
            "created_count": len(questions),
            "questions": questions
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )