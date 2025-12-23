import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from django.contrib.auth.models import User
from quiz.models import QuestionAttempt, Topic
from quiz.badge_service import BadgeService

# Get a user
try:
    user = User.objects.get(username='Rama')
except User.DoesNotExist:
    user = User.objects.first()
    
if not user:
    print("No users found")
    exit()

print(f"Testing badge unlock for user: {user.username}")
print("=" * 60)

# Check attempts per topic
topics = Topic.objects.all()
for topic in topics:
    correct_attempts = QuestionAttempt.objects.filter(
        user=user,
        question__topic=topic,
        is_correct=True
    ).values('question_id').distinct()
    
    count = correct_attempts.count()
    print(f"\n{topic.name}:")
    print(f"  Correct answers (unique questions): {count}/10")
    
    if count >= 10:
        print(f"  ✅ Should unlock badge!")
        # Try to unlock
        badge = BadgeService._check_topic_100_badge(user, topic)
        if badge:
            print(f"  🏆 Badge unlocked: {badge['badge_name']}")
        else:
            print(f"  ⚠️ Badge already unlocked or doesn't exist")
    else:
        print(f"  ❌ Need {10 - count} more correct answers")

print("\n" + "=" * 60)
print("Checking all badges for this user:")
badges_info = BadgeService.get_user_badges(user)
print(f"Total earned badges: {badges_info['total_earned']}")
for badge in badges_info['earned']:
    print(f"  🏆 {badge['name']} - {badge['topic_name'] or 'General'}")
