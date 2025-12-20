from django.db import models
from django.contrib.auth.models import User


class Topic(models.Model): #Topik yang berkaitan dengan soal
    """Represents a learning topic"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)  # Order for sequential topic progression
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class Question(models.Model):
    QUESTION_TYPES = [
        ("mcq", "Multiple Choice"),
        ("fill", "Fill in Code"),
        ("coding", "Coding"),
    ]

    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    difficulty = models.IntegerField(default=1)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    question_text = models.TextField()
    code_template = models.TextField(null=True, blank=True)
    options = models.JSONField(null=True, blank=True)
    answer_key = models.JSONField()
    explanation = models.TextField(null=True, blank=True)
    test_cases = models.JSONField(null=True, blank=True)  # For coding questions: [{"input": "...", "expected_output": "..."}]
    question_hash = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['topic', 'difficulty', 'question_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['topic', 'question_hash']),
        ]
        unique_together = (
            ('topic', 'question_hash'),
        )
    
    def __str__(self):
        return f"{self.question_type} - Level {self.difficulty} - {self.topic}"


class QuestionPool(models.Model): #Banyaknya soal pada suatu topik
    """Tracks generated question counts per topic/difficulty"""
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='pools')
    difficulty = models.IntegerField(default=1)
    target_count = models.IntegerField(default=10)
    current_count = models.IntegerField(default=0)
    last_generated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('topic', 'difficulty')
        ordering = ['topic', 'difficulty']
    
    def __str__(self):
        return f"{self.topic} - Level {self.difficulty} ({self.current_count}/{self.target_count})"
    
    def needs_generation(self):
        return self.current_count < self.target_count


class QuestionAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer = models.TextField()
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Attempt by {self.user} on Q{self.question.id}"


class Badge(models.Model):
    """Badge definition for achievements"""
    BADGE_TYPES = [
        ("topic_100", "Topic Master - 100% Accuracy"),
        ("progress_25", "Progress Milestone - 25%"),
        ("progress_50", "Progress Milestone - 50%"),
        ("progress_75", "Progress Milestone - 75%"),
        ("progress_100", "Completion Master - 100%"),
        ("streak", "Streak Warrior"),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)  # reference ke gambar (e.g., "badge-1.png")
    badge_type = models.CharField(max_length=20, choices=BADGE_TYPES)
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='badges')
    requirement = models.JSONField(default=dict)  # Store requirement details (e.g., {"accuracy": 100, "topic_id": 1})
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['badge_type', 'id']
        unique_together = ('badge_type', 'topic')  # Prevent duplicate badges per topic
    
    def __str__(self):
        return f"{self.name} ({self.badge_type})"


class UserBadge(models.Model):
    """Track earned badges for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='earned_by')
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-earned_at']
        unique_together = ('user', 'badge')  # Prevent duplicate earning of same badge
    
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"


class TopicUnlock(models.Model):
    """Manual/unlocked topics per user (e.g., via pre-test)."""
    SOURCE_CHOICES = [
        ("pretest", "Pre-test"),
        ("manual", "Manual"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="topic_unlocks")
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="unlocked_by")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="pretest")
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "topic")
        ordering = ["topic__order", "unlocked_at"]

    def __str__(self):
        return f"{self.user.username} unlocked {self.topic.name} ({self.source})"
