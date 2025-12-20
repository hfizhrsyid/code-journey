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
from django.db.models import Count


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
    
def remove_null_code_templates():
    """Hapus/kosongkan field code_template pada soal yang memilikinya"""
    print_header("🧹 KOSONGKAN CODE_TEMPLATE PADA SOAL")
    
    # Ambil semua soal yang memiliki code_template yang tidak kosong
    code_questions = Question.objects.filter(is_active=True).exclude(code_template__isnull=True).exclude(code_template='')
    
    if code_questions.count() == 0:
        print("✅ Tidak ada soal dengan code_template\n")
        return
    
    total_with_code = code_questions.count()
    print(f"⚠️  Ditemukan {total_with_code} soal yang punya code_template!\n")
    
    # Tampilkan beberapa contoh soal dengan code_template
    print("Contoh soal yang akan dikosongkan code_template-nya:")
    print("-" * 80)
    for q in code_questions[:10]:
        topic_label = q.topic.name if q.topic else "N/A"
        print(f"  ID: {q.id} | Topik: {topic_label} | Tipe: {q.question_type.upper()}")
        print(f"  Soal: {str(q.question_text).strip()[:100]}...")
        if q.code_template:
            print(f"  Code: {str(q.code_template).strip()[:100]}...")
        print()
    
    if code_questions.count() > 10:
        print(f"  ... dan {code_questions.count() - 10} soal lainnya\n")
    
    # Konfirmasi sebelum menghapus
    print("⚠️  PERINGATAN: Operasi ini akan MENGHAPUS code_template dari soal!")
    print("   Soal TIDAK akan dihapus, hanya field code_template-nya saja.\n")
    
    while True:
        confirm = input("Lanjutkan untuk kosongkan code_template? Ketik 'HAPUS': ").strip()
        
        if confirm == 'HAPUS':
            try:
                count_updated = 0
                for q in code_questions:
                    q.code_template = None
                    q.save()
                    count_updated += 1
                
                print(f"\n✅ Berhasil kosongkan code_template pada {count_updated} soal!\n")
                return
            except Exception as e:
                print(f"\n❌ Error saat menghapus: {str(e)}\n")
                return
        else:
            print("❌ Pembatalan - code_template tidak dihapus\n")
            return

