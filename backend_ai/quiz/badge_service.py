"""
Badge service untuk handle logika unlock badge
"""
from django.db.models import Q, Count, Avg
from .models import Badge, UserBadge, QuestionAttempt, Topic, Question
from django.contrib.auth.models import User


class BadgeService:
    """Service untuk manage badges dan unlock logic"""
    
    @staticmethod
    def check_and_unlock_badges(user: User, question=None):
        """
        Check apakah user berhak unlock badge setelah submit jawaban
        
        Args:
            user: User object
            question: Question object (optional, untuk check topic-specific badges)
        
        Returns:
            List of newly unlocked badges
        """
        newly_unlocked = []
        
        if not user:
            return newly_unlocked
        
        # Check topic accuracy badges (100% pada topic tertentu)
        if question and question.topic:
            topic_badge = BadgeService._check_topic_100_badge(user, question.topic)
            if topic_badge:
                newly_unlocked.append(topic_badge)
        
        # Check overall progress badges (25%, 50%, 75%, 100%)
        progress_badges = BadgeService._check_progress_badges(user)
        newly_unlocked.extend(progress_badges)
        
        return newly_unlocked
    
    @staticmethod
    def _check_topic_100_badge(user: User, topic: Topic) -> dict | None:
        """
        Check if user completed a topic (10 correct answers)
        
        User gets badge when:
        - Answer 10 different questions correctly in this topic
        
        Returns:
            Dict with badge info or None if not unlocked
        """
        # Get user's correct attempts for this topic
        correct_attempts = QuestionAttempt.objects.filter(
            user=user,
            question__topic=topic,
            is_correct=True
        ).values('question_id').distinct()
        
        unique_correct_count = correct_attempts.count()
        
        # Award badge if user answered 10 questions correctly
        if unique_correct_count >= 10:
            try:
                badge = Badge.objects.get(
                    badge_type='topic_100',
                    topic=topic
                )
                
                # Check if already unlocked
                existing = UserBadge.objects.filter(
                    user=user,
                    badge=badge
                ).exists()
                
                if not existing:
                    user_badge = UserBadge.objects.create(
                        user=user,
                        badge=badge
                    )
                    return {
                        'badge_id': badge.id,
                        'badge_name': badge.name,
                        'badge_type': badge.badge_type,
                        'topic_name': topic.name,
                        'icon': badge.icon
                    }
            except Badge.DoesNotExist:
                pass
        
        return None
    
    @staticmethod
    def _check_progress_badges(user: User) -> list:
        """
        Check apakah user mencapai milestone progress (25%, 50%, 75%, 100%)
        
        Returns:
            List of unlocked badges
        """
        newly_unlocked = []
        
        # Hitung overall accuracy
        user_attempts = QuestionAttempt.objects.filter(user=user)
        
        if user_attempts.count() == 0:
            return newly_unlocked
        
        overall_accuracy = (
            user_attempts.filter(is_correct=True).count() / user_attempts.count()
        ) * 100
        
        # Define milestones
        milestones = [
            ('progress_25', 25),
            ('progress_50', 50),
            ('progress_75', 75),
            ('progress_100', 100),
        ]
        
        for badge_type, threshold in milestones:
            if overall_accuracy >= threshold:
                try:
                    badge = Badge.objects.get(badge_type=badge_type)
                    
                    existing = UserBadge.objects.filter(
                        user=user,
                        badge=badge
                    ).exists()
                    
                    if not existing:
                        UserBadge.objects.create(user=user, badge=badge)
                        newly_unlocked.append({
                            'badge_id': badge.id,
                            'badge_name': badge.name,
                            'badge_type': badge.badge_type,
                            'icon': badge.icon
                        })
                except Badge.DoesNotExist:
                    pass
        
        return newly_unlocked
    
    @staticmethod
    def get_user_badges(user: User) -> dict:
        """
        Get semua info badge untuk user
        
        Returns:
            Dict berisi earned badges dan progress
        """
        if not user:
            return {'earned': [], 'progress': {}}
        
        # Get earned badges
        earned_badges = UserBadge.objects.filter(user=user).select_related('badge')
        earned_data = [
            {
                'id': ub.badge.id,
                'name': ub.badge.name,
                'description': ub.badge.description,
                'icon': ub.badge.icon,
                'badge_type': ub.badge.badge_type,
                'topic_name': ub.badge.topic.name if ub.badge.topic else None,
                'earned_at': ub.earned_at.isoformat()
            }
            for ub in earned_badges
        ]
        
        # Get progress towards badges
        progress = BadgeService._calculate_badge_progress(user)
        
        return {
            'earned': earned_data,
            'progress': progress,
            'total_earned': earned_badges.count()
        }
    
    @staticmethod
    def _calculate_badge_progress(user: User) -> dict:
        """
        Calculate progress towards different badges
        """
        progress = {}
        
        user_attempts = QuestionAttempt.objects.filter(user=user)
        
        if user_attempts.count() == 0:
            return progress
        
        # Overall accuracy
        overall_accuracy = (
            user_attempts.filter(is_correct=True).count() / user_attempts.count()
        ) * 100
        
        progress['overall_accuracy'] = round(overall_accuracy, 2)
        progress['total_attempts'] = user_attempts.count()
        progress['correct_attempts'] = user_attempts.filter(is_correct=True).count()
        
        # Per-topic accuracy
        progress['by_topic'] = {}
        topics = Topic.objects.all()
        
        for topic in topics:
            topic_attempts = user_attempts.filter(question__topic=topic)
            
            if topic_attempts.count() > 0:
                topic_accuracy = (
                    topic_attempts.filter(is_correct=True).count() / topic_attempts.count()
                ) * 100
                progress['by_topic'][topic.id] = {
                    'name': topic.name,
                    'accuracy': round(topic_accuracy, 2),
                    'attempts': topic_attempts.count(),
                    'correct': topic_attempts.filter(is_correct=True).count()
                }
        
        return progress
    
    @staticmethod
    def initialize_default_badges():
        """
        Initialize default badges di database
        Jalankan ini untuk setup badge pertama kali
        """
        # Get all topics
        topics = Topic.objects.all()
        
        # Create topic-specific badges
        for topic in topics:
            Badge.objects.get_or_create(
                badge_type='topic_100',
                topic=topic,
                defaults={
                    'name': f'{topic.name} Master',
                    'description': f'Mencapai 100% accuracy di topik {topic.name}',
                    'icon': 'badge-topic.png',
                    'requirement': {'accuracy': 100, 'topic': topic.id}
                }
            )
        
        # Create progress badges
        progress_badges = [
            ('progress_25', '25% Complete', 'Mencapai 25% accuracy overall', 'badge-25.png'),
            ('progress_50', '50% Complete', 'Mencapai 50% accuracy overall', 'badge-50.png'),
            ('progress_75', '75% Complete', 'Mencapai 75% accuracy overall', 'badge-75.png'),
            ('progress_100', 'Completion Master', 'Mencapai 100% accuracy overall', 'badge-100.png'),
        ]
        
        for badge_type, name, description, icon in progress_badges:
            Badge.objects.get_or_create(
                badge_type=badge_type,
                topic=None,
                defaults={
                    'name': name,
                    'description': description,
                    'icon': icon,
                    'requirement': {'accuracy': int(badge_type.split('_')[1])}
                }
            )
