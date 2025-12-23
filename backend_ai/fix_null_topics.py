import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic

# Mapping keywords to topics
TOPIC_KEYWORDS = {
    'Variabel dan Tipe Data': ['variabel', 'tipe data', 'string', 'integer', 'float', 'type', 'nama =', 'x ='],
    'Operator': ['operator', 'aritmatika', 'logika', 'bitwise', 'modulus', '%', '+', '-', '*', '/', 'AND', 'OR', 'XOR'],
    'Percabangan': ['percabangan', 'if', 'elif', 'else', 'kondisi', 'branching'],
    'Perulangan': ['perulangan', 'loop', 'for', 'while', 'break', 'continue', 'range', 'iterasi']
}

def get_topic_from_question(question_text, code_template):
    """Determine topic based on question content"""
    combined_text = (question_text + ' ' + (code_template or '')).lower()
    
    # Count keyword matches for each topic
    topic_scores = {}
    for topic_name, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in combined_text)
        if score > 0:
            topic_scores[topic_name] = score
    
    # Return topic with highest score
    if topic_scores:
        best_topic = max(topic_scores.items(), key=lambda x: x[1])[0]
        return best_topic
    
    return None

def fix_null_topics():
    # Get all questions with null topic
    null_topic_questions = Question.objects.filter(topic__isnull=True)
    total = null_topic_questions.count()
    
    print(f"🔍 Found {total} questions with null topic\n")
    
    if total == 0:
        print("✅ All questions already have topics assigned!")
        return
    
    # Get all topics
    topics = {topic.name: topic for topic in Topic.objects.all()}
    
    fixed_count = 0
    skipped_count = 0
    
    for question in null_topic_questions:
        # Determine topic from question content
        topic_name = get_topic_from_question(
            question.question_text, 
            question.code_template
        )
        
        if topic_name and topic_name in topics:
            question.topic = topics[topic_name]
            question.save()
            print(f"✅ Q{question.id}: {question.question_text[:60]}...")
            print(f"   → Assigned to topic: {topic_name}\n")
            fixed_count += 1
        else:
            print(f"⚠️  Q{question.id}: {question.question_text[:60]}...")
            print(f"   → Could not determine topic, skipping\n")
            skipped_count += 1
    
    print("=" * 60)
    print(f"✅ Fixed: {fixed_count} questions")
    print(f"⚠️  Skipped: {skipped_count} questions")
    print(f"📊 Total processed: {total}")

if __name__ == "__main__":
    fix_null_topics()