def delete_users():
    from django.contrib.auth.models import User
    print_header("🗑️  HAPUS USER")
    
    users = User.objects.all()
    
    if users.count() == 0:
        print("✅ Tidak ada user di database\n")
        return
    
    print(f"📋 Total user: {users.count()}\n")
    print("Daftar user:")
    print("-" * 80)
    
    user_list = list(users)
    for idx, user in enumerate(user_list, 1):
        status = "✅ Superuser" if user.is_superuser else ("👤 Staff" if user.is_staff else "👤 User")
        last_login = user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else "Belum login"
        print(f"  [{idx}] {user.username} ({user.email}) | {status} | Last login: {last_login}")
    
    print("\nOpsi:")
    print("  1. Hapus user berdasarkan ID")
    print("  2. Hapus semua user non-superuser")
    print("  3. Hapus ALL user (HATI-HATI!)")
    print("  0. Batal")
    
    action = input("\nPilih (0-3): ").strip()
    
    if action == '0':
        print("❌ Dibatalkan\n")
        return
    
    elif action == '1':
        # Hapus per user
        user_id_raw = input("Masukkan nomor user (dari daftar di atas): ").strip()
        try:
            user_id = int(user_id_raw)
            if user_id < 1 or user_id > len(user_list):
                print("❌ Nomor user tidak valid\n")
                return
            
            user_to_delete = user_list[user_id - 1]
            print(f"\n⚠️ PERINGATAN: Akan menghapus user '{user_to_delete.username}'!")
            confirm = input("Ketik username untuk konfirmasi, atau Enter untuk batal: ").strip()
            
            if confirm == user_to_delete.username:
                user_to_delete.delete()
                print(f"✅ User '{user_to_delete.username}' berhasil dihapus!\n")
            else:
                print("❌ Dibatalkan\n")
        
        except ValueError:
            print("❌ Input harus angka\n")
    
    elif action == '2':
        # Hapus non-superuser
        non_super = [u for u in user_list if not u.is_superuser]
        
        if not non_super:
            print("✅ Tidak ada user non-superuser\n")
            return
        
        print(f"\n⚠️ PERINGATAN: Akan menghapus {len(non_super)} user non-superuser!")
        print("User yang akan dihapus:")
        for u in non_super:
            print(f"  - {u.username}")
        
        confirm = input("\nKetik 'HAPUS' untuk lanjutkan: ").strip()
        
        if confirm == 'HAPUS':
            deleted_count = 0
            for u in non_super:
                u.delete()
                deleted_count += 1
            print(f"\n✅ Berhasil menghapus {deleted_count} user!\n")
        else:
            print("❌ Dibatalkan\n")
    
    elif action == '3':
        # Hapus semua user
        print(f"\n⚠️ PERINGATAN KRITIS: Akan menghapus SEMUA {len(user_list)} user!")
        confirm = input("Ketik 'HAPUS_SEMUA' untuk lanjutkan: ").strip()
        
        if confirm == 'HAPUS_SEMUA':
            deleted_count = len(user_list)
            User.objects.all().delete()
            print(f"\n✅ Berhasil menghapus {deleted_count} user!\n")
        else:
            print("❌ Dibatalkan\n")
    
    else:
        print("❌ Pilihan tidak valid\n")

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

def list_questions(limit: int = 50, topic_name: str | None = None, include_inactive: bool = False):
    """Tampilkan daftar soal (ringkas) beserta jawaban/opsi kunci."""
    qs = Question.objects.all().order_by("-created_at")
    if topic_name:
        qs = qs.filter(topic__name__iexact=topic_name)
    if not include_inactive:
        qs = qs.filter(is_active=True)
    qs = qs[:limit]

    print_header(f"🔍 DAFTAR SOAL (max {limit}{' | topik=' + topic_name if topic_name else ''})")
    if qs.count() == 0:
        print("❌ Tidak ada soal ditemukan\n")
        return

    for q in qs:
        topic_label = q.topic.name if q.topic else "N/A"
        ans = q.answer_key
        if isinstance(ans, (list, dict)):
            ans_preview = str(ans)[:120]
        else:
            ans_preview = str(ans)[:120]

        print(f"ID: {q.id} | {q.question_type.upper()} | Dif {q.difficulty} | Topic: {topic_label} | Active: {q.is_active}")
        print(f"Q : {str(q.question_text).strip()[:220]}")
        if q.code_template:
            print(f"Code: {str(q.code_template).strip()[:160]}")
        if q.options:
            print(f"Opsi: {q.options}")
        print(f"Ans: {ans_preview}")
        if q.explanation:
            print(f"Exp: {str(q.explanation).strip()[:160]}")
        print("-" * 80)


def debug_list_and_delete():
    """Menu kecil: lihat daftar soal lalu opsi hapus satuan."""
    topic_filter = input("Filter topik (kosongkan bila tidak perlu): ").strip() or None
    limit_raw = input("Limit tampilan (default 50): ").strip()
    try:
        limit = int(limit_raw) if limit_raw else 50
    except ValueError:
        limit = 50

    include_inactive = input("Tampilkan yang non-aktif? (y/n, default n): ").strip().lower() == "y"

    list_questions(limit=limit, topic_name=topic_filter, include_inactive=include_inactive)

    while True:
        action = input("\nKetik ID untuk hapus, 'r' untuk refresh, atau Enter untuk kembali: ").strip().lower()
        if action == "":
            break
        if action == "r":
            list_questions(limit=limit, topic_name=topic_filter, include_inactive=include_inactive)
            continue
        try:
            qid = int(action)
            try:
                q = Question.objects.get(id=qid)
            except Question.DoesNotExist:
                print("❌ Soal ID tidak ditemukan\n")
                continue
            confirm = input(f"⚠️  Hapus soal ID {qid} (topic={q.topic}, type={q.question_type})? Ketik 'HAPUS': ").strip()
            if confirm != "HAPUS":
                print("❌ Dibatalkan\n")
                continue
            deleted, _ = q.delete()
            print(f"✅ Terhapus: {deleted} record\n")
        except ValueError:
            print("❌ Input tidak dikenali (ketik angka atau 'r' atau Enter)\n")

