import hashlib
import json
from groq import Groq
from django.conf import settings
from typing import Dict, Any, List, Tuple, Optional
import logging
import random
from .models import Question
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from functools import lru_cache

logger = logging.getLogger(__name__)

# Monkey patch to fix groq/httpx compatibility issue
# This is needed because groq 0.4.2 tries to pass 'proxies' to httpx.Client
# which is not supported in httpx 0.23.3
try:
    import httpx
    original_init = httpx.Client.__init__
    
    def patched_init(self, *args, **kwargs):
        # Remove 'proxies' parameter if present
        kwargs.pop('proxies', None)
        return original_init(self, *args, **kwargs)
    
    httpx.Client.__init__ = patched_init
    logger.info("Applied httpx.Client monkey patch for groq compatibility")
except Exception as e:
    logger.warning(f"Could not apply httpx monkey patch: {str(e)}")

# Lazy initialization of Groq client
_groq_client: Optional[Groq] = None


def get_groq_client() -> Groq:
    """Get or initialize Groq client with error handling"""
    global _groq_client
    
    if _groq_client is None:
        api_key = getattr(settings, 'GROQ_API_KEY', None)
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not configured. Please set it in settings.py or .env file"
            )
        try:
            _groq_client = Groq(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {str(e)}")
            raise
    
    return _groq_client


def normalize_question_text(text: str) -> str:
    """Normalize question text to a stable, comparable form for hashing."""
    return " ".join((text or "").strip().lower().split())


def hash_question(text: str, qtype: str) -> str:
    """Build a deterministic hash for de-duplication keyed by type + normalized text."""
    payload = f"{qtype}::{normalize_question_text(text)}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


PROMPT_TEMPLATES = {
    "mcq": """Buatlah 1 soal pilihan ganda Pemrograman Python untuk topik: {topic}
Tingkat kesulitan: {difficulty} (1=mudah, 5=sulit)

SYARAT SOAL KETAT:
✓ Soal HARUS relevan dengan topik "{topic}"
✓ 4 pilihan jawaban UNIK dan JELAS BERBEDA (A, B, C, D)
✓ Hanya 1 jawaban yang benar
✓ JAWABAN TIDAK BOLEH OBVIOUS/TERLIHAT DI SOAL ITU SENDIRI
✓ Gunakan VARIASI TIPE pertanyaan (jangan semua "berapa hasilnya")
✓ Opsi harus LOGIS namun BERBEDA JELAS (bukan duplikat)

VARIASI TIPE SOAL - PILIH SALAH SATU (ROTASI):
1. DEFINISI/KONSEP (terbukti efektif untuk variasi):
   - "Apa perbedaan antara X dan Y?"
   - "Apa yang dimaksud dengan X?"
   - "Fungsi dari X adalah?"
   - Contoh BAIK: "Apa perbedaan == dan 'is'?"
   - Contoh BURUK: "Variabel x adalah... (jawaban obvious)"

2. PREDIKSI OUTPUT (dengan code snippet):
   - Tunjukkan code Python lengkap
   - Tanyakan: "Output dari kode berikut adalah?"
   - Opsi: nilai berbeda, error names, tipe data berbeda
   - PENTING: Jawaban harus tidak obvious/mudah dilihat

3. BUG FINDING / ERROR DETECTION:
   - Tunjukkan code YANG SALAH
   - Tanyakan: "Error apa yang dihasilkan?" / "Apa yang salah?"
   - Opsi: berbagai error types (TypeError, IndexError, etc)

4. KONSEP LOGIKA / FLOW CONTROL:
   - Tanyakan tentang kondisi, loop, atau hasil logika
   - Tunjukkan code dengan kondisi khusus
   - Opsi: hasil berbeda berdasarkan kondisi

5. SYNTAX / SEMANTIK:
   - "Mana yang merupakan syntax Python yang benar?"
   - "Kode mana yang menghasilkan hasil X?"
   - Opsi: berbagai syntax patterns

CHECKLIST SEBELUM RETURN:
- [ ] Tipe soal BERBEDA dari sebelumnya (tidak semua output prediction)
- [ ] Opsi A, B, C, D JELAS BERBEDA (tidak ada overlap)
- [ ] Jawaban TIDAK obvious di pertanyaan/code (butuh pemahaman)
- [ ] Minimal 1 distractors yang LOGIS tapi salah
- [ ] Tidak ada opsi yang merupakan substring dari opsi lain

CONTOH SOAL BAIK:
Q: Perbedaan antara == dan 'is' dalam Python adalah?
A. == membandingkan nilai, 'is' membandingkan identitas (memory reference)
B. 'is' lebih cepat dari ==
C. Keduanya sama, hanya nama berbeda
D. 'is' hanya untuk string

CONTOH SOAL BURUK (JANGAN):
Q: Variabel x diberi nilai 10, berapa nilai x? (TERLALU OBVIOUS)
Q: print(5 * 2 % 3), berapa hasilnya? (hanya menghitung, tidak konsep)

RETURN HANYA JSON (tanpa kode lain):
{{
  "question_text": "Pertanyaan yang jelas, tidak obvious, dan menantang...",
  "code_template": "Python code jika diperlukan, atau null jika pure konsep",
  "options": ["A. opsi 1 (distinct)", "B. opsi 2 (logis tapi salah)", "C. opsi 3 (distinct)", "D. opsi 4 (jawaban benar)"],
  "answer_key": "D",
  "explanation": "Penjelasan mengapa D benar, dan mengapa A/B/C salah. Jelaskan konsep utama."
}}""",

    "fill": """Buatlah 1 soal isi-kosong (completion) untuk topik: {topic}
Tingkat kesulitan: {difficulty} (1=mudah, 5=sulit)

SYARAT SOAL:
✓ Soal HARUS relevan dengan topik "{topic}"
✓ Ada bagian kosong (___ atau ...) yang harus diisi
✓ User harus mengisi kode atau nilai yang hilang
✓ Jawaban singkat dan spesifik

CONTOH:
- Variabel: user mengisi tipe data atau deklarasi variabel
- Operator: user mengisi hasil operasi atau operator
- Percabangan: user mengisi kondisi atau statement
- Perulangan: user mengisi range atau kondisi loop
- Dll

RETURN HANYA JSON:
{{
  "question_text": "Isilah ___ untuk membuat kode yang...",
  "code_template": "x = ___\\nprint(x)",
  "answer_key": "10",
  "explanation": "Penjelasan singkat tentang jawaban dan topik {topic}"
}}""",

    "coding": """Buatlah 1 soal coding untuk topik: {topic}
Tingkat kesulitan: {difficulty} (1=mudah, 5=sulit)

SYARAT SOAL:
✓ Soal HARUS relevan dengan topik "{topic}"
✓ User harus menulis fungsi atau program lengkap
✓ Berikan template dasar
✓ Jawaban harus jelas dan dapat ditest
✓ HARUS ada minimal 2 test cases

RETURN HANYA JSON:
{{
  "question_text": "Buatlah fungsi yang [deskripsi task]...",
  "code_template": "def solution():\\n    # Write your code here\\n    pass",
  "answer_key": "def solution():\\n    return 42",
  "test_cases": [
    {{"input": "5", "expected_output": "10"}},
    {{"input": "10", "expected_output": "20"}}
  ],
  "explanation": "Penjelasan solusi dan konsep {topic}"
}}"""
}


def generate_question(difficulty: int, question_type: str, topic: str = "Pemrograman Python") -> Dict[str, Any]:
    """Generate a programming question using Groq API"""
    
    if question_type not in PROMPT_TEMPLATES:
        raise ValueError(f"Invalid question type: {question_type}")
    
    if not 1 <= difficulty <= 5:
        raise ValueError("Difficulty must be between 1 and 5")
    
    prompt = PROMPT_TEMPLATES[question_type].format(difficulty=difficulty, topic=topic)
    
    try:
        logger.info(f"Generating {question_type} question with difficulty {difficulty}")
        
        message = get_groq_client().chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.85,
            max_tokens=1000,
        )
        
        result_text = message.choices[0].message.content.strip()
        logger.info(f"Raw response: {result_text[:200]}...")
        
        # Clean up JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        # Try to extract JSON if wrapped in text
        if not result_text.startswith("{"):
            start_idx = result_text.find("{")
            if start_idx != -1:
                result_text = result_text[start_idx:]
        
        if not result_text.endswith("}"):
            end_idx = result_text.rfind("}")
            if end_idx != -1:
                result_text = result_text[:end_idx+1]
        
        # Parse JSON
        parsed = json.loads(result_text)
        
        # Validate required fields
        if not parsed.get("question_text"):
            raise ValueError("Missing question_text")
        if not parsed.get("answer_key"):
            raise ValueError("Missing answer_key")
        
        # ✅ UNTUK MCQ: Clean dan Validate
        if question_type == "mcq":
            if not parsed.get("options") or len(parsed["options"]) != 4:
                raise ValueError("MCQ must have exactly 4 options")
            
            # Step 1: Clean duplicate prefixes (e.g., "A. A. 8" -> "A. 8")
            parsed["options"] = clean_mcq_options(parsed["options"])
            logger.info(f"Cleaned MCQ options: {parsed['options']}")
            
            # Step 2: Validate options tidak tumpang tindih
            is_valid, error_msg = validate_mcq_options(parsed["options"])
            if not is_valid:
                raise ValueError(f"MCQ opsi tidak valid: {error_msg}")
            
            logger.info(f"✓ MCQ options validated successfully")
        
        logger.info(f"Question generated successfully: {parsed.get('question_text')[:50]}...")
        return parsed
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}, text: {result_text[:300]}")
        raise ValueError(f"Invalid JSON from AI: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating question: {str(e)}")
        raise Exception(f"Failed to generate question: {str(e)}")


