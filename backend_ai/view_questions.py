import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

# Get first topic
topic1 = Topic.objects.filter(order=1).first()
print(f"Topic: {topic1.name}\n")

# Get first 2 questions
questions = Question.objects.filter(topic=topic1, is_active=True)[:2]

for i, q in enumerate(questions, 1):
    print(f"=== SOAL {i} ===")
    print(f"Type: {q.question_type}")
    print(f"Question Text:")
    print(q.question_text)
    print(f"\nAnswer: {q.answer_key}")
    print("\n" + "-"*50 + "\n")
