#!/usr/bin/env python
"""Delete orphan questions automatically"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic

print('=' * 70)
print('DELETING ORPHAN QUESTIONS')
print('=' * 70)

# Find orphan questions
orphans = Question.objects.filter(topic__isnull=True, is_active=True)
orphan_count = orphans.count()

print(f'\nFound {orphan_count} orphan questions (no topic assigned)')

if orphan_count > 0:
    print('\nDeleting these questions:')
    for q in orphans:
        print(f'  Q{q.id:3} | {q.question_type:6} | {q.question_text[:55]}...')
    
    # Delete them
    deleted_count = orphans.count()
    orphans.delete()
    print(f'\n✅ Successfully deleted {deleted_count} orphan questions')
    
    # Show updated stats
    print('\n' + '=' * 70)
    print('UPDATED DATABASE STATE:')
    print('=' * 70)
    topics = Topic.objects.all().order_by('order')
    total = 0
    for t in topics:
        count = Question.objects.filter(topic=t, is_active=True).count()
        total += count
        status = '✅' if count == 10 or (t.name == 'Variabel dan Tipe Data' and count == 11) else '⚠️ '
        print(f'{status} {t.order}. {t.name:30} {count:3} questions')
    
    print(f'\nTotal questions: {total}')
    print(f'Orphan questions: {Question.objects.filter(topic__isnull=True, is_active=True).count()}')
else:
    print('\n✅ No orphan questions found!')

print('\n' + '=' * 70)
