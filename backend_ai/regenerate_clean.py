#!/usr/bin/env python
"""
SCRIPT UNTUK REGENERATE SEMUA SOAL DENGAN PROMPT YANG LEBIH BAIK
1. Analisis prompt saat ini
2. Cek topik yang ada
3. Hapus semua soal lama
4. Generate ulang dengan prompt spesifik per topic

Cara jalankan:
  python regenerate_clean.py
"""

import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question
from quiz.services import generate_question_set
import logging

logger = logging.getLogger(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def analyze_current_prompts():
    """Analisis prompt yang saat ini digunakan"""
    print_header("📋 ANALISIS PROMPT SAAT INI")
    
    from quiz.services import PROMPT_TEMPLATES as current_prompts
    
    for q_type, prompt in current_prompts.items():
        lines = prompt.split('\n')
        print(f"Type: {q_type.upper()}")
        print(f"First line: {lines[0]}")
        print(f"Length: {len(prompt)} characters")
        print(f"Status: ✅ IMPROVED - Lebih spesifik dan detail\n")

def show_topics():
    """Tampilkan semua topik"""
    print_header("📚 DAFTAR TOPIK YANG ADA")
    
    topics = Topic.objects.all().order_by('order')
    
    if not topics.exists():
        print("❌ Tidak ada topik di database!")
        return
    
    for i, topic in enumerate(topics, 1):
        count = Question.objects.filter(topic=topic, is_active=True).count()
        status = "✅" if count > 0 else "❌"
        print(f"{i}. {status} {topic.name}")
        print(f"   Current questions: {count}\n")
    
    total = sum(Question.objects.filter(topic=topic, is_active=True).count() 
                for topic in topics)
    print(f"Total soal: {total}")

def delete_all_questions():
    """Hapus semua soal yang ada"""
    print_header("🗑️  MENGHAPUS SEMUA SOAL LAMA")
    
    count = Question.objects.filter(is_active=True).count()
    
    if count == 0:
        print("✅ Tidak ada soal untuk dihapus\n")
        return True
    
    print(f"⚠️  PERINGATAN: Akan menghapus {count} soal dari database!")
    print("   Tindakan ini TIDAK DAPAT DIBATALKAN!\n")
    
    while True:
        confirm = input("Ketik 'HAPUS' untuk lanjutkan (atau tekan Enter untuk batal): ").strip()
        
        if confirm == 'HAPUS':
            try:
                deleted_count, _ = Question.objects.filter(is_active=True).delete()
                print(f"\n✅ Berhasil menghapus {deleted_count} soal!\n")
                return True
            except Exception as e:
                print(f"\n❌ Error saat menghapus: {e}\n")
                return False
        else:
            print("❌ Pembatalan - Soal tidak dihapus\n")
            return False

def regenerate_questions():
    """Regenerate semua soal dengan prompt yang lebih baik"""
    print_header("🔄 REGENERATE SOAL DENGAN PROMPT YANG LEBIH BAIK")
    
    topics = Topic.objects.all().order_by('order')
    
    if not topics.exists():
        print("❌ Tidak ada topik di database!")
        return
    
    total_created = 0
    failed_topics = []
    
    for topic in topics:
        print(f"📝 Topic: {topic.name}")
        print(f"   Membuat 10 soal (5 MCQ, 5 lainnya)...")
        
        try:
            # Generate dengan improved prompts
            questions = generate_question_set(
                topic_name=topic.name,
                difficulty=2,  # Medium difficulty
                count=10,
                mcq_count=5,
                max_workers=3
            )
            
            created_count = len(questions)
            total_created += created_count
            
            if created_count > 0:
                print(f"   ✅ Berhasil membuat {created_count} soal\n")
            else:
                print(f"   ⚠️  Tidak ada soal yang berhasil dibuat\n")
                failed_topics.append(topic.name)
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:100]}\n")
            failed_topics.append(topic.name)
    
    print("="*80)
    print(f"RINGKASAN REGENERASI:")
    print("="*80)
    print(f"Total soal berhasil dibuat: {total_created}")
    
    if failed_topics:
        print(f"\n⚠️  Topic yang gagal ({len(failed_topics)}):")
        for topic_name in failed_topics:
            print(f"   • {topic_name}")
    else:
        print(f"\n✅ Semua topic berhasil di-regenerate!")
    
    print()

def verify_questions():
    """Verifikasi soal yang baru di-generate"""
    print_header("✅ VERIFIKASI SOAL YANG BARU DI-GENERATE")
    
    topics = Topic.objects.all().order_by('order')
    
    print(f"{'Topic':<30} {'Total':>6} {'MCQ':>6} {'Fill':>6} {'Code':>6}")
    print("-"*80)
    
    total_all = 0
    
    for topic in topics:
        mcq = Question.objects.filter(topic=topic, question_type='mcq', is_active=True).count()
        fill = Question.objects.filter(topic=topic, question_type='fill', is_active=True).count()
        coding = Question.objects.filter(topic=topic, question_type='coding', is_active=True).count()
        total = mcq + fill + coding
        total_all += total
        
        status = "✅" if total >= 5 else "⚠️"
        print(f"{topic.name:<30} {total:>6} {mcq:>6} {fill:>6} {coding:>6} {status}")
    
    print("-"*80)
    print(f"{'TOTAL':<30} {total_all:>6}")
    print()

