from django.db import models
from django.contrib.auth.models import User

class Question(models.Model):
    QUESTION_TYPES = [
        ("mcq", "Multiple Choice"),
        ("fill", "Fill in Code"),
        ("coding", "Coding"),
    ]

    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    difficulty = models.IntegerField(default=1)
    topic = models.CharField(max_length=100, null=True, blank=True)  # <-- NEW
    question_text = models.TextField()
    code_template = models.TextField(null=True, blank=True)
    options = models.JSONField(null=True, blank=True)
    answer_key = models.JSONField()
    explanation = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.question_type} - Level {self.difficulty}"


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
