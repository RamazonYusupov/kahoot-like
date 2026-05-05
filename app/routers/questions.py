from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import QuestionCreate, AIGenerateRequest
from app.redis_client import redis_client
from app.utils import ensure_game_not_started, ensure_room_exists
from app.ai_service import AIService

router = APIRouter(prefix="/rooms", tags=["questions"])


@router.get("/{code}/questions")
async def get_questions(code: str) -> List[dict]:
    """
    Get all questions for a room.
    """
    ensure_room_exists(code)
    questions = redis_client.get_questions(code)
    return questions


@router.post("/{code}/questions/generate-ai", response_model=dict)
async def generate_ai_questions(code: str, request: Optional[AIGenerateRequest] = None) -> dict:
    """
    Generate AI questions for a room topic.
    Only allowed before game starts.
    Existing questions are replaced.
    """
    room = ensure_game_not_started(code)

    question_count = request.question_count if request else 10
    custom_prompt = (request.prompt or "").strip() if request else ""

    try:
        ai_questions = await AIService.generate_questions(
            room["topic"],
            custom_prompt=custom_prompt or None,
            question_count=question_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    redis_client.clear_questions(code)
    redis_client.add_questions(code, ai_questions)

    return {
        "message": "AI questions generated successfully",
        "count": len(ai_questions),
        "topic": room["topic"],
        "question_count": question_count,
    }


@router.post("/{code}/questions", response_model=dict)
async def add_question(code: str, question: QuestionCreate) -> dict:
    """
    Add a new question to the room (manual addition).
    Only allowed before game starts.
    """
    ensure_game_not_started(code)
    
    # Validate question structure
    if question.type == "mcq":
        if not question.options or len(question.options) != 4:
            raise HTTPException(status_code=400, detail="MCQ must have exactly 4 options")
    
    question_data = {
        "type": question.type,
        "question": question.question,
        "correct_answer": question.correct_answer,
        "options": question.options or []
    }
    
    question_id = redis_client.add_question(code, question_data)
    
    return {
        "id": question_id,
        "message": "Question added successfully",
        **question_data
    }


@router.put("/{code}/questions/{question_id}")
async def update_question(code: str, question_id: str, question: QuestionCreate) -> dict:
    """
    Edit an existing question.
    Only allowed before game starts.
    """
    ensure_game_not_started(code)
    
    # Check if question exists
    existing = redis_client.get_question(code, question_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Validate question structure
    if question.type == "mcq":
        if not question.options or len(question.options) != 4:
            raise HTTPException(status_code=400, detail="MCQ must have exactly 4 options")
    
    question_data = {
        "type": question.type,
        "question": question.question,
        "correct_answer": question.correct_answer,
        "options": question.options or []
    }
    
    redis_client.update_question(code, question_id, question_data)
    
    return {
        "id": question_id,
        "message": "Question updated successfully",
        **question_data
    }


@router.delete("/{code}/questions/{question_id}")
async def delete_question(code: str, question_id: str) -> dict:
    """
    Delete a question.
    Only allowed before game starts.
    """
    ensure_game_not_started(code)
    
    # Check if question exists
    existing = redis_client.get_question(code, question_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question not found")
    
    redis_client.delete_question(code, question_id)
    
    return {"message": "Question deleted successfully"}