def ai_validate_answer(user_answer: str, correct_answer: Any, question_text: str, question_type: str, max_tokens: int = 400) -> Dict[str, Any]:
    """
    Use the Groq LLM to judge whether a user's answer is correct for fill/coding questions.
    Expected return: dict with keys 'correct' (bool), 'feedback' (str), 'explanation' (str).
    If AI validation fails or returns invalid JSON, this function returns None.
    
    Args:
        user_answer: The user's submitted answer
        correct_answer: The reference/correct answer
        question_text: The question being asked
        question_type: Type of question (fill or coding)
        max_tokens: Maximum tokens for AI response
    
    Returns:
        Dict with validation result or None if AI validation fails
    """
    if not user_answer or not user_answer.strip():
        logger.warning("ai_validate_answer called with empty user answer")
        return None
    
    try:
        # Build a concise but strict prompt asking AI to return JSON only
        prompt = f"""
You are an evaluator assistant. Given a programming question and a user's answer, decide whether the user's answer is CORRECT.
- Return ONLY a JSON object and NOTHING else.
- JSON must contain keys: "correct" (true/false), "feedback" (string), "explanation" (string).
Rules:
- For 'fill' (short textual answers): consider semantic equivalence and allow different wording, ignore case and trivial whitespace differences. If the meaning matches the reference answer, mark correct.
- For 'coding': prefer to check for syntax errors first. If the user's code contains syntax errors that would prevent the answer from working, mark incorrect and explain the syntax issue. If the code is syntactically valid but uses different variable names or formatting, consider it correct if it is functionally equivalent.
- Do NOT reveal the correct answer verbatim in 'feedback' if the user's answer is wrong; instead give a hint or next step to check.
Input:
Question: {question_text}
Reference answer: {correct_answer}
User answer: {user_answer}
Question type: {question_type}

Return JSON, for example:
{{ "correct": true, "feedback": "✓ Jawaban Anda benar!", "explanation": "Penjelasan singkat" }}
"""
        message = get_groq_client().chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            max_tokens=max_tokens,
            timeout=30  # 30 second timeout
        )
        content = message.choices[0].message.content.strip()

        if not content:
            logger.warning("AI validation returned empty content")
            return None

        # attempt to extract JSON payload if code fences present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        # find first { and last } to be robust
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            content = content[start:end+1]

        parsed = json.loads(content)

        # Basic validation
        if "correct" not in parsed or "feedback" not in parsed:
            logger.warning("AI validation returned JSON missing required keys")
            return None

        # normalize types
        parsed["correct"] = bool(parsed.get("correct"))
        parsed["feedback"] = str(parsed.get("feedback") or "")
        parsed["explanation"] = str(parsed.get("explanation") or "")

        return parsed

    except json.JSONDecodeError as e:
        logger.warning(f"AI validation JSON decode error: {e}")
        return None
    except Exception as e:
        logger.warning(f"AI validation failed: {e}")
        return None


