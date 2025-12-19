import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question, QuestionAttempt
from django.contrib.auth.models import User

# Get the most recent user (likely the one testing)
user = User.objects.last()
if not user:
    print("No users found!")
    exit(1)

print(f"Analyzing user: {user.username} (ID: {user.id})\n")
print("="*70)

# Check first topic specifically
topic = Topic.objects.filter(order=1).first()
if not topic:
    print("No topics found!")
    exit(1)

print(f"\n📚 Topic 1: {topic.name}")
print("-"*70)

# Get attempts for this topic
attempts = QuestionAttempt.objects.filter(
    user=user,
    question__topic=topic
).select_related('question').order_by('created_at')

print(f"\nTotal attempts: {attempts.count()}")

# Get unique questions
unique_questions = {}
for attempt in attempts:
    qid = attempt.question.id
    if qid not in unique_questions:
        unique_questions[qid] = []
    unique_questions[qid].append({
        'is_correct': attempt.is_correct,
        'created_at': attempt.created_at
    })

print(f"Unique questions attempted: {len(unique_questions)}")

# Count correct (latest attempt)
correct_count = 0
for qid, attempt_list in unique_questions.items():
    latest = attempt_list[-1]  # Last attempt
    if latest['is_correct']:
        correct_count += 1

print(f"Correct answers (latest attempt): {correct_count}")

# REPORT CARD CALCULATION (OLD)
report_card_total = len(unique_questions)
report_card_percentage = int((correct_count / report_card_total) * 100) if report_card_total > 0 else 0

# BACKEND CALCULATION (NEW)
backend_completed = min(correct_count, 10)
backend_percentage = int((backend_completed / 10) * 100)

print("\n" + "="*70)
print("COMPARISON:")
print("="*70)
print(f"📱 REPORT CARD shows: {correct_count}/{report_card_total} = {report_card_percentage}%")
print(f"🔧 BACKEND calculates: {backend_completed}/10 = {backend_percentage}%")

if report_card_percentage != backend_percentage:
    print(f"\n⚠️  MISMATCH DETECTED!")
    print(f"   Report card and backend use different calculations!")
    print(f"   This is why the unlock status appears inconsistent.")

# Check unlock status
print("\n" + "="*70)
print("UNLOCK STATUS:")
print("="*70)

next_topic = Topic.objects.filter(order=2).first()
if next_topic:
    is_unlocked = backend_completed >= 10
    print(f"Next topic: {next_topic.name}")
    print(f"Status: {'🔓 UNLOCKED' if is_unlocked else '🔒 LOCKED'}")
    
    if not is_unlocked:
        remaining = 10 - backend_completed
        print(f"Need {remaining} more correct answers to unlock")
    
    print(f"\nNote: Backend requires {backend_completed}/10 correct answers")
    print(f"      You currently have {correct_count} correct (latest attempts)")
