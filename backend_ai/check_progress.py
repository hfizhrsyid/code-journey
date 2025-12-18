#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic, QuestionAttempt
from django.contrib.auth.models import User

print("=" * 60)
print("Checking User Progress")
print("=" * 60)

# Show recent users
recent_users = User.objects.all().order_by('-last_login')[:5]
print("\nRecent Users:")
for user in recent_users:
    print(f"  - {user.username} (last login: {user.last_login})")

# Get the most recent user (likely the one testing)
user = recent_users.first() if recent_users.exists() else None

if user:
    print(f"\n{'=' * 60}")
    print(f"Progress for user: {user.username}")
    print(f"{'=' * 60}")
    
    topics = Topic.objects.all().order_by('order')
    for topic in topics:
        print(f"\nTopic: {topic.name}")
        
        # Get progressive questions (same logic as backend)
        all_questions = Question.objects.filter(topic=topic, is_active=True).order_by('difficulty')
        byDifficulty = {1: [], 2: [], 3: []}
        for q in all_questions:
            if q.difficulty in byDifficulty:
                byDifficulty[q.difficulty].append(q)
        
        progressive_questions = []
        progressive_questions.extend(byDifficulty[1][:3])  # 3 easy
        progressive_questions.extend(byDifficulty[2][:4])  # 4 medium  
        progressive_questions.extend(byDifficulty[3][:3])  # 3 hard
        
        total = len(progressive_questions)
        print(f"  Progressive questions: {total}")
        print(f"  (D1: {len(byDifficulty[1][:3])}, D2: {len(byDifficulty[2][:4])}, D3: {len(byDifficulty[3][:3])})")
        
        # Count correct attempts
        correct = 0
        for q in progressive_questions:
            latest = QuestionAttempt.objects.filter(
                user=user,
                question=q
            ).order_by('-created_at').first()
            
            if latest and latest.is_correct:
                correct += 1
        
        percentage = int((correct / total) * 100) if total > 0 else 0
        print(f"  Correct answers: {correct}/{total}")
        print(f"  Progress: {percentage}%")
        
        # Show all attempts for this topic
        all_attempts = QuestionAttempt.objects.filter(
            user=user,
            question__topic=topic
        ).order_by('-created_at')[:10]
        
        if all_attempts.exists():
            print(f"  Recent attempts:")
            for attempt in all_attempts:
                status = "✓" if attempt.is_correct else "✗"
                print(f"    {status} Q{attempt.question.id} (D{attempt.question.difficulty}) - {attempt.created_at.strftime('%H:%M:%S')}")

print("\n" + "=" * 60)
