"""
Django management command to generate questions using Groq API
and save them to the database.

Usage:
    python manage.py generate_questions \
        --topic="Python Basics" \
        --difficulty=2 \
        --question_type=mcq \
        --count=5

Options:
    --topic         Topic name (required) e.g., "Python Basics"
    --difficulty    Difficulty level 1-5 (default: 2)
    --question_type Type of questions: mcq, fill, coding (default: mcq)
    --count         Number of questions to generate (default: 1)
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from quiz.models import Topic, Question
from quiz.services import generate_question
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Generate questions using Groq API and save to database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--topic",
            type=str,
            required=True,
            help="Topic name (e.g., 'Python Basics')",
        )
        parser.add_argument(
            "--difficulty",
            type=int,
            default=2,
            help="Difficulty level 1-5 (default: 2)",
        )
        parser.add_argument(
            "--question_type",
            type=str,
            default="mcq",
            choices=["mcq", "fill", "coding"],
            help="Type of questions: mcq, fill, coding (default: mcq)",
        )
        parser.add_argument(
            "--count",
            type=int,
            default=1,
            help="Number of questions to generate (default: 1)",
        )

    def handle(self, *args, **options):
        topic_name = options["topic"]
        difficulty = options["difficulty"]
        question_type = options["question_type"]
        count = options["count"]

        # Validate inputs
        if not 1 <= difficulty <= 5:
            raise CommandError("Difficulty must be between 1 and 5")

        if count < 1:
            raise CommandError("Count must be at least 1")

        if count > 100:
            raise CommandError("Cannot generate more than 100 questions at once")

        # Get or create topic
        try:
            topic, created = Topic.objects.get_or_create(
                name=topic_name,
                defaults={"description": f"Questions about {topic_name}"},
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created topic: "{topic_name}"')
                )
            else:
                self.stdout.write(f'Using existing topic: "{topic_name}"')
        except Exception as e:
            raise CommandError(f"Error creating/fetching topic: {str(e)}")

        # Generate questions
        self.stdout.write(
            f"\nGenerating {count} {question_type} questions at difficulty {difficulty}..."
        )
        self.stdout.write("-" * 60)

        created_count = 0
        error_count = 0

        for i in range(count):
            try:
                self.stdout.write(f"Generating question {i + 1}/{count}...", ending=" ")

                # Call service to generate question
                question_data = generate_question(difficulty, question_type)

                if not question_data:
                    self.stdout.write(self.style.ERROR("FAILED (empty response)"))
                    error_count += 1
                    continue

                # Create question in database
                question = Question.objects.create(
                    topic=topic,
                    question_type=question_type,
                    difficulty=difficulty,
                    question_text=question_data.get("question_text", ""),  # Changed from "question"
                    options=question_data.get("options", []),
                    answer_key=question_data.get("answer_key", ""),  # Changed from "correct_answer"
                    explanation=question_data.get("explanation", ""),
                    code_template=question_data.get("code_template"),
                    is_active=True,
                    created_at=timezone.now(),
                    updated_at=timezone.now(),
                )

                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created [ID: {question.id}]")
                )
                created_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Error: {str(e)}"))
                logger.error(f"Error generating question {i + 1}: {str(e)}")
                error_count += 1

        # Summary
        self.stdout.write("-" * 60)
        self.stdout.write(self.style.SUCCESS(f"\n✓ Summary:"))
        self.stdout.write(f"  Topic: {topic_name}")
        self.stdout.write(f"  Difficulty: {difficulty}")
        self.stdout.write(f"  Type: {question_type}")
        self.stdout.write(f"  Created: {created_count}/{count}")
        if error_count > 0:
            self.stdout.write(
                self.style.WARNING(f"  Errors: {error_count}")
            )

        self.stdout.write(
            self.style.SUCCESS("\n✓ Questions generated successfully!")
        )
        self.stdout.write(
            f"\nYou can now retrieve these questions using:\n"
            f"  GET /api/questions/?topic={topic_name.replace(' ', '%20')}&difficulty={difficulty}&limit=10"
        )
