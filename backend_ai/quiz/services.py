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

SYARAT SOAL:
✓ Soal HARUS relevan dengan topik "{topic}"
✓ Gunakan kode Python (jangan ditranslate)
✓ 4 pilihan jawaban (A, B, C, D)
✓ Hanya 1 jawaban yang benar

CONTOH FORMAT:
- Variabel: soal tentang deklarasi, tipe data, casting
- Operator: soal tentang +, -, *, /, //, %, ==, !=, and, or
- Percabangan: soal tentang if, elif, else, nested if
- Perulangan: soal tentang for, while, range, break, continue
- Pengurutan: soal tentang sorting, bubble sort, selection sort
- Pencarian: soal tentang searching, linear search, binary search

RETURN HANYA JSON (tanpa kode lain):
{{
  "question_text": "Pertanyaan tentang {topic}...",
  "code_template": "Python code example atau None",
  "options": ["A. pilihan 1", "B. pilihan 2", "C. pilihan 3", "D. pilihan 4"],
  "answer_key": "B",
  "explanation": "Penjelasan mengapa B benar berdasarkan topik {topic}"
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

CONTOH:
- Variabel: program yang bekerja dengan variabel tipe data
- Operator: program yang menggunakan operator aritmatika/logika
- Percabangan: program dengan if-else berdasarkan kondisi
- Perulangan: program dengan loop for/while
- Dll

RETURN HANYA JSON:
{{
  "question_text": "Buatlah fungsi yang [deskripsi task]...",
  "code_template": "def solution():\\n    # Write your code here\\n    pass",
  "answer_key": "def solution():\\n    return 42",
  "explanation": "Penjelasan solusi dan konsep {topic}"
}}"""
}


def generate_question(difficulty: int, question_type: str, topic: str = "Pemrograman Python") -> Dict[str, Any]:
    """Generate a programming question using Groq API
    
    Args:
        difficulty: Question difficulty (1-5)
        question_type: Type of question (mcq, fill, coding)
        topic: Topic/subject for the question
    """
    
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
        
        if question_type == "mcq":
            if not parsed.get("options") or len(parsed["options"]) != 4:
                raise ValueError("MCQ must have exactly 4 options")
        
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


def check_answer(user_answer: str, correct_answer: Any, question_type: str, explanation: str = "") -> Dict[str, Any]:
    """Check if user answer is correct"""
    
    result = {
        "correct": False,
        "feedback": "",
        "correct_answer": str(correct_answer),
        "explanation": explanation
    }
    
    # Multiple-choice: same behavior as before (exact letter match, case-insensitive)
    if question_type == "mcq":
        result["correct"] = user_answer.strip().upper() == str(correct_answer).strip().upper()
        if result["correct"]:
            result["feedback"] = "✓ Jawaban Anda benar!"
        else:
            result["feedback"] = "✗ Jawaban Anda salah. Silakan coba lagi."
        return result

    # For coding questions, skip AI validation (use test cases instead via /api/questions/run/)
    if question_type == "coding":
        # Simple fallback check - just accept any non-empty answer
        # The real validation happens through test cases in the run_code endpoint
        result["correct"] = bool(user_answer.strip())
        result["feedback"] = "✓ Kode Anda telah dikirim!" if result["correct"] else "✗ Kode tidak boleh kosong."
        return result

    # For fill questions, prefer AI-based validation (semantic)
    if question_type == "fill":
        ai_res = ai_validate_answer(user_answer, correct_answer, question_text=explanation or "", question_type=question_type)
        if ai_res is not None:
            result["correct"] = bool(ai_res.get("correct", False))
            # Keep feedback concise and not revealing correct answer
            result["feedback"] = ai_res.get("feedback", "") or ("✓ Jawaban Anda benar!" if result["correct"] else "✗ Jawaban Anda salah. Silakan coba lagi.")
            result["explanation"] = ai_res.get("explanation", explanation or "")
            return result

        # If AI fails, fallback to conservative normalization checks (previous behavior)
        logger.info("AI validation unavailable — falling back to string normalization check")
        normalized_user = user_answer.strip().lower().replace(" ", "").replace("\n", "")
        normalized_correct = str(correct_answer).strip().lower().replace(" ", "").replace("\n", "")
        result["correct"] = normalized_user == normalized_correct

        if result["correct"]:
            result["feedback"] = "✓ Jawaban Anda benar!"
        else:
            result["feedback"] = "✗ Jawaban Anda salah. Silakan coba lagi."

        return result

    # Default fallback behaviour (should not normally hit)
    result["feedback"] = "✗ Tipe soal tidak dikenali."
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