#!/usr/bin/env python
"""Fix orphan questions by deleting them (they are likely old test questions)"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic

print('=' * 70)
print('FIXING ORPHAN QUESTIONS')
print('=' * 70)

# Find orphan questions
orphans = Question.objects.filter(topic__isnull=True, is_active=True)
orphan_count = orphans.count()

print(f'\nFound {orphan_count} orphan questions (no topic assigned)')

if orphan_count > 0:
    print('\nThese questions will be DELETED:')
    for q in orphans:
        print(f'  Q{q.id:3} | {q.question_type:6} | {q.question_text[:55]}...')
    
    # Ask for confirmation
    print('\n' + '=' * 70)
    response = input('Delete these orphan questions? (yes/no): ')
    
    if response.lower() == 'yes':
        deleted_count = orphans.count()
        orphans.delete()
        print(f'\n✅ Deleted {deleted_count} orphan questions')
        
        # Show updated stats
        print('\nUpdated stats:')
        topics = Topic.objects.all().order_by('order')
        for t in topics:
            count = Question.objects.filter(topic=t, is_active=True).count()
            print(f'  {t.order}. {t.name}: {count} questions')
    else:
        print('\n❌ Cancelled. No questions were deleted.')
else:
    print('\n✅ No orphan questions found!')

print('\n' + '=' * 70)
