#!/usr/bin/env python
"""Force delete ALL attempts"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import QuestionAttempt

print('=' * 70)
print('FORCE DELETE ALL ATTEMPTS')
print('=' * 70)

total = QuestionAttempt.objects.count()
print(f'\nTotal attempts in database: {total}')

if total > 0:
    print(f'Deleting ALL {total} attempts...')
    QuestionAttempt.objects.all().delete()
    print(f'✅ Deleted {total} attempts')
else:
    print('✅ No attempts to delete')

# Verify
remaining = QuestionAttempt.objects.count()
print(f'\nRemaining attempts: {remaining}')
print('=' * 70)
