import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, QuestionAttempt
from django.contrib.auth import get_user_model

User = get_user_model()

# Get pretest questions
pretest_questions = Question.objects.filter(is_pretest=True).order_by('id')

print(f"\n📊 Total Pretest Questions: {pretest_questions.count()}")
print("\n" + "="*80)

# Show sample questions
for q in pretest_questions[:5]:
    print(f"\nQuestion ID: {q.id}")
    print(f"Topic: {q.topic.name if q.topic else 'N/A'}")
    print(f"Type: {q.question_type}")
    print(f"Text: {q.question_text[:80]}...")
    print(f"Answer Key: {q.answer_key}")
    
print("\n" + "="*80)

# Check if there are any recent pretest attempts
recent_attempts = QuestionAttempt.objects.filter(
    question__is_pretest=True
).order_by('-created_at')[:10]

print(f"\n📝 Recent Pretest Attempts: {recent_attempts.count()}")

for attempt in recent_attempts:
    print(f"\nUser: {attempt.user.username}")
    print(f"Question ID: {attempt.question.id} - {attempt.question.question_text[:50]}...")
    print(f"User Answer: {attempt.answer}")
    print(f"Correct Answer: {attempt.question.answer_key}")
    print(f"Is Correct: {attempt.is_correct}")
    print(f"Timestamp: {attempt.created_at}")

print("\n" + "="*80)

# Check for a specific user
print("\nEnter username to check their pretest attempts (or press Enter to skip): ")
username = input().strip()

if username:
    try:
        user = User.objects.get(username=username)
        user_attempts = QuestionAttempt.objects.filter(
            user=user,
            question__is_pretest=True
        ).order_by('created_at')
        
        print(f"\n👤 User: {username}")
        print(f"Total Pretest Attempts: {user_attempts.count()}")
        
        correct_count = user_attempts.filter(is_correct=True).count()
        total_count = user_attempts.count()
        
        print(f"Correct Answers: {correct_count}/{total_count}")
        
        if user_attempts.exists():
            print("\nDetailed Attempts:")
            for attempt in user_attempts:
                status = "✅" if attempt.is_correct else "❌"
                print(f"{status} Q{attempt.question.id}: {attempt.answer} (Correct: {attempt.question.answer_key})")
    except User.DoesNotExist:
        print(f"❌ User '{username}' not found")