def export_questions_to_file():
    """Export semua soal beserta jawaban ke file text/CSV"""
    print_header("📥 EXPORT SOAL KE FILE")
    
    # Filter options
    topic_filter = input("Filter topik (kosongkan untuk semua): ").strip() or None
    include_inactive = input("Termasuk soal non-aktif? (y/n, default n): ").strip().lower() == "y"
    
    # Format options
    print("\nPilih format export:")
    print("1. TEXT (rapi, mudah dibaca)")
    print("2. CSV (untuk spreadsheet)")
    format_choice = input("Pilih (1-2, default 1): ").strip() or "1"
    
    # Get questions
    qs = Question.objects.all().order_by("topic__order", "-created_at")
    if topic_filter:
        qs = qs.filter(topic__name__iexact=topic_filter)
    if not include_inactive:
        qs = qs.filter(is_active=True)
    
    if qs.count() == 0:
        print("❌ Tidak ada soal ditemukan\n")
        return
    
    # Generate filename
    import datetime
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    topic_suffix = f"_{topic_filter.replace(' ', '_')}" if topic_filter else ""
    
    if format_choice == "2":
        filename = f"soal_export_{timestamp}{topic_suffix}.csv"
        _export_to_csv(qs, filename)
    else:
        filename = f"soal_export_{timestamp}{topic_suffix}.txt"
        _export_to_text(qs, filename)
    
    print(f"✅ Export selesai: {filename}\n")


