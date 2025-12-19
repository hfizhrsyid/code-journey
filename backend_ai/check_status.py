import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question, QuestionAttempt
from django.contrib.auth.models import User
import sys

# Get the most recent user
user = User.objects.last()
if not user:
    print("No users found!")
    sys.exit(1)

print(f"User: {user.username}")
print("="*60)

# Check first topic
topic = Topic.objects.filter(order=1).first()
attempts = QuestionAttempt.objects.filter(
    user=user,
    question__topic=topic
).select_related('question')

# Get unique questions and count correct
unique_q = {}
for a in attempts:
    if a.question.id not in unique_q:
        unique_q[a.question.id] = []
    unique_q[a.question.id].append(a)

correct = sum(1 for qid, atts in unique_q.items() 
              if atts[-1].is_correct)

total_attempted = len(unique_q)

# Calculations
report_card_pct = int((correct / total_attempted) * 100) if total_attempted > 0 else 0
backend_completed = min(correct, 10)
backend_pct = int((backend_completed / 10) * 100)

print(f"\nTopic: {topic.name}")
print(f"Questions attempted: {total_attempted}")
print(f"Correct answers: {correct}")
print(f"\nReport Card: {correct}/{total_attempted} = {report_card_pct}%")
print(f"Backend: {backend_completed}/10 = {backend_pct}%")
print(f"\nUnlock status: {'UNLOCKED' if backend_completed >= 10 else 'LOCKED'}")
if backend_completed < 10:
    print(f"Need {10 - backend_completed} more correct to unlock")