def check_answer(user_answer: str, correct_answer: Any, question_type: str, explanation: str = "", question_instance=None) -> Dict[str, Any]:
    """
    Check if user answer is correct.
    
    Args:
        user_answer: The user's submitted answer
        correct_answer: The reference/correct answer from database
        question_type: Type of question (mcq, fill, coding)
        explanation: Question explanation text
        question_instance: Optional Question model instance (for accessing test_cases)
    
    Returns:
        Dict with keys: correct, feedback, correct_answer, explanation
    """
    
    result = {
        "correct": False,
        "feedback": "",
        "correct_answer": str(correct_answer),
        "explanation": explanation
    }
    
    # ========== MULTIPLE CHOICE QUESTIONS ==========
    if question_type == "mcq":
        # Exact letter match, case-insensitive
        result["correct"] = user_answer.strip().upper() == str(correct_answer).strip().upper()
        if result["correct"]:
            result["feedback"] = "✓ Jawaban Anda benar!"
        else:
            result["feedback"] = "✗ Jawaban Anda salah. Silakan coba lagi."
        return result

    # ========== CODING QUESTIONS ==========
    if question_type == "coding":
        # Cek input tidak kosong
        if not user_answer or not user_answer.strip():
            result["correct"] = False
            result["feedback"] = "✗ Kode tidak boleh kosong."
            return result
        
        # PRIORITY 1: Gunakan test_cases jika ada pada soal
        if question_instance and hasattr(question_instance, 'test_cases') and question_instance.test_cases:
            try:
                from .code_executor import execute_code_with_tests
                test_result = execute_code_with_tests(user_answer, question_instance.test_cases)
                result["correct"] = test_result['all_passed']
                
                if result["correct"]:
                    result["feedback"] = f"✓ Sempurna! {test_result['passed']}/{test_result['total']} test cases passed!"
                else:
                    result["feedback"] = f"✗ {test_result['passed']}/{test_result['total']} test cases passed. Coba lagi!"
                
                logger.info(f"Code validation with test cases: {result['correct']} ({test_result['passed']}/{test_result['total']})")
                return result
            
            except Exception as e:
                logger.error(f"Error executing test cases: {e}")
                # Fall through to answer_key comparison
        
        # PRIORITY 2: Fallback ke answer_key dengan normalisasi (non-case sensitive)
        try:
            normalized_user = normalize_python_code(user_answer)
            normalized_correct = normalize_python_code(str(correct_answer))
            
            result["correct"] = normalized_user == normalized_correct
            
            if result["correct"]:
                result["feedback"] = "✓ Kode Anda benar!"
            else:
                result["feedback"] = "✗ Kode Anda tidak sesuai dengan jawaban yang diharapkan. Silakan coba lagi."
            
            logger.info(f"Code validation with answer_key: {result['correct']}")
            return result
        
        except Exception as e:
            logger.error(f"Error normalizing code for comparison: {e}")
            # Fallback: exact string match (case-sensitive)
            result["correct"] = user_answer.strip() == correct_answer.strip()
            result["feedback"] = "✗ Kode tidak sesuai." if not result["correct"] else "✓ Kode Anda benar!"
            return result

    # ========== FILL QUESTIONS ==========
    if question_type == "fill":
        # Prefer AI-based validation (semantic)
        ai_res = ai_validate_answer(user_answer, correct_answer, question_text=explanation or "", question_type=question_type)
        if ai_res is not None:
            result["correct"] = bool(ai_res.get("correct", False))
            result["feedback"] = ai_res.get("feedback", "") or ("✓ Jawaban Anda benar!" if result["correct"] else "✗ Jawaban Anda salah. Silakan coba lagi.")
            result["explanation"] = ai_res.get("explanation", explanation or "")
            return result

        # If AI fails, fallback to conservative normalization checks
        logger.info("AI validation unavailable — falling back to string normalization check")
        normalized_user = user_answer.strip().lower().replace(" ", "").replace("\n", "")
        normalized_correct = str(correct_answer).strip().lower().replace(" ", "").replace("\n", "")
        result["correct"] = normalized_user == normalized_correct

        if result["correct"]:
            result["feedback"] = "✓ Jawaban Anda benar!"
        else:
            result["feedback"] = "✗ Jawaban Anda salah. Silakan coba lagi."

        return result

    # ========== DEFAULT FALLBACK ==========
    result["feedback"] = "✗ Tipe soal tidak dikenali."
    logger.warning(f"Unknown question type: {question_type}")
    return result


