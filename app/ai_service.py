import json
import re
import httpx
import hashlib
from typing import List, Dict, Any
from app.config import settings
from app.redis_client import redis_client


class AIService:
    """Service for AI-powered question generation."""
    
    @staticmethod
    async def generate_questions(
        topic: str,
        custom_prompt: str | None = None,
        question_count: int = 10,
    ) -> List[Dict[str, Any]]:
        """Generate questions from AI based on topic."""
        question_count = max(1, min(int(question_count), 30))

        cache_key_topic = AIService._cache_topic_key(topic, question_count, custom_prompt)
        
        # Check if cached
        cached = redis_client.get_cached_topic_questions(cache_key_topic)
        if cached:
            return cached
        
        # Generate new questions
        questions = await AIService._call_ai_api(topic, custom_prompt, question_count)
        
        # Cache for 24 hours
        redis_client.cache_topic_questions(cache_key_topic, questions)
        
        return questions

    @staticmethod
    def _cache_topic_key(topic: str, question_count: int, custom_prompt: str | None) -> str:
        """Build a stable cache key for AI generation variations."""
        prompt_hash = hashlib.sha256((custom_prompt or "").encode("utf-8")).hexdigest()[:12]
        return f"{topic}|count={question_count}|prompt={prompt_hash}"
    
    @staticmethod
    async def _call_ai_api(topic: str, custom_prompt: str | None, question_count: int) -> List[Dict[str, Any]]:
        """Call AI API (OpenAI or Claude) to generate questions."""
        
        prompt = AIService._build_prompt(topic, custom_prompt, question_count)
        
        if settings.AI_API_TYPE.lower() == "openai":
            return await AIService._call_openai(prompt)
        elif settings.AI_API_TYPE.lower() == "claude":
            return await AIService._call_claude(prompt)
        elif settings.AI_API_TYPE.lower() == "gemini":
            return await AIService._call_gemini(prompt, question_count)
        else:
            raise ValueError(f"Unsupported AI API type: {settings.AI_API_TYPE}")
    
    @staticmethod
    def _build_prompt(topic: str, custom_prompt: str | None, question_count: int) -> str:
        """Build the AI prompt for question generation."""
        base_prompt = f"""Generate exactly {question_count} quiz questions about "{topic}".
Include a balanced mix of:
- open-ended questions (type: "open")
- true/false questions (type: "true_false")
- multiple choice questions (type: "mcq")

For open questions: return the exact correct answer text.
For true/false: return true or false.
For MCQ: return the index (0-3) of the correct option.

Return ONLY valid JSON array with no markdown formatting or extra text. Each question must follow this exact structure:

For open questions:
{{"type": "open", "question": "question text?", "correct_answer": "answer text"}}

For true/false:
{{"type": "true_false", "question": "statement.", "correct_answer": true/false}}

For MCQ:
{{"type": "mcq", "question": "question?", "options": ["option0", "option1", "option2", "option3"], "correct_answer": 0}}

Return ONLY the JSON array, no other text."""

        if custom_prompt:
            return f"{base_prompt}\n\nAdditional host instructions:\n{custom_prompt}"
        return base_prompt
    
    @staticmethod
    async def _call_openai(prompt: str) -> List[Dict[str, Any]]:
        """Call OpenAI API."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": settings.AI_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            return AIService._parse_questions(content)
    
    @staticmethod
    async def _call_claude(prompt: str) -> List[Dict[str, Any]]:
        """Call Claude API."""
        async with httpx.AsyncClient() as client:
            headers = {
                "x-api-key": settings.AI_API_KEY,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": settings.AI_MODEL or "claude-3-sonnet-20240229",
                "max_tokens": 2000,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            response.raise_for_status()
            data = response.json()
            
            content = data["content"][0]["text"]
            return AIService._parse_questions(content)

    @staticmethod
    async def _call_gemini(prompt: str, question_count: int) -> List[Dict[str, Any]]:
        """Call Gemini API."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
            }

            question_schema = {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["open", "true_false", "mcq"],
                        },
                        "question": {"type": "string"},
                        "correct_answer": {},
                        "options": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 4,
                            "maxItems": 4,
                        },
                    },
                    "required": ["type", "question", "correct_answer"],
                    "additionalProperties": False,
                },
                "minItems": question_count,
                "maxItems": question_count,
            }

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2000,
                    "responseMimeType": "application/json",
                    "responseJsonSchema": question_schema,
                },
            }

            model_candidates = [settings.AI_MODEL or "gemini-2.5-flash"]
            if model_candidates[0] != "gemini-2.5-flash":
                model_candidates.append("gemini-2.5-flash")

            last_response = None
            for model in model_candidates:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.AI_API_KEY}",
                    json=payload,
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code != 404:
                    response.raise_for_status()
                    data = response.json()

                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    return AIService._parse_questions(content)

                last_response = response

            if last_response is not None:
                last_response.raise_for_status()
            raise RuntimeError("Gemini model not found")
    
    @staticmethod
    def _parse_questions(response_text: str) -> List[Dict[str, Any]]:
        """Parse AI response and extract questions."""
        # Remove markdown code fences
        clean = re.sub(r"```json|```", "", response_text).strip()
        
        # Parse JSON
        parsed = json.loads(clean)
        questions = parsed["questions"] if isinstance(parsed, dict) and "questions" in parsed else parsed
        
        # Validate structure
        for q in questions:
            assert q.get("type") in ["open", "true_false", "mcq"], f"Invalid question type: {q.get('type')}"
            assert q.get("question"), "Question text is required"
            assert q.get("correct_answer") is not None, "correct_answer is required"
            
            if q["type"] == "mcq":
                assert q.get("options") and len(q["options"]) == 4, "MCQ must have 4 options"
        
        return questions
