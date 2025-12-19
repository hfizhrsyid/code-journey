#!/usr/bin/env python
"""
Script untuk reset semua user attempts (menghapus progress)
Setelah dijalankan, semua topik akan kembali ke status awal (hanya level 1 unlock)
"""

import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import QuestionAttempt, Topic, Question
from django.db.models import Count

def show_current_stats():
    """Tampilkan statistik attempts saat ini"""
    print("\n" + "="*80)
    print("📊 STATISTIK ATTEMPTS SAAT INI")
    print("="*80 + "\n")
    
    total_attempts = QuestionAttempt.objects.count()
    total_users = QuestionAttempt.objects.values('user').distinct().count()
    total_questions_attempted = QuestionAttempt.objects.values('question').distinct().count()
    
    print(f"Total Attempts: {total_attempts}")
    print(f"Total Users: {total_users}")
    print(f"Total Questions Attempted: {total_questions_attempted}")
    
    if total_attempts > 0:
        print("\nPerincian per Topic:")
        print("-" * 80)
        
        for topic in Topic.objects.all().order_by('order'):
            attempts = QuestionAttempt.objects.filter(question__topic=topic)
            if attempts.exists():
                correct = attempts.filter(is_correct=True).count()
                incorrect = attempts.filter(is_correct=False).count()
                unique_questions = attempts.values('question').distinct().count()
                
                print(f"  {topic.name}:")
                print(f"    - Total attempts: {attempts.count()}")
                print(f"    - Correct: {correct}, Incorrect: {incorrect}")
                print(f"    - Unique questions: {unique_questions}")
    
    print()

def reset_all_attempts():
    """Reset semua attempts"""
    print("\n" + "="*80)
    print("🗑️  RESET SEMUA ATTEMPTS")
    print("="*80 + "\n")
    
    total = QuestionAttempt.objects.count()
    
    if total == 0:
        print("✅ Tidak ada attempts untuk di-reset\n")
        return
    
    print(f"⚠️  PERINGATAN: Akan menghapus {total} attempts!")
    print("   Tindakan ini TIDAK DAPAT DIBATALKAN!\n")
    
    confirm = input("Ketik 'RESET' untuk lanjutkan (atau tekan Enter untuk batal): ").strip()
    
    if confirm == 'RESET':
        try:
            deleted_count, _ = QuestionAttempt.objects.all().delete()
            print(f"\n✅ Berhasil menghapus {deleted_count} attempts!")
            print("   Semua topik sekarang kembali ke status awal (hanya level 1 unlock)\n")
            return True
        except Exception as e:
            print(f"\n❌ Error saat menghapus: {e}\n")
            return False
    else:
        print("❌ Pembatalan - Attempts tidak dihapus\n")
        return False

def reset_specific_topic():
    """Reset attempts untuk topik tertentu"""
    print("\n" + "="*80)
    print("🎯 RESET ATTEMPTS UNTUK TOPIK TERTENTU")
    print("="*80 + "\n")
    
    topics = Topic.objects.all().order_by('order')
    
    if not topics.exists():
        print("❌ Tidak ada topik di database\n")
        return
    
    print("Pilih topik yang ingin di-reset:")
    for i, topic in enumerate(topics, 1):
        attempts = QuestionAttempt.objects.filter(question__topic=topic)
        print(f"{i}. {topic.name} ({attempts.count()} attempts)")
    
    try:
        choice = int(input("\nMasukkan nomor topik (atau 0 untuk batal): ").strip())
        
        if choice == 0:
            print("❌ Pembatalan\n")
            return
        
        if choice < 1 or choice > len(topics):
            print("❌ Nomor topik tidak valid\n")
            return
        
        selected_topic = topics[choice - 1]
        attempts_to_delete = QuestionAttempt.objects.filter(question__topic=selected_topic)
        count = attempts_to_delete.count()
        
        if count == 0:
            print(f"✅ Topik '{selected_topic.name}' tidak memiliki attempts\n")
            return
        
        print(f"\n⚠️  Akan menghapus {count} attempts untuk topik '{selected_topic.name}'")
        confirm = input("Ketik 'RESET' untuk lanjutkan (atau tekan Enter untuk batal): ").strip()
        
        if confirm == 'RESET':
            deleted_count, _ = attempts_to_delete.delete()
            print(f"\n✅ Berhasil menghapus {deleted_count} attempts untuk '{selected_topic.name}'\n")
        else:
            print("❌ Pembatalan\n")
    
    except ValueError:
        print("❌ Input harus angka\n")

def main():
    """Main menu"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*78 + "║")
    print("║" + "RESET USER ATTEMPTS - CODE JOURNEY".center(78) + "║")
    print("║" + " "*78 + "║")
    print("╚" + "="*78 + "╝")
    
    while True:
        print("\n" + "="*80)
        print("PILIH MENU:")
        print("="*80)
        print("1. 📊 Lihat Statistik Attempts")
        print("2. 🗑️  Reset Semua Attempts")
        print("3. 🎯 Reset Attempts untuk Topik Tertentu")
        print("4. Exit")
        print("="*80)
        
        choice = input("\nPilih menu (1-4): ").strip()
        
        if choice == '1':
            show_current_stats()
        elif choice == '2':
            if reset_all_attempts():
                show_current_stats()
        elif choice == '3':
            reset_specific_topic()
            show_current_stats()
        elif choice == '4':
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