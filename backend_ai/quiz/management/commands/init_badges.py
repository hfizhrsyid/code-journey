from django.core.management.base import BaseCommand
from quiz.badge_service import BadgeService


class Command(BaseCommand):
    help = "Initialize default badges in the database"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Initializing badges..."))
        
        try:
            BadgeService.initialize_default_badges()
            self.stdout.write(self.style.SUCCESS("✅ Badges initialized successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error initializing badges: {str(e)}"))