def _export_to_text(qs, filename: str):
    """Export to formatted TEXT file"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("=" * 100 + "\n")
        f.write("DAFTAR SOAL DAN JAWABAN\n")
        f.write(f"Export: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total soal: {qs.count()}\n")
        f.write("=" * 100 + "\n\n")
        
        for idx, q in enumerate(qs, 1):
            topic_label = q.topic.name if q.topic else "N/A"
            
            f.write(f"\n{'[SOAL #' + str(idx) + ']'}\n")
            f.write(f"ID: {q.id}\n")
            f.write(f"Topik: {topic_label}\n")
            f.write(f"Tipe: {q.question_type.upper()}\n")
            f.write(f"Difficulty: {q.difficulty}/5\n")
            f.write(f"Status: {'Aktif' if q.is_active else 'Non-Aktif'}\n")
            f.write("-" * 100 + "\n")
            
            f.write(f"SOAL:\n{q.question_text}\n\n")
            
            if q.code_template:
                f.write(f"CODE TEMPLATE:\n{q.code_template}\n\n")
            
            if q.options:
                f.write(f"OPSI:\n")
                if isinstance(q.options, list):
                    for opt in q.options:
                        f.write(f"  {opt}\n")
                else:
                    f.write(f"  {q.options}\n")
                f.write("\n")
            
            f.write(f"JAWABAN:\n{q.answer_key}\n\n")
            
            if q.explanation:
                f.write(f"PENJELASAN:\n{q.explanation}\n\n")
            
            if q.test_cases:
                f.write(f"TEST CASES:\n{q.test_cases}\n\n")
            
            f.write("=" * 100 + "\n")

def edit_question():
    """Edit soal yang sudah ada"""
    print_header("✏️  EDIT SOAL")
    
    # Cari soal berdasarkan ID
    qid_raw = input("Masukkan ID soal yang akan diedit: ").strip()
    if not qid_raw:
        print("❌ Dibatalkan\n")
        return
    
    try:
        qid = int(qid_raw)
    except ValueError:
        print("❌ ID harus angka\n")
        return
    
    try:
        q = Question.objects.get(id=qid)
    except Question.DoesNotExist:
        print("❌ Soal tidak ditemukan\n")
        return
    
    print(f"\n{'='*80}")
    print(f"ID: {q.id} | {q.question_type.upper()} | Topik: {q.topic.name if q.topic else 'N/A'}")
    print(f"{'='*80}\n")
    
    # Menu edit
    while True:
        print("\nPilih field yang akan diedit:")
        print("1. Teks Soal")
        print("2. Code Template")
        print("3. Opsi (untuk MCQ)")
        print("4. Jawaban")
        print("5. Penjelasan")
        print("6. Difficulty")
        print("7. Lihat semua field")
        print("0. Selesai editing")
        print("-" * 80)
        
        field_choice = input("Pilih (0-7): ")

        if field_choice == '0':
            print("✅ Editing selesai\n")
            break
        
        elif field_choice == '1':
            print(f"\nTeks soal saat ini:\n{q.question_text}\n")
            new_text = input("Masukkan teks soal baru (atau Enter untuk batal): ").strip()
            if new_text:
                q.question_text = new_text
                q.save()
                print("✅ Teks soal berhasil diubah\n")
        
        elif field_choice == '2':
            if q.code_template:
                print(f"\nCode template saat ini:\n{q.code_template}\n")
                print("Opsi:")
                print("1. Edit code template")
                print("2. Hapus code template")
                print("0. Batal")
                code_action = input("Pilih (0-2): ").strip()
                
                if code_action == '1':
                    new_code = input("\nMasukkan code template baru: ").strip()
                    if new_code:
                        q.code_template = new_code
                        q.save()
                        print("✅ Code template berhasil diubah\n")
                
                elif code_action == '2':
                    confirm = input("⚠️ Hapus code template? Ketik 'HAPUS' untuk lanjut: ").strip()
                    if confirm == 'HAPUS':
                        q.code_template = None
                        q.save()
                        print("✅ Code template berhasil dihapus\n")
                    else:
                        print("❌ Dibatalkan\n")
            else:
                print("\n⚠️ Soal ini belum memiliki code template\n")
                new_code = input("Masukkan code template baru (atau Enter untuk batal): ").strip()
                if new_code:
                    q.code_template = new_code
                    q.save()
                    print("✅ Code template berhasil ditambahkan\n")
        
        elif field_choice == '3':
            if q.question_type != 'mcq':
                print("❌ Field opsi hanya untuk tipe MCQ\n")
                continue
            
            if isinstance(q.options, list):
                print(f"\nOpsi saat ini:")
                for i, opt in enumerate(q.options):
                    print(f"  {i+1}. {opt}")
            
            print("\nFormat opsi: A. teks | B. teks | C. teks | D. teks")
            new_options = input("\nMasukkan opsi baru (atau Enter untuk batal): ").strip()
            if new_options:
                # Parse opsi
                opts = [opt.strip() for opt in new_options.split('|')]
                if len(opts) == 4:
                    q.options = opts
                    q.save()
                    print("✅ Opsi berhasil diubah\n")
                else:
                    print("❌ Opsi harus tepat 4 item (pisahkan dengan |)\n")
        
        elif field_choice == '4':
            print(f"\nJawaban saat ini: {q.answer_key}\n")
            new_answer = input("Masukkan jawaban baru (atau Enter untuk batal): ").strip()
            if new_answer:
                # Coba parse sebagai JSON jika perlu
                try:
                    import json
                    if new_answer.startswith('[') or new_answer.startswith('{'):
                        q.answer_key = json.loads(new_answer)
                    else:
                        q.answer_key = new_answer
                except:
                    q.answer_key = new_answer
                
                q.save()
                print("✅ Jawaban berhasil diubah\n")
        
        elif field_choice == '5':
            if q.explanation:
                print(f"\nPenjelasan saat ini:\n{q.explanation}\n")
            new_exp = input("Masukkan penjelasan baru (atau Enter untuk batal): ").strip()
            if new_exp:
                q.explanation = new_exp
                q.save()
                print("✅ Penjelasan berhasil diubah\n")
        
        elif field_choice == '6':
            print(f"\nDifficulty saat ini: {q.difficulty}/5")
            new_diff = input("Masukkan difficulty baru (1-5, atau Enter untuk batal): ").strip()
            if new_diff:
                try:
                    diff = int(new_diff)
                    if 1 <= diff <= 5:
                        q.difficulty = diff
                        q.save()
                        print("✅ Difficulty berhasil diubah\n")
                    else:
                        print("❌ Difficulty harus 1-5\n")
                except ValueError:
                    print("❌ Difficulty harus angka\n")
        
        elif field_choice == '7':
            # Display all fields
            print(f"\n{'='*80}")
            print(f"ID: {q.id}")
            print(f"Topik: {q.topic.name if q.topic else 'N/A'}")
            print(f"Tipe: {q.question_type.upper()}")
            print(f"Difficulty: {q.difficulty}/5")
            print(f"Status: {'Aktif' if q.is_active else 'Non-Aktif'}")
            print(f"{'='*80}")
            print(f"\nSOAL:\n{q.question_text}")
            
            if q.code_template:
                print(f"\nCODE TEMPLATE:\n{q.code_template}")
            
            if q.options:
                print(f"\nOPSI:")
                if isinstance(q.options, list):
                    for opt in q.options:
                        print(f"  {opt}")
            
            print(f"\nJAWABAN: {q.answer_key}")
            
            if q.explanation:
                print(f"\nPENJELASAN:\n{q.explanation}\n")
        
        else:
            print("❌ Pilihan tidak valid\n")
            
def clean_mcq_options():
    """Bersihkan prefix A, B, C, D dari opsi MCQ"""
    print_header("🧹 BERSIHKAN PREFIX A, B, C, D DARI OPSI MCQ")
    
    # Ambil semua soal MCQ yang opsinya masih punya prefix
    mcq_questions = Question.objects.filter(question_type='mcq', is_active=True)
    
    if mcq_questions.count() == 0:
        print("❌ Tidak ada soal MCQ ditemukan\n")
        return
    
    count_cleaned = 0
    
    for q in mcq_questions:
        if not isinstance(q.options, list) or len(q.options) == 0:
            continue
        
        # Check apakah opsi punya prefix A., B., C., D.
        has_prefix = all(
            opt.strip() and opt.strip()[0] in ['A', 'B', 'C', 'D'] and 
            len(opt.strip()) > 1 and opt.strip()[1] in ['.', ':', ' ']
            for opt in q.options
        )
        
        if has_prefix:
            print(f"\n📝 ID {q.id}: {q.topic.name if q.topic else 'N/A'}")
            print("Opsi sebelum:")
            for opt in q.options:
                print(f"  {opt}")
            
            # Bersihkan prefix
            cleaned_options = []
            for opt in q.options:
                opt_clean = opt.strip()
                # Hapus prefix A., A:, A , B., B:, B , dst
                import re
                opt_clean = re.sub(r'^[A-D][\.\:\s]+', '', opt_clean).strip()
                cleaned_options.append(opt_clean)
            
            q.options = cleaned_options
            q.save()
            count_cleaned += 1
            
            print("Opsi sesudah:")
            for i, opt in enumerate(cleaned_options):
                letter = chr(65 + i)
                print(f"  {letter}. {opt}")
    
    print(f"\n{'='*80}")
    print(f"✅ Selesai! {count_cleaned} soal MCQ dibersihkan\n")
    
def remove_duplicate_questions():
    """Deteksi dan hapus soal yang duplicate berdasarkan question_text"""
    print_header("🔄 DETEKSI DAN HAPUS SOAL DUPLICATE")
    
    
    
    # Ambil soal aktif dan group by question_text
    all_questions = Question.objects.filter(is_active=True).order_by('topic', 'created_at')
    
    if all_questions.count() == 0:
        print("❌ Tidak ada soal untuk diperiksa\n")
        return
    
    # Dictionary untuk track soal berdasarkan text (normalized)
    duplicates_map = {}
    
    for q in all_questions:
        # Normalize text untuk comparison
        normalized_text = normalize_question_text(q.question_text)
        
        if normalized_text not in duplicates_map:
            duplicates_map[normalized_text] = []
        duplicates_map[normalized_text].append(q)
    
    # Filter hanya yang duplicate (lebih dari 1)
    duplicates = {k: v for k, v in duplicates_map.items() if len(v) > 1}
    
    if not duplicates:
        print("✅ Tidak ada soal duplicate ditemukan\n")
        return
    
    print(f"⚠️  Ditemukan {len(duplicates)} group soal yang duplicate!\n")
    
    total_to_delete = 0
    
    # Tampilkan dan tanya user untuk setiap group duplicate
    for idx, (normalized_text, questions) in enumerate(duplicates.items(), 1):
        print(f"\n{'='*80}")
        print(f"GROUP {idx}: {len(questions)} soal duplicate")
        print(f"Text: {normalized_text[:100]}...")
        print(f"{'='*80}\n")
        
        for i, q in enumerate(questions, 1):
            topic_label = q.topic.name if q.topic else "N/A"
            print(f"  [{i}] ID: {q.id} | Topik: {topic_label} | Tipe: {q.question_type.upper()} | Created: {q.created_at.strftime('%Y-%m-%d %H:%M')}")
        
        print("\nOpsi:")
        print("  1. Hapus semua kecuali yang pertama (paling lama)")
        print("  2. Hapus semua kecuali yang terakhir (paling baru)")
        print("  3. Pilih manual mana yang mau dihapus")
        print("  0. Skip group ini")
        
        action = input("Pilih (0-3): ").strip()
        
        if action == '0':
            continue
        
        elif action == '1':
            # Keep first (oldest), delete rest
            to_keep = questions[0]
            to_delete = questions[1:]
            
            print(f"\n✅ Keep ID {to_keep.id} (created {to_keep.created_at.strftime('%Y-%m-%d %H:%M')})")
            for q_del in to_delete:
                confirm = input(f"  Delete ID {q_del.id} (created {q_del.created_at.strftime('%Y-%m-%d %H:%M')})? (y/n): ").strip().lower()
                if confirm == 'y':
                    q_del.delete()
                    total_to_delete += 1
                    print(f"    ✅ Deleted")
        
        elif action == '2':
            # Keep last (newest), delete rest
            to_keep = questions[-1]
            to_delete = questions[:-1]
            
            print(f"\n✅ Keep ID {to_keep.id} (created {to_keep.created_at.strftime('%Y-%m-%d %H:%M')})")
            for q_del in to_delete:
                confirm = input(f"  Delete ID {q_del.id} (created {q_del.created_at.strftime('%Y-%m-%d %H:%M')})? (y/n): ").strip().lower()
                if confirm == 'y':
                    q_del.delete()
                    total_to_delete += 1
                    print(f"    ✅ Deleted")
        
        elif action == '3':
            # Manual selection
            print("\nMasukkan nomor soal yang ingin HAPUS (pisahkan dengan koma, atau Enter untuk skip)")
            print("Contoh: 2,3 (untuk hapus soal nomor 2 dan 3)")
            
            selection = input("Pilih: ").strip()
            if not selection:
                continue
            
            try:
                indices = [int(x.strip()) for x in selection.split(',')]
                for idx_select in indices:
                    if 1 <= idx_select <= len(questions):
                        q_to_delete = questions[idx_select - 1]
                        confirm = input(f"Delete ID {q_to_delete.id}? (y/n): ").strip().lower()
                        if confirm == 'y':
                            q_to_delete.delete()
                            total_to_delete += 1
                            print(f"  ✅ Deleted")
                    else:
                        print(f"  ❌ Nomor {idx_select} tidak valid")
            except ValueError:
                print("❌ Format tidak valid\n")
    
    print(f"\n{'='*80}")
    print(f"SELESAI!")
    print(f"Total soal yang dihapus: {total_to_delete}")
    print(f"{'='*80}\n")


def normalize_question_text(text: str) -> str:
    """Normalize question text untuk duplicate detection"""
    import re
    # Convert to lowercase, remove extra whitespace
    normalized = " ".join(text.lower().strip().split())
    # Remove punctuation untuk comparison lebih strict
    normalized = re.sub(r'[^\w\s]', '', normalized)
    return normalized

def _export_to_csv(qs, filename: str):
    """Export to CSV file"""
    import csv
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
            "ID", "Topik", "Tipe", "Difficulty", "Status", 
            "Soal", "Code Template", "Opsi", "Jawaban", "Penjelasan", "Test Cases"
        ])
        
        # Data rows
        for q in qs:
            topic_label = q.topic.name if q.topic else "N/A"
            status = "Aktif" if q.is_active else "Non-Aktif"
            
            # Format options
            if isinstance(q.options, list):
                options_str = " | ".join(q.options)
            else:
                options_str = str(q.options) if q.options else ""
            
            # Format answer
            if isinstance(q.answer_key, (list, dict)):
                ans_str = str(q.answer_key)
            else:
                ans_str = str(q.answer_key)
            
            writer.writerow([
                q.id,
                topic_label,
                q.question_type.upper(),
                q.difficulty,
                status,
                q.question_text,
                q.code_template or "",
                options_str,
                ans_str,
                q.explanation or "",
                str(q.test_cases) if q.test_cases else ""
            ])


import datetime

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
        print("8. 🔍 Lihat daftar soal + hapus satuan")
        print("9. 📥 Export soal ke file")
        print("10. ✏️  Edit soal")
        print("11. 🧹 Bersihkan prefix A,B,C,D dari opsi MCQ")
        print("12. 🔄 Deteksi dan hapus soal duplicate")
        print("13. 🗑️  Hapus code_template NULL dari soal")
        print("14. 👤 Hapus user")
        print("0. Exit")
        print("="*80)
        
        choice = input("\nPilih menu (0-13): ").strip()
        
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
            debug_list_and_delete()
        
        elif choice == '9':
            export_questions_to_file()
        
        elif choice == '10':
            edit_question()
        
        elif choice == '11':
            clean_mcq_options()
            
        elif choice == '12':
            remove_duplicate_questions()
            
        elif choice == '13':
            remove_null_code_templates()
        
        elif choice == '14':
            delete_users()
                    
            topics = Topic.objects.all().order_by('order')
            
            if not topics.exists():
                print("❌ Tidak ada topik di database!")
                return
            
            for topic in topics:
                mcq_questions = Question.objects.filter(topic=topic, question_type='mcq', is_active=True)
                
                for q in mcq_questions:
                    if isinstance(q.options, list) and len(q.options) == 4:
                        new_options = [opt[3:] for opt in q.options]  # Hapus prefix A. B. C. D.
                        q.options = new_options
                        q.save()
                        print(f"✅ Soal ID {q.id} di-topik '{topic.name}' telah dibersihkan")
            
            print("\n✅ Selesai membersihkan semua soal MCQ")
        
        elif choice == '0':
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

