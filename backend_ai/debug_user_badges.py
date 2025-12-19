# code-journey/backend_ai/debug_user_badges.py

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from django.contrib.auth.models import User
from quiz.models import QuestionAttempt, Topic, Badge, UserBadge
from quiz.badge_service import BadgeService

def debug_user_badges(username):
    """Debug kenapa badge user belum unlock"""
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        print(f"❌ User '{username}' tidak ditemukan")
        return
    
    print(f"\n{'='*60}")
    print(f"🔍 DEBUGGING BADGES UNTUK: {user.username}")
    print(f"{'='*60}\n")
    
    # 1. Check total attempts
    total_attempts = QuestionAttempt.objects.filter(user=user).count()
    correct_attempts = QuestionAttempt.objects.filter(user=user, is_correct=True).count()
    overall_accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
    
    print(f"📊 OVERALL STATS:")
    print(f"   Total attempts: {total_attempts}")
    print(f"   Correct: {correct_attempts}")
    print(f"   Overall accuracy: {overall_accuracy:.2f}%\n")
    
    # 2. Check per-topic accuracy
    print(f"📚 PER-TOPIC ACCURACY:")
    topics = Topic.objects.all()
    
    for topic in topics:
        attempts = QuestionAttempt.objects.filter(user=user, question__topic=topic)
        total = attempts.count()
        
        if total > 0:
            correct = attempts.filter(is_correct=True).count()
            accuracy = (correct / total * 100)
            
            print(f"\n   Topic: {topic.name} (ID: {topic.id})")
            print(f"   ├─ Total attempts: {total}")
            print(f"   ├─ Correct: {correct}")
            print(f"   ├─ Wrong: {total - correct}")
            print(f"   └─ Accuracy: {accuracy:.2f}%")
            
            # Show all attempts
            print(f"   Attempts detail:")
            for attempt in attempts.order_by('created_at'):
                status = "✅" if attempt.is_correct else "❌"
                print(f"      {status} Q{attempt.question.id}: {attempt.answer[:50]}")
    
    # 3. Check existing badges
    print(f"\n\n🏆 BADGES AVAILABLE:")
    all_badges = Badge.objects.filter(is_active=True)
    print(f"   Total badges in system: {all_badges.count()}")
    
    for badge in all_badges:
        topic_name = badge.topic.name if badge.topic else "Overall"
        print(f"   - {badge.name} ({topic_name}) - Type: {badge.badge_type}")
    
    # 4. Check earned badges
    print(f"\n\n🎖️  BADGES EARNED:")
    earned = UserBadge.objects.filter(user=user)
    
    if earned.count() == 0:
        print(f"   ⚠️  Tidak ada badge yang earned!")
    else:
        for ub in earned:
            print(f"   ✅ {ub.badge.name} - Earned at: {ub.earned_at}")
    
    # 5. Try to manually trigger badge check
    print(f"\n\n🔄 MANUAL BADGE CHECK:")
    print(f"   Mencoba unlock badges...")
    
    for topic in topics:
        attempts = QuestionAttempt.objects.filter(user=user, question__topic=topic)
        if attempts.count() > 0:
            # Get last question from this topic
            last_question = attempts.last().question
            newly_unlocked = BadgeService.check_and_unlock_badges(user, last_question)
            
            if newly_unlocked:
                print(f"   ✨ NEW BADGES UNLOCKED for {topic.name}:")
                for badge in newly_unlocked:
                    print(f"      🏆 {badge['badge_name']}")
            else:
                print(f"   - No new badges for {topic.name}")
    
    # Overall progress badges
    print(f"\n   Checking overall progress badges...")
    progress_badges = BadgeService._check_progress_badges(user)
    if progress_badges:
        print(f"   ✨ NEW PROGRESS BADGES:")
        for badge in progress_badges:
            print(f"      🏆 {badge['badge_name']}")
    else:
        print(f"   - No new progress badges")
    
    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_user_badges.py <username>")
        sys.exit(1)
    
    username = sys.argv[1]
    debug_user_badges(username)