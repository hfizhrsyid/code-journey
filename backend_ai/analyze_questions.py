import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

print("="*80)
print("ANALISIS RELEVANSI SOAL DENGAN TOPIC")
print("="*80)

topics = Topic.objects.all().order_by('order')

for topic in topics:
    print(f"\n{'='*80}")
    print(f"📚 TOPIC {topic.order}: {topic.name}")
    print(f"{'='*80}")
    
    questions = Question.objects.filter(topic=topic, is_active=True).order_by('id')
    total = questions.count()
    
    print(f"\nTotal soal: {total}")
    
    if total == 0:
        print("⚠️  Tidak ada soal untuk topic ini!")
        continue
    
    print(f"\n{'-'*80}")
    print("SAMPLE SOAL (5 pertama):")
    print(f"{'-'*80}\n")
    
    for i, q in enumerate(questions[:5], 1):
        print(f"Soal #{i} (ID: {q.id}) - Type: {q.question_type.upper()}")
        print(f"Difficulty: {q.difficulty}/5")
        print(f"\nPertanyaan:")
        print(f"  {q.question_text[:200]}{'...' if len(q.question_text) > 200 else ''}")
        
        if q.code_template:
            print(f"\nCode Template:")
            code_lines = q.code_template.split('\n')[:3]
            for line in code_lines:
                print(f"  {line}")
            if len(q.code_template.split('\n')) > 3:
                print("  ...")
        
        if q.options:
            if isinstance(q.options, dict):
                print(f"\nOptions: {list(q.options.keys())}")
            else:
                print(f"\nOptions: {q.options}")
        
        print(f"\nJawaban: {q.answer_key}")
        
        # Simple relevance check
        topic_keywords = topic.name.lower().split()
        question_text = (q.question_text + ' ' + str(q.code_template or '')).lower()
        
        matches = [kw for kw in topic_keywords if kw in question_text and len(kw) > 3]
        
        if matches:
            print(f"✅ Relevan - Kata kunci ditemukan: {matches}")
        else:
            print(f"⚠️  Perlu review - Kata kunci topic tidak ditemukan dalam soal")
        
        print(f"\n{'-'*80}\n")
    
    if total > 5:
        print(f"... dan {total - 5} soal lainnya\n")

print("\n" + "="*80)
print("RINGKASAN:")
print("="*80)

for topic in topics:
    count = Question.objects.filter(topic=topic, is_active=True).count()
    print(f"  {topic.name}: {count} soal")

print("\n✅ Analisis selesai!")
print("\nCatatan: Review manual tetap diperlukan untuk memastikan kualitas soal.")
