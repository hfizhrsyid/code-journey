#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

TOPIC_KEYWORDS = {
    'variabel': ['variabel', 'variable', 'tipe', 'data', 'int', 'str'],
    'operator': ['operator', '+', '-', '*', '/', '%', '==', '!='],
    'percabangan': ['if', 'else', 'elif', 'kondisi'],
    'perulangan': ['for', 'while', 'loop', 'range'],
}

for topic in Topic.objects.all():
    keywords = TOPIC_KEYWORDS.get(topic.name.lower(), [])
    print(f"\n{'='*80}")
    print(f"TOPIC: {topic.name}")
    print(f"{'='*80}")
    
    questions = Question.objects.filter(topic=topic, is_active=True)[:5]
    
    for q in questions:
        text = (q.question_text + ' ' + str(q.code_template or '')).lower()
        found = [kw for kw in keywords if kw in text]
        status = "✅" if found else "❌"
        print(f"\n{status} Q: {q.question_text[:70]}")
        if found:
            print(f"   Keywords: {found}")
        else:
            print(f"   ⚠️  NO KEYWORDS FOUND - Tidak relevan!")