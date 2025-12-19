from django.db import migrations, models, transaction
import hashlib


def _normalize(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _hash_question(question) -> str:
    payload = f"{question.question_type}::{_normalize(question.question_text)}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def forwards(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")

    # Backfill hashes for all questions
    for q in Question.objects.all().iterator():
        q.question_hash = _hash_question(q)
        q.save(update_fields=["question_hash"])

    # Remove duplicates per (topic, question_hash), keep the earliest id
    seen = {}
    duplicates = []
    for q in Question.objects.all().order_by("topic_id", "id").iterator():
        key = (q.topic_id, q.question_hash)
        if key in seen:
            duplicates.append(q.id)
        else:
            seen[key] = q.id

    if duplicates:
        with transaction.atomic():
            Question.objects.filter(id__in=duplicates).delete()


def backwards(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    Question.objects.update(question_hash=None)


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0010_badge_userbadge_delete_usertopicprogress"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="question_hash",
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AddConstraint(
            model_name="question",
            constraint=models.UniqueConstraint(
                fields=["topic", "question_hash"], name="quiz_question_topic_hash_uniq"
            ),
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(fields=["topic", "question_hash"], name="quiz_question_topic_hash_idx"),
        ),
    ]
