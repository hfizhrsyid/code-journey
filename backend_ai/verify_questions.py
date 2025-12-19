import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

# Get first topic
topic = Topic.objects.filter(order=1).first()
print(f"Topic: {topic.name}")
print("="*70)

# Get newly generated questions
questions = Question.objects.filter(topic=topic, is_active=True).order_by('-id')[:3]

for i, q in enumerate(questions, 1):
    print(f"\nSOAL #{i}")
    print(f"Type: {q.question_type}")
    print(f"Difficulty: {q.difficulty}/5")
    print(f"\nQuestion:")
    print(q.question_text)
    
    if q.code_template:
        print(f"\nCode:")
        print(q.code_template)
    
    if q.options:
        print(f"\nOptions:")
        if isinstance(q.options, list):
            for idx, opt in enumerate(q.options):
                letter = chr(65 + idx)  # A, B, C, D
                print(f"  {letter}. {opt}")
        elif isinstance(q.options, dict):
            for key, val in q.options.items():
                print(f"  {key}. {val}")
    
    print(f"\nAnswer: {q.answer_key}")
    
    # Check relevance
    topic_keywords = ['variabel', 'variable', 'tipe', 'data', 'int', 'str', 'float', 'bool']
    text_lower = (q.question_text + ' ' + str(q.code_template or '')).lower()
    found_keywords = [kw for kw in topic_keywords if kw in text_lower]
    
    if found_keywords:
        print(f"✅ RELEVAN - Keywords found: {found_keywords[:5]}")
    else:
        print(f"⚠️  PERLU REVIEW - No topic keywords found")
    
    print("="*70)

print(f"\nTotal questions for '{topic.name}': {Question.objects.filter(topic=topic, is_active=True).count()}")
