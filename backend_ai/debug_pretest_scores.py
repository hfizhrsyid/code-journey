import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, QuestionAttempt
from django.contrib.auth.models import User

# Get latest user
user = User.objects.last()
print(f'Latest user: {user.username}')

# Get recent pretest attempts
attempts = QuestionAttempt.objects.filter(
    user=user, 
    question__is_pretest=True
).order_by('-created_at')[:20]

print(f'\nRecent pretest attempts: {attempts.count()}')
for a in attempts:
    topic_name = a.question.topic.name if a.question.topic else "No topic"
    status = "✓" if a.is_correct else "✗"
    print(f'  Q{a.question.id} ({topic_name}): {status}')

# Calculate per-topic stats
from collections import defaultdict
topic_stats = defaultdict(lambda: {"correct": 0, "total": 0})

for a in attempts:
    if a.question.topic:
        topic_name = a.question.topic.name
        topic_stats[topic_name]["total"] += 1
        if a.is_correct:
            topic_stats[topic_name]["correct"] += 1

print(f'\n📊 Per-topic breakdown:')
for topic, stats in topic_stats.items():
    score = round((stats["correct"] / stats["total"]) * 100) if stats["total"] > 0 else 0
    print(f'  {topic}: {stats["correct"]}/{stats["total"]} = {score}%')

# Check how many pretest questions per topic
print(f'\n📋 Pretest questions available per topic:')
from django.db.models import Count
pretest_by_topic = Question.objects.filter(is_pretest=True).values('topic__name').annotate(count=Count('id'))
for item in pretest_by_topic:
    print(f'  {item["topic__name"]}: {item["count"]} questions')
