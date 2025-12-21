import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question

coding = Question.objects.filter(question_type='coding', is_active=True)
print(f'Total coding questions: {coding.count()}')

with_tests = coding.exclude(test_cases__isnull=True)
print(f'Coding questions WITH test_cases: {with_tests.count()}')

without_tests = coding.filter(test_cases__isnull=True)
print(f'Coding questions WITHOUT test_cases: {without_tests.count()}')

if without_tests.exists():
    print('\n⚠️ Questions WITHOUT test cases:')
    for q in without_tests[:5]:
        print(f'  Q{q.id}: {q.question_text[:60]}...')

if with_tests.exists():
    print('\n✅ Questions WITH test cases:')
    for q in with_tests[:5]:
        print(f'  Q{q.id}: {q.question_text[:60]}...')
