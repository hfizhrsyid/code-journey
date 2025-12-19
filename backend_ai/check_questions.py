import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

print("ANALISIS SOAL PER TOPIC")
print("="*70)

topics = Topic.objects.all().order_by('order')

for topic in topics:
    print(f"\n{'='*70}")
    print(f"TOPIC {topic.order}: {topic.name}")
    print('='*70)
    
    questions = Question.objects.filter(topic=topic, is_active=True)[:3]
    
    for i, q in enumerate(questions, 1):
        print(f"\nSoal #{i}:")
        print(f"  Type: {q.question_type}")
        print(f"  Difficulty: {q.difficulty}/5")
        print(f"  Question: {q.question_text[:150]}...")
        
        # Check relevance
        topic_lower = topic.name.lower()
        question_lower = q.question_text.lower()
        
        # Extract key topic words
        if 'variabel' in topic_lower:
            keywords = ['variabel', 'variable', 'tipe data', 'int', 'str', 'float']
        elif 'operator' in topic_lower:
            keywords = ['operator', '+', '-', '*', '/', '%', '==', '!=']
        elif 'percabangan' in topic_lower:
            keywords = ['if', 'else', 'elif', 'kondisi', 'percabangan']
        elif 'perulangan' in topic_lower:
            keywords = ['for', 'while', 'loop', 'perulangan', 'range']
        elif 'pengurutan' in topic_lower:
            keywords = ['sort', 'sorted', 'urut', 'pengurutan', 'bubble', 'selection']
        elif 'pencarian' in topic_lower:
            keywords = ['search', 'cari', 'pencarian', 'linear', 'binary', 'find']
        else:
            keywords = []
        
        found = [kw for kw in keywords if kw in question_lower]
        
        if found:
            print(f"  ✅ RELEVAN - Keywords: {found[:3]}")
        else:
            print(f"  ⚠️  PERLU REVIEW - Tidak ada keyword topic")
    
    total = Question.objects.filter(topic=topic, is_active=True).count()
    print(f"\n  Total: {total} soal")

print("\n" + "="*70)
print("Analisis selesai!")