def _generate_question_with_retry(qtype: str, difficulty: int, topic: str, max_retries: int = 3) -> Tuple[str, Dict[str, Any]]:
    """Helper function to generate single question with retry logic"""
    tries = 0
    parsed = None
    last_error = None
    
    while tries < max_retries and parsed is None:
        tries += 1
        try:
            parsed = generate_question(difficulty, qtype, topic)
        except Exception as e:
            last_error = e
            logger.warning(f"Generate question attempt {tries}/{max_retries} failed for {qtype}: {e}")
            if tries < max_retries:
                time.sleep(0.5)  # Small delay before retry to avoid API rate limits
    
    return (qtype, parsed, last_error if parsed is None else None)


def generate_question_set(topic_name: str, difficulty: int, count: int = 10, mcq_count: int = 5, max_workers: int = 3) -> list:
    """
    Generate a set of questions with mixed types using parallelization.
    
    Args:
        topic_name: Topic name for the questions
        difficulty: Difficulty level (1-5)
        count: Total number of questions to generate (max 20)
        mcq_count: Number of MCQ questions (max = count)
        max_workers: Number of parallel workers (default 3, max 5)
    
    Returns:
        List of created questions
    """
    # Validation
    if count <= 0:
        raise ValueError("Count must be greater than 0")
    if count > 20:
        count = 20  # Limit max questions per request
        logger.warning(f"Count limited to 20")
    if mcq_count < 0 or mcq_count > count:
        raise ValueError(f"mcq_count must be between 0 and {count}")
    if max_workers < 1 or max_workers > 5:
        max_workers = min(max(max_workers, 1), 5)
    
    # Get or create Topic instance
    try:
        from .models import Topic
        topic_instance, _ = Topic.objects.get_or_create(name=topic_name)
    except Exception as e:
        logger.error(f"Error getting/creating topic '{topic_name}': {e}")
        # Fallback (though this might fail later if topic is required)
        topic_instance = None

    created = []
    types_pool = []

    # Collect existing hashes to avoid duplicates in the same topic
    existing_hashes = set(
        Question.objects.filter(topic=topic_instance)
        .exclude(question_hash__isnull=True)
        .exclude(question_hash="")
        .values_list("question_hash", flat=True)
    ) if topic_instance else set()

    # Track hashes created in this batch to avoid intra-batch duplicates
    new_hashes = set()

    # Add mcq_count mcq
    types_pool += ["mcq"] * mcq_count
    # remaining slots: fill with random 'fill' or 'coding'
    remaining = count - mcq_count
    for _ in range(remaining):
        types_pool.append(random.choice(["fill", "coding"]))

    # Shuffle to mix order
    random.shuffle(types_pool)

    logger.info(f"Generating {count} questions ({mcq_count} MCQ) for topic '{topic_name}' with difficulty {difficulty} using {max_workers} workers")
    
    # Generate questions in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all generation tasks
        # Pass topic_name to the prompt generator
        future_to_task = {
            executor.submit(_generate_question_with_retry, qtype, difficulty, topic_name): qtype 
            for qtype in types_pool
        }
        
        # Process completed tasks as they finish
        successful_count = 0
        failed_count = 0
        
        for future in as_completed(future_to_task):
            qtype, parsed, error = future.result()
            
            if parsed is None:
                failed_count += 1
                logger.warning(f"Failed to generate {qtype} question after retries: {error}")
                continue
            
            try:
                question_text = parsed.get("question_text", "")
                qhash = hash_question(question_text, qtype)

                # Skip duplicates (existing in DB or already generated in this batch)
                if qhash in existing_hashes or qhash in new_hashes:
                    logger.info("Skipping duplicate question for topic '%s'", topic_name)
                    continue

                # Save question to database
                q = Question.objects.create(
                    question_type=qtype,
                    difficulty=difficulty,
                    topic=topic_instance,  # Use the instance
                    question_text=question_text,
                    code_template=parsed.get("code_template"),
                    options=parsed.get("options"),
                    answer_key=parsed.get("answer_key"),
                    explanation=parsed.get("explanation", ""),
                    question_hash=qhash,
                )
                new_hashes.add(qhash)
                created.append({
                    "question_id": q.id,
                    "question_type": qtype,
                    "question_text": q.question_text,
                    "difficulty": q.difficulty,
                    "code_template": q.code_template,
                    "options": q.options,
                })
                successful_count += 1
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to save {qtype} question to database: {e}")
    
    logger.info(f"Question generation complete: {successful_count} successful, {failed_count} failed")
    return created

