from django.db import models
from django.contrib.auth.models import User


class Topic(models.Model): #Topik yang berkaitan dengan soal
    """Represents a learning topic"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
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
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['topic', 'difficulty', 'question_type']),
            models.Index(fields=['is_active']),
        ]
    
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
