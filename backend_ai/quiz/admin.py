from django.contrib import admin
from .models import Topic, Question, QuestionPool, QuestionAttempt, Badge, UserBadge


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'created_at')
    search_fields = ('name',)
    ordering = ('order',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_type', 'difficulty', 'topic', 'is_active', 'created_at')
    list_filter = ('question_type', 'difficulty', 'topic', 'is_active')
    search_fields = ('question_text',)
    ordering = ('-created_at',)


@admin.register(QuestionPool)
class QuestionPoolAdmin(admin.ModelAdmin):
    list_display = ('topic', 'difficulty', 'current_count', 'target_count')
    list_filter = ('difficulty',)
    search_fields = ('topic__name',)


@admin.register(QuestionAttempt)
class QuestionAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'is_correct', 'created_at')
    list_filter = ('is_correct', 'created_at')
    search_fields = ('user__username', 'question__question_text')
    ordering = ('-created_at',)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'badge_type', 'topic', 'is_active', 'created_at')
    list_filter = ('badge_type', 'is_active', 'topic')
    search_fields = ('name', 'description')
    ordering = ('badge_type',)


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'earned_at')
    list_filter = ('earned_at', 'badge__badge_type')
    search_fields = ('user__username', 'badge__name')
    ordering = ('-earned_at',)
    readonly_fields = ('earned_at',)