def pick_topic_interactive() -> Topic | None:
    """Show topics and let the user pick one"""
    topics = Topic.objects.all().order_by('order')
    if not topics.exists():
        print("❌ Tidak ada topik di database.")
        return None

    print("\nPilih Topik:")
    for idx, t in enumerate(topics, 1):
        count = Question.objects.filter(topic=t, is_active=True).count()
        print(f"{idx}. {t.name}  (existing: {count})")

    try:
        sel = int(input("\nMasukkan nomor topik: ").strip())
        if sel < 1 or sel > len(topics):
            print("❌ Nomor topik tidak valid.")
            return None
        return topics[sel - 1]
    except ValueError:
        print("❌ Input harus angka.")
        return None


def generate_questions_for_topic():
    """Generate questions for a single selected topic (max 15)"""
    print_header("🎯 GENERATE SOAL UNTUK SATU TOPIK")

    topic = pick_topic_interactive()
    if not topic:
        return

    # Difficulty
    diff_raw = input("Masukkan difficulty (1-5, default 2): ").strip()
    try:
        difficulty = int(diff_raw) if diff_raw else 2
        if difficulty < 1 or difficulty > 5:
            print("⚠️ Difficulty di luar rentang, gunakan 2.")
            difficulty = 2
    except ValueError:
        print("⚠️ Difficulty tidak valid, gunakan 2.")
        difficulty = 2

    # Count with hard cap of 15
    count_raw = input("Masukkan jumlah soal (max 15, default 10): ").strip()
    try:
        count = int(count_raw) if count_raw else 10
    except ValueError:
        print("⚠️ Jumlah tidak valid, gunakan 10.")
        count = 10

    if count < 1:
        print("⚠️ Minimal 1 soal. Diset ke 1.")
        count = 1
    if count > 15:
        print("⚠️ Maksimal 15 soal. Diset ke 15.")
        count = 15

    # MCQ count default ≈ half
    default_mcq = max(1, min(count, count // 2))
    mcq_raw = input(f"Masukkan jumlah MCQ (default {default_mcq}): ").strip()
    try:
        mcq_count = int(mcq_raw) if mcq_raw else default_mcq
    except ValueError:
        print(f"⚠️ MCQ tidak valid, gunakan {default_mcq}.")
        mcq_count = default_mcq

    if mcq_count < 0 or mcq_count > count:
        print(f"⚠️ MCQ harus 0..{count}. Diset ke {default_mcq}.")
        mcq_count = default_mcq

    print(f"\n📝 Topic: {topic.name}")
    print(f"   Difficulty: {difficulty}")
    print(f"   Total soal: {count} (MCQ: {mcq_count}, others: {count - mcq_count})")

    try:
        created = generate_question_set(
            topic_name=topic.name,
            difficulty=difficulty,
            count=count,
            mcq_count=mcq_count,
            max_workers=3
        )
        print(f"   ✅ Berhasil membuat {len(created)} soal untuk '{topic.name}'")
    except Exception as e:
        print(f"   ❌ Error generate: {str(e)[:200]}")

def main():
    """Main function - Interactive Menu"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*78 + "║")
    print("║" + "REGENERATE SEMUA SOAL DENGAN PROMPT YANG LEBIH BAIK".center(78) + "║")
    print("║" + " "*78 + "║")
    print("╚" + "="*78 + "╝")
    
    while True:
        print("\n" + "="*80)
        print("MENU PILIHAN:")
        print("="*80)
        print("1. 📋 Analisis Prompt Saat Ini")
        print("2. 📚 Lihat Daftar Topik")
        print("3. 🗑️  Hapus Semua Soal Lama")
        print("4. 🎯 Generate Soal untuk Satu Topik (limit 15)")
        print("5. 🔄 Regenerate Semua Topik (prompt baru)")
        print("6. ✅ Verifikasi Soal yang Baru")
        print("7. 🚀 JALANKAN SEMUA (hapus + generate + verifikasi)")
        print("8. Exit")
        print("="*80)
        
        choice = input("\nPilih menu (1-8): ").strip()
        
        if choice == '1':
            analyze_current_prompts()
        
        elif choice == '2':
            show_topics()
        
        elif choice == '3':
            delete_all_questions()
        
        elif choice == '4':
            generate_questions_for_topic()
        
        elif choice == '5':
            confirm = input("\n⚠️ Ini akan membuat soal untuk semua topik. Lanjutkan? (y/n): ").strip().lower()
            if confirm == 'y':
                regenerate_questions()
            else:
                print("❌ Pembatalan\n")
        
        elif choice == '6':
            verify_questions()
        
        elif choice == '7':
            print("\n⚠️ FULL REGENERASI: Hapus lama + Generate semua + Verifikasi")
            confirm = input("Lanjutkan? (y/n): ").strip().lower()

            if confirm == 'y':
                analyze_current_prompts()
                show_topics()

                if delete_all_questions():
                    input("\nTekan Enter untuk mulai generate semua topik...")
                    regenerate_questions()
                    verify_questions()
            else:
                print("❌ Pembatalan\n")
        
        elif choice == '8':
            print("\n✅ Keluar dari program\n")
            break
        
        else:
            print("❌ Pilihan tidak valid\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Program dihentikan oleh user\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)