def normalize_python_code(code: str) -> str:
    """
    Normalize Python code untuk comparison yang fleksibel (non-case sensitive)
    - Hapus comments
    - Normalize whitespace/indentation
    - Lowercase untuk comparison
    - Hapus blank lines
    
    Args:
        code: Python code string
    
    Returns:
        Normalized code string
    """
    import re
    
    # Split by lines
    lines = code.split('\n')
    
    # Remove comments dan trailing whitespace
    lines = [re.sub(r'#.*$', '', line).rstrip() for line in lines]
    
    # Remove empty lines
    lines = [line for line in lines if line.strip()]
    
    # Normalize indentation (convert tabs to spaces)
    lines = [line.expandtabs(4) for line in lines]
    
    # Join kembali
    normalized = '\n'.join(lines).strip()
    
    # Lowercase untuk perbandingan
    normalized = normalized.lower()
    
    return normalized

def clean_mcq_options(options: List[str]) -> List[str]:
    """
    Clean MCQ options by removing duplicate letter prefixes
    Example: "A. A. 8" -> "A. 8"
    
    Args:
        options: List of option strings like ["A. A. 8", "B. B. 7", ...]
    
    Returns:
        Cleaned list of options
    """
    cleaned = []
    
    for opt in options:
        opt = opt.strip()
        
        # Remove duplicate prefixes like "A. A." -> "A."
        # Pattern: "X. X. " where X is a letter
        import re
        
        # Match pattern like "A. A. " or "A. A:" 
        match = re.match(r'^([A-D])[.\s]+\1[.\s:]+(.*)$', opt, re.IGNORECASE)
        if match:
            letter = match.group(1)
            content = match.group(2).strip()
            cleaned.append(f"{letter}. {content}")
        else:
            # No duplicate prefix, keep as is but ensure proper format
            # Make sure it starts with A., B., C., or D.
            if not re.match(r'^[A-D][.\s]', opt, re.IGNORECASE):
                # Doesn't have letter prefix, add it based on position if possible
                cleaned.append(opt)
            else:
                cleaned.append(opt)
    
    return cleaned

