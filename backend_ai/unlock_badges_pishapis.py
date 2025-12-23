import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from django.contrib.auth.models import User
from quiz.models import Topic
from quiz.badge_service import BadgeService

# Get pishapis user
try:
    user = User.objects.get(username='pishapis')
except User.DoesNotExist:
    print("User pishapis not found")
    exit()

print(f"Unlocking badges for {user.username}...")
print("=" * 60)

# Check and unlock all topic badges
topics = Topic.objects.all()
newly_unlocked = []

for topic in topics:
    badge = BadgeService._check_topic_100_badge(user, topic)
    if badge:
        newly_unlocked.append(badge)
        print(f"✅ Unlocked: {badge['badge_name']}")

# Check and unlock progress badges
progress_badges = BadgeService._check_progress_badges(user)
newly_unlocked.extend(progress_badges)

for badge in progress_badges:
    print(f"✅ Unlocked: {badge['badge_name']}")

print("\n" + "=" * 60)
print(f"🏆 Newly unlocked badges: {len(newly_unlocked)}")

# Get all badges
all_badges = BadgeService.get_user_badges(user)
print(f"📊 Total badges for {user.username}: {all_badges['total_earned']}")
print("\nAll badges:")
for badge in all_badges['earned']:
    print(f"  🏆 {badge['name']} - {badge['topic_name'] or 'General'}")
