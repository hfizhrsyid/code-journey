import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question, QuestionAttempt
from django.contrib.auth.models import User

# Get first user
user = User.objects.first()
if not user:
    print("No users found in database!")
    exit(1)

print(f'Testing with user: {user.username}\n')
print('=' * 60)

topics = Topic.objects.all().order_by('order')

for t in topics:
    print(f'\n📚 Topic {t.order}: {t.name}')
    print('-' * 60)
    
    # Get all questions for this topic
    topic_questions = Question.objects.filter(topic=t, is_active=True)
    total_in_db = topic_questions.count()
    
    # Count correct answers
    correct_count = 0
    attempted_count = 0
    
    for q in topic_questions:
        attempts = QuestionAttempt.objects.filter(user=user, question=q)
        if attempts.exists():
            attempted_count += 1
            latest_attempt = attempts.order_by('-created_at').first()
            if latest_attempt.is_correct:
                correct_count += 1
    
    # Calculate completion (max 10) - NEW LOGIC
    completed_count = min(correct_count, 10)
    completion_percentage = int((completed_count / 10) * 100)
    
    # OLD LOGIC (for comparison)
    old_completion = int((correct_count / total_in_db) * 100) if total_in_db > 0 else 0
    
    print(f'   Total questions in DB: {total_in_db}')
    print(f'   Questions attempted: {attempted_count}')
    print(f'   Correct answers: {correct_count}')
    print(f'   ---')
    print(f'   ❌ OLD Logic: {correct_count}/{total_in_db} = {old_completion}%')
    print(f'   ✅ NEW Logic: {completed_count}/10 = {completion_percentage}%')
    
    # Check unlock status
    if completed_count >= 10:
        print(f'   🔓 Status: COMPLETED - Next topic will be UNLOCKED')
    elif completed_count > 0:
        print(f'   🔒 Status: IN PROGRESS ({10 - completed_count} more needed to unlock next)')
    else:
        print(f'   🔒 Status: NOT STARTED')

print('\n' + '=' * 60)
print('\n✅ Test completed! The new logic ensures topics unlock after 10 correct answers.')
