import hashlib
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.models import Question


def _normalize(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _hash_question(q: Question) -> str:
    payload = f"{q.question_type}::{_normalize(q.question_text)}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class Command(BaseCommand):
    help = "Remove duplicate questions per topic and backfill question_hash"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show duplicates without deleting",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        seen = {}
        duplicates = []
        updated_hash = 0

        qs = Question.objects.select_related("topic").order_by("topic_id", "created_at")

        for q in qs.iterator():
            qhash = _hash_question(q)

            if q.question_hash != qhash:
                q.question_hash = qhash
                if not dry_run:
                    q.save(update_fields=["question_hash"])
                updated_hash += 1

            key = (q.topic_id, qhash)
            if key in seen:
                duplicates.append(q.id)
            else:
                seen[key] = q.id

        if duplicates and not dry_run:
            with transaction.atomic():
                Question.objects.filter(id__in=duplicates).delete()

        self.stdout.write(self.style.SUCCESS("Cleanup complete"))
        self.stdout.write(f"Hashes updated: {updated_hash}")
        self.stdout.write(f"Duplicates found: {len(duplicates)}")
        if dry_run:
            self.stdout.write("No records deleted (dry-run)")
        elif duplicates:
            self.stdout.write("Duplicates deleted")
        else:
            self.stdout.write("No duplicates detected")
