#!/usr/bin/env python
"""
Script untuk melihat semua soal yang ada di database
Menampilkan: Topic, Jumlah soal, List soal dengan type & difficulty
"""

import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

def display_all_questions():
    """Tampilkan semua soal per topic"""
    
    print("\n" + "="*80)
    print("📋 DATABASE SOAL - CODE JOURNEY")
    print("="*80 + "\n")
    
    topics = Topic.objects.all().order_by('order')
    total_questions = Question.objects.filter(is_active=True).count()
    
    print(f"Total Topics: {topics.count()}")
    print(f"Total Questions (Active): {total_questions}\n")
    
    for topic in topics:
        questions = Question.objects.filter(topic=topic, is_active=True).order_by('difficulty', 'question_type')
        count = questions.count()
        
        # Status indicator
        status_icon = "✅" if count > 0 else "❌"
        
        print(f"\n{status_icon} TOPIC {topic.order}: {topic.name}")
        print(f"   Description: {topic.description or 'N/A'}")
        print(f"   Total Questions: {count}")
        print("   " + "-"*76)
        
        if count == 0:
            print("   ⚠️  No questions found in this topic")
        else:
            # Count by type
            mcq_count = questions.filter(question_type='mcq').count()
            fill_count = questions.filter(question_type='fill').count()
            coding_count = questions.filter(question_type='coding').count()
            
            print(f"   Type Distribution: MCQ={mcq_count}, Fill={fill_count}, Coding={coding_count}")
            print(f"\n   Questions:")
            
            for i, q in enumerate(questions[:20], 1):  # Show first 20
                diff_stars = "⭐" * q.difficulty
                print(f"   {i:2d}. [{q.question_type.upper():6s}] {diff_stars} {q.question_text[:60]}")
            
            if count > 20:
                print(f"   ... and {count - 20} more questions")
        
        print()
    
    print("="*80)
    print(f"✅ Selesai! Total {total_questions} soal tersimpan di database\n")

def display_topic_summary():
    """Tampilkan ringkasan per topic"""
    
    print("\n" + "="*80)
    print("📊 RINGKASAN SOAL PER TOPIC")
    print("="*80 + "\n")
    
    print(f"{'Topic':<30} {'MCQ':>5} {'Fill':>5} {'Code':>5} {'Total':>5} {'Status':>15}")
    print("-"*80)
    
    topics = Topic.objects.all().order_by('order')
    
    for topic in topics:
        mcq = Question.objects.filter(topic=topic, question_type='mcq', is_active=True).count()
        fill = Question.objects.filter(topic=topic, question_type='fill', is_active=True).count()
        coding = Question.objects.filter(topic=topic, question_type='coding', is_active=True).count()
        total = mcq + fill + coding
        
        status = "✅ Ready" if total >= 5 else "⚠️  Need more" if total > 0 else "❌ Empty"
        
        print(f"{topic.name:<30} {mcq:>5} {fill:>5} {coding:>5} {total:>5} {status:>15}")
    
    print("-"*80)
    
    total_mcq = Question.objects.filter(question_type='mcq', is_active=True).count()
    total_fill = Question.objects.filter(question_type='fill', is_active=True).count()
    total_coding = Question.objects.filter(question_type='coding', is_active=True).count()
    total_all = total_mcq + total_fill + total_coding
    
    print(f"{'TOTAL':<30} {total_mcq:>5} {total_fill:>5} {total_coding:>5} {total_all:>5}")
    print("="*80 + "\n")

def display_topic_detail(topic_name):
    """Tampilkan detail soal untuk topic tertentu"""
    
    try:
        topic = Topic.objects.get(name__icontains=topic_name)
    except Topic.DoesNotExist:
        print(f"❌ Topic '{topic_name}' tidak ditemukan\n")
        print("Available topics:")
        for t in Topic.objects.all().order_by('order'):
            print(f"  - {t.name}")
        return
    
    questions = Question.objects.filter(topic=topic, is_active=True).order_by('difficulty', 'question_type')
    
    print(f"\n{'='*80}")
    print(f"📝 DETAIL TOPIC: {topic.name}")
    print(f"{'='*80}\n")
    
    print(f"Description: {topic.description or 'N/A'}\n")
    
    for i, q in enumerate(questions, 1):
        diff_stars = "⭐" * q.difficulty
        print(f"\n{i}. [{q.question_type.upper()}] {diff_stars} (ID: {q.question_id})")
        print(f"   Question: {q.question_text[:100]}")
        
        if q.code_template:
            print(f"   Code Template: {q.code_template[:80]}")
        
        if q.options:
            options = q.options if isinstance(q.options, list) else q.options.get('options', [])
            if options:
                print(f"   Options: {options[:2] if len(options) > 2 else options}")
        
        print(f"   Answer: {q.answer_key}")
    
    print(f"\n{'='*80}")
    print(f"Total: {questions.count()} soal\n")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Jika ada argument, tampilkan detail topic
        topic_name = ' '.join(sys.argv[1:])
        display_topic_detail(topic_name)
    else:
        # Tampilkan ringkasan & semua soal
        display_topic_summary()
        display_all_questions()
