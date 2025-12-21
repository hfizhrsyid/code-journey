"""
Script to mark questions as pretest questions.
Selects 2-3 representative questions from each topic for diagnostic testing.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic

def mark_pretest_questions():
    """Mark 2-3 questions per topic as pretest questions"""
    
    topics = Topic.objects.all()
    total_marked = 0
    
    for topic in topics:
        print(f"\n📚 Processing topic: {topic.name}")
        
        # Get multiple questions per topic across all difficulty levels
        questions_to_mark = []
        
        for difficulty in [1, 2, 3]:
            # Try to get MCQ first (faster to answer)
            mcq_questions = Question.objects.filter(
                topic=topic,
                difficulty=difficulty,
                is_active=True,
                question_type='mcq',
                is_pretest=False  # Don't mark same question twice
            )[:2]  # Get 2 MCQ per difficulty if available
            
            questions_to_mark.extend(mcq_questions)
            
            # If we don't have enough MCQ, add fill questions
            if len(mcq_questions) < 2:
                fill_questions = Question.objects.filter(
                    topic=topic,
                    difficulty=difficulty,
                    is_active=True,
                    question_type='fill',
                    is_pretest=False
                )[:2 - len(mcq_questions)]
                
                questions_to_mark.extend(fill_questions)
        
        # Mark selected questions as pretest (aim for 3-6 questions per topic)
        for question in questions_to_mark[:6]:  # Limit to max 6 per topic
            question.is_pretest = True
            question.save()
            total_marked += 1
            print(f"  ✅ Marked Q{question.id} (difficulty={question.difficulty}, type={question.question_type})")
    
    print(f"\n✨ Total questions marked as pretest: {total_marked}")
    
    # Verify
    pretest_count = Question.objects.filter(is_pretest=True).count()
    print(f"✨ Verification: {pretest_count} pretest questions in database")
    
    # Show breakdown by topic
    print("\n📊 Pretest Questions by Topic:")
    for topic in topics:
        count = Question.objects.filter(topic=topic, is_pretest=True).count()
        difficulties = Question.objects.filter(topic=topic, is_pretest=True).values_list('difficulty', flat=True)
        print(f"  {topic.name}: {count} questions (difficulties: {list(difficulties)})")


if __name__ == '__main__':
    mark_pretest_questions()
