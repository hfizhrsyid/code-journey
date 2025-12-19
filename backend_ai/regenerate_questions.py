"""
Script to regenerate all questions with correct topics.

This script will:
1. Delete all existing questions (they were generated with wrong topics)
2. Generate new questions for each topic with correct topic assignment
3. Show progress and summary

Usage:
    python regenerate_questions.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question
from quiz.services import generate_question_set
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def regenerate_all_questions():
    """Regenerate all questions for all topics"""
    
    print("="*70)
    print("REGENERATE QUESTIONS SCRIPT")
    print("="*70)
    
    # Get all topics
    topics = Topic.objects.all().order_by('order')
    
    if not topics.exists():
        print("\n⚠️  No topics found in database!")
        return
    
    print(f"\nFound {topics.count()} topics:")
    for t in topics:
        old_count = Question.objects.filter(topic=t, is_active=True).count()
        print(f"  {t.order}. {t.name} - {old_count} existing questions")
    
    # Ask for confirmation
    print("\n" + "="*70)
    print("⚠️  WARNING: This will DELETE all existing questions!")
    print("="*70)
    response = input("\nContinue? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("\n❌ Cancelled by user.")
        return
    
    print("\n" + "="*70)
    print("STARTING REGENERATION")
    print("="*70)
    
    total_deleted = 0
    total_generated = 0
    
    for topic in topics:
        print(f"\n{'='*70}")
        print(f"Processing: {topic.name}")
        print('='*70)
        
        # Delete old questions
        old_questions = Question.objects.filter(topic=topic)
        deleted_count = old_questions.count()
        old_questions.delete()
        total_deleted += deleted_count
        print(f"  ✓ Deleted {deleted_count} old questions")
        
        # Generate new questions
        try:
            print(f"  ⏳ Generating 10 new questions for '{topic.name}'...")
            
            questions = generate_question_set(
                topic_name=topic.name,
                difficulty=2,  # Medium difficulty
                count=10,
                mcq_count=5,   # 5 MCQ, 5 fill/coding
                max_workers=3
            )
            
            generated_count = len(questions)
            total_generated += generated_count
            print(f"  ✅ Generated {generated_count} questions")
            
            # Show sample question
            if questions:
                sample = questions[0]
                print(f"\n  Sample question:")
                print(f"    Type: {sample['question_type']}")
                print(f"    Text: {sample['question_text'][:100]}...")
            
        except Exception as e:
            print(f"  ❌ Error generating questions: {str(e)}")
            logger.error(f"Failed to generate questions for {topic.name}: {e}")
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"  Total deleted: {total_deleted} questions")
    print(f"  Total generated: {total_generated} questions")
    print(f"  Topics processed: {topics.count()}")
    
    # Show final counts
    print("\n" + "="*70)
    print("FINAL QUESTION COUNTS")
    print("="*70)
    for t in topics:
        count = Question.objects.filter(topic=t, is_active=True).count()
        status = "✓" if count >= 10 else "⚠️"
        print(f"  {status} {t.name}: {count} questions")
    
    print("\n✅ Regeneration complete!")
    print("\nNext steps:")
    print("  1. Test the app to verify questions match topics")
    print("  2. Check question quality and relevance")
    print("  3. Adjust difficulty if needed")

if __name__ == "__main__":
    try:
        regenerate_all_questions()
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user.")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        logger.exception("Regeneration failed")
