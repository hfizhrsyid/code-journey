import json
from groq import Groq
from django.conf import settings
from typing import Dict, Any
import logging
import random
from .models import Question

logger = logging.getLogger(__name__)
client = Groq(api_key=settings.GROQ_API_KEY)

PROMPT_TEMPLATES = {
    "mcq": """Buat 1 soal pilihan ganda pemrograman Python dalam bahasa Indonesia dengan materi perulangan. Untuk kode programnya tetap gunakan bahasa inggris atau bahasa pemrograman Python tanpa di translate ke bahasa indonesia.
Difficulty level: {difficulty} (1-5, 1 = mudah, 5 = sulit).

PENTING: Kembalikan HANYA objek JSON valid tanpa teks lain.

{{
  "question_text": "...",
  "code_template": "...",
  "options": ["...", "...", "...", "..."],
  "answer_key": "randomly one of A, B, C, D",
  "explanation": "Penjelasan singkat mengapa jawaban A benar"
}}
""",

    "fill": """Buat 1 soal isi-kosong pemrograman Python dalam bahasa Indonesia Python dalam bahasa Indonesia dengan materi perulangan. Untuk kode programnya tetap gunakan bahasa inggris atau bahasa pemrograman Python tanpa di translate ke bahasa indonesia.
Difficulty level: {difficulty} (1-5).

PENTING: Kembalikan HANYA objek JSON valid tanpa teks lain.

{{
  "question_text": "...",
  "code_template": "...",
  "answer_key": "...",
  "explanation": "...",
  "options": null
}}
""",

    "coding": """Buat 1 soal coding Python dalam bahasa Indonesia dengan materi perulangan. Untuk kode programnya tetap gunakan bahasa inggris atau bahasa pemrograman Python tanpa di translate ke bahasa indonesia..
Difficulty level: {difficulty} (1-5).

PENTING: Kembalikan HANYA objek JSON valid tanpa teks lain.

{{
  "question_text": "...",
  "code_template": "...",
  "answer_key": "...",
  "explanation": "...",
  "options": null
}}
"""
}


def generate_question(difficulty: int, question_type: str) -> Dict[str, Any]:
    """Generate a programming question using Groq API"""
    
    if question_type not in PROMPT_TEMPLATES:
        raise ValueError(f"Invalid question type: {question_type}")
    
    if not 1 <= difficulty <= 5:
        raise ValueError("Difficulty must be between 1 and 5")
    
    prompt = PROMPT_TEMPLATES[question_type].format(difficulty=difficulty)
    
    try:
        logger.info(f"Generating {question_type} question with difficulty {difficulty}")
        
        message = client.chat.completions.create(
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
    """
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
        message = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            max_tokens=max_tokens,
        )
        content = message.choices[0].message.content.strip()

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
            logger.warning("AI validation returned JSON missing keys")
            return None

        # normalize types
        parsed["correct"] = bool(parsed.get("correct"))
        parsed["feedback"] = str(parsed.get("feedback") or "")
        parsed["explanation"] = str(parsed.get("explanation") or "")

        return parsed

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

    # For fill / coding, prefer AI-based validation (semantic)
    if question_type in ("fill", "coding"):
        ai_res = ai_validate_answer(user_answer, correct_answer, question_text=explanation or "", question_type=question_type)
        if ai_res is not None:
            result["correct"] = bool(ai_res.get("correct", False))
            # Keep feedback concise and not revealing correct answer
            result["feedback"] = ai_res.get("feedback", "") or ("✓ Jawaban Anda benar!" if result["correct"] else "✗ Jawaban Anda salah. Silakan coba lagi.")
            result["explanation"] = ai_res.get("explanation", explanation or "")
            return result

        # If AI fails, fallback to conservative normalization checks (previous behavior)
        logger.info("AI validation unavailable — falling back to string normalization check")

        if question_type == "fill":
            normalized_user = user_answer.strip().lower().replace(" ", "").replace("\n", "")
            normalized_correct = str(correct_answer).strip().lower().replace(" ", "").replace("\n", "")
            result["correct"] = normalized_user == normalized_correct
        else:  # coding fallback
            normalized_user = user_answer.strip().lower()
            normalized_correct = str(correct_answer).strip().lower()
            result["correct"] = normalized_user == normalized_correct

        if result["correct"]:
            result["feedback"] = "✓ Jawaban Anda benar!"
        else:
            result["feedback"] = "✗ Jawaban Anda salah. Silakan coba lagi."

        return result

    # Default fallback behaviour (should not normally hit)
    result["feedback"] = "✗ Tipe soal tidak dikenali."
    return result


def generate_question_set(topic: str, difficulty: int, count: int = 10, mcq_count: int = 5) -> list:
    """Generate a set of questions with mixed types"""
    created = []
    types_pool = []

    # Add mcq_count mcq
    types_pool += ["mcq"] * mcq_count
    # remaining slots: fill with random 'fill' or 'coding'
    remaining = count - mcq_count
    for _ in range(remaining):
        types_pool.append(random.choice(["fill", "coding"]))

    # Shuffle to mix order
    random.shuffle(types_pool)

    # Generate each question, retry a couple times if AI fails
    for qtype in types_pool:
        tries = 0
        parsed = None
        while tries < 3 and parsed is None:
            tries += 1
            try:
                parsed = generate_question(difficulty, qtype)
            except Exception as e:
                parsed = None
                logger.warning(f"Generate question attempt {tries} failed for {qtype}: {e}")
        
        if parsed is None:
            continue

        # Save question
        q = Question.objects.create(
            question_type=qtype,
            difficulty=difficulty,
            topic=topic,
            question_text=parsed.get("question_text", ""),
            code_template=parsed.get("code_template"),
            options=parsed.get("options"),
            answer_key=parsed.get("answer_key"),
            explanation=parsed.get("explanation", "")
        )
        created.append({
            "question_id": q.id,
            "question_type": qtype,
            "question_text": q.question_text,
            "difficulty": q.difficulty,
            "code_template": q.code_template,
            "options": q.options,
        })

    return created