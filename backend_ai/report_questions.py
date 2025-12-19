#!/usr/bin/env python
"""Detailed report on question-topic associations and fix orphans"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic

print('=' * 80)
print('DETAILED QUESTION-TOPIC ASSOCIATION REPORT')
print('=' * 80)

# Get all topics
topics = Topic.objects.all().order_by('order')

print('\n📊 QUESTIONS PER TOPIC:')
print('-' * 80)

total_with_topic = 0
for topic in topics:
    questions = Question.objects.filter(topic=topic, is_active=True)
    count = questions.count()
    total_with_topic += count
    
    status = '✅' if count >= 10 else ('⚠️ ' if count > 0 else '❌')
    print(f'{status} {topic.order}. {topic.name:30} {count:3} questions')
    
    # Show sample questions
    if count > 0 and count <= 3:
        for q in questions:
            print(f'      Q{q.id:3}: {q.question_text[:65]}...')
    elif count > 3:
        for q in questions[:2]:
            print(f'      Q{q.id:3}: {q.question_text[:65]}...')
        print(f'      ... and {count - 2} more')

# Check for orphan questions
print('\n' + '=' * 80)
print('🔍 ORPHAN QUESTIONS (NO TOPIC):')
print('=' * 80)

orphans = Question.objects.filter(topic__isnull=True, is_active=True)
orphan_count = orphans.count()

if orphan_count > 0:
    print(f'\n⚠️  WARNING: Found {orphan_count} questions without topics!')
    print('These questions will NOT be counted in topic progress!\n')
    
    for q in orphans:
        print(f'Q{q.id:3} | {q.question_type:6} | Diff {q.difficulty} | {q.question_text[:55]}...')
    
    print('\n' + '-' * 80)
    print('💡 RECOMMENDATION: Assign these questions to appropriate topics')
    print('   or delete them if they are test/duplicate questions.')
else:
    print('\n✅ No orphan questions found! All questions have topics.')

# Summary
print('\n' + '=' * 80)
print('📈 SUMMARY:')
print('=' * 80)
print(f'Total Topics:              {topics.count()}')
print(f'Questions with topics:     {total_with_topic}')
print(f'Orphan questions:          {orphan_count}')
print(f'Total active questions:    {Question.objects.filter(is_active=True).count()}')
print(f'Total all questions:       {Question.objects.count()}')

# Check if we need to fix orphans
if orphan_count > 0:
    print('\n' + '=' * 80)
    print('🔧 FIX OPTIONS:')
    print('=' * 80)
    print('1. Delete orphan questions:')
    print('   Question.objects.filter(topic__isnull=True, is_active=True).delete()')
    print('\n2. Assign to a topic (example for "Variabel dan Tipe Data"):')
    print('   topic = Topic.objects.get(name="Variabel dan Tipe Data")')
    print('   Question.objects.filter(topic__isnull=True).update(topic=topic)')

print('\n' + '=' * 80)
