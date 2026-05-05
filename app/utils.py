import random
import string
from app.redis_client import redis_client
from fastapi import HTTPException


def generate_room_code() -> str:
    """Generate a random 6-character room code."""
    return "".join(random.choices(string.ascii_uppercase, k=6))


def get_unique_room_code() -> str:
    """Generate a unique room code that doesn't exist."""
    while True:
        code = generate_room_code()
        if not redis_client.get_room(code):
            return code


def calculate_points(correct: bool, time_taken: int) -> int:
    """Calculate points based on correctness and time."""
    if not correct:
        return 0
    
    if time_taken <= 5:
        return 100
    elif time_taken <= 15:
        return 75
    else:
        return 50


def check_answer(question_type: str, submitted_answer, correct_answer) -> bool:
    """Check if submitted answer is correct."""
    if question_type == "open":
        # Case-insensitive string comparison with whitespace stripping
        return str(submitted_answer).strip().lower() == str(correct_answer).strip().lower()
    
    elif question_type == "true_false":
        # Exact boolean match
        if isinstance(submitted_answer, str):
            submitted_answer = submitted_answer.lower() in ["true", "1", "yes"]
        return bool(submitted_answer) == bool(correct_answer)
    
    elif question_type == "mcq":
        # Check if submitted index matches correct_answer
        return int(submitted_answer) == int(correct_answer)
    
    return False


def ensure_game_not_started(code: str) -> dict:
    """Ensure game hasn't started yet and return room data."""
    room = redis_client.get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.get("status") == "active":
        raise HTTPException(status_code=403, detail="Game already started")

    return room


def ensure_room_exists(code: str) -> dict:
    """Ensure room exists and return room data."""
    room = redis_client.get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


def ensure_game_started(code: str) -> dict:
    """Ensure game has started."""
    room = ensure_room_exists(code)
    if room.get("status") != "active":
        raise HTTPException(status_code=400, detail="Game not started yet")
    return room
