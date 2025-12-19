"""
Quick script to regenerate questions for a SINGLE topic.

This is useful if you only want to regenerate one topic at a time.

Usage:
    python regenerate_single_topic.py "Variabel dan Tipe Data"
    python regenerate_single_topic.py "Operator"
"""

import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question
from quiz.services import generate_question_set

def regenerate_single_topic(topic_name: str):
    """Regenerate questions for a single topic"""
    
    print(f"\n{'='*70}")
    print(f"Regenerating questions for: {topic_name}")
    print('='*70)
    
    # Find topic
    try:
        topic = Topic.objects.get(name=topic_name)
    except Topic.DoesNotExist:
        print(f"\n❌ Topic '{topic_name}' not found!")
        print("\nAvailable topics:")
        for t in Topic.objects.all().order_by('order'):
            print(f"  - {t.name}")
        return
    
    # Show current status
    old_count = Question.objects.filter(topic=topic, is_active=True).count()
    print(f"\nCurrent questions: {old_count}")
    
    # Confirm
    response = input(f"\nDelete {old_count} questions and generate 10 new ones? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("\n❌ Cancelled.")
        return
    
    # Delete old
    Question.objects.filter(topic=topic).delete()
    print(f"✓ Deleted {old_count} old questions")
    
    # Generate new
    print(f"\n⏳ Generating 10 new questions...")
    try:
        questions = generate_question_set(
            topic_name=topic.name,
            difficulty=2,
            count=10,
            mcq_count=5,
            max_workers=3
        )
        
        print(f"✅ Generated {len(questions)} questions")
        
        # Show samples
        print(f"\nSample questions:")
        for i, q in enumerate(questions[:3], 1):
            print(f"\n  {i}. [{q['question_type'].upper()}] {q['question_text'][:80]}...")
        
        print(f"\n✅ Done! Topic '{topic_name}' now has {len(questions)} questions.")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python regenerate_single_topic.py \"Topic Name\"")
        print("\nAvailable topics:")
        for t in Topic.objects.all().order_by('order'):
            print(f"  - {t.name}")
    else:
        topic_name = sys.argv[1]
        regenerate_single_topic(topic_name)
