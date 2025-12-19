import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question, QuestionAttempt
from django.contrib.auth.models import User

# Get all users
users = User.objects.all()
print(f"Found {users.count()} users in database\n")

for user in users:
    print(f"\n{'='*70}")
    print(f"USER: {user.username} (ID: {user.id})")
    print('='*70)
    
    topics = Topic.objects.all().order_by('order')
    
    for t in topics:
        print(f'\n📚 Topic {t.order}: {t.name}')
        print('-'*70)
        
        # Get all questions for this topic
        topic_questions = Question.objects.filter(topic=t, is_active=True)
        total_in_db = topic_questions.count()
        
        # Get all attempts for this user and topic
        all_attempts = QuestionAttempt.objects.filter(
            user=user,
            question__topic=t
        ).select_related('question')
        
        # Count unique questions attempted
        attempted_question_ids = set()
        correct_question_ids = set()
        
        for attempt in all_attempts:
            attempted_question_ids.add(attempt.question.id)
            if attempt.is_correct:
                correct_question_ids.add(attempt.question.id)
        
        # Also check latest attempt per question
        correct_count_latest = 0
        for q in topic_questions:
            latest = QuestionAttempt.objects.filter(
                user=user,
                question=q
            ).order_by('-created_at').first()
            
            if latest and latest.is_correct:
                correct_count_latest += 1
        
        # Calculate completion (NEW LOGIC)
        completed_count = min(correct_count_latest, 10)
        completion_percentage = int((completed_count / 10) * 100)
        
        print(f'   Total questions in DB: {total_in_db}')
        print(f'   Total attempts made: {all_attempts.count()}')
        print(f'   Unique questions attempted: {len(attempted_question_ids)}')
        print(f'   Unique questions correct (ever): {len(correct_question_ids)}')
        print(f'   Questions correct (latest attempt): {correct_count_latest}')
        print(f'   ---')
        print(f'   ✅ Completed count: {completed_count}/10')
        print(f'   ✅ Completion %: {completion_percentage}%')
        
        # Check unlock status for next topic
        if t.order < Topic.objects.count():
            next_topic = Topic.objects.filter(order=t.order + 1).first()
            if next_topic:
                is_unlocked = completed_count >= 10
                status = "🔓 UNLOCKED" if is_unlocked else "🔒 LOCKED"
                print(f'   → Next topic "{next_topic.name}": {status}')
                
                if not is_unlocked:
                    remaining = 10 - completed_count
                    print(f'      Need {remaining} more correct answers to unlock')

print(f"\n{'='*70}")
print("Analysis complete!")