def validate_mcq_options(options: List[str]) -> Tuple[bool, str]:
    """
    Validate MCQ options untuk memastikan:
    1. Tidak ada opsi yang duplikat
    2. Tidak ada opsi yang terlalu mirip (substring/prefix)
    3. Opsi harus jelas berbeda
    4. Tidak ada prefix duplikat seperti "A. A. 8"
    
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    import re
    
    if not options or len(options) != 4:
        return False, "MCQ harus memiliki exactly 4 opsi"
    
    # Normalize untuk comparison
    def normalize_option(opt: str) -> str:
        # Remove letter prefix (A., B., C., D.)
        opt = opt.strip()
        # Remove prefix seperti "A. " atau "A: "
        opt = re.sub(r'^[A-D][.\s:]+', '', opt, flags=re.IGNORECASE).strip()
        # Remove whitespace, lowercase
        return opt.lower().replace(" ", "").replace("\n", "")
    
    # Extract content (without letter prefix)
    contents = [normalize_option(opt) for opt in options]
    
    # Check 1: Exact duplicates
    if len(set(contents)) != 4:
        return False, "Opsi tidak boleh duplikat atau sama persis"
    
    # Check 2: Similarity check (no substring matches)
    for i in range(len(contents)):
        for j in range(i + 1, len(contents)):
            content_i = contents[i]
            content_j = contents[j]
            
            # Check if one is substring of other
            if content_i in content_j or content_j in content_i:
                return False, f"Opsi '{options[i]}' dan '{options[j]}' terlalu mirip/overlap"
            
            # Check for very similar numeric patterns
            try:
                val_i = float(content_i)
                val_j = float(content_j)
                if val_i == val_j:
                    return False, f"Opsi '{options[i]}' dan '{options[j]}' adalah nilai yang sama"
            except ValueError:
                pass
    
    # Check 3: Answer key validation (akan di-check di generate_question)
    
    return True, ""