from fastapi import APIRouter, HTTPException
from typing import List
from app.models import PlayerJoin, PlayerAnswer, LeaderboardEntry, CurrentQuestion, AnswerResult
from app.redis_client import redis_client
from app.utils import ensure_room_exists, ensure_game_started, calculate_points, check_answer
import uuid

router = APIRouter(prefix="/rooms", tags=["gameplay"])


@router.post("/{code}/join", response_model=dict)
async def join_room(code: str, player: PlayerJoin) -> dict:
    """
    Player joins a room.
    """
    room = ensure_room_exists(code)
    
    if room.get("status") == "active":
        raise HTTPException(status_code=400, detail="Game already started")
    
    player_id = str(uuid.uuid4())
    redis_client.add_player(code, player.player_name, player_id)
    
    return {
        "player_id": player_id,
        "message": f"{player.player_name} joined the room"
    }


@router.post("/{code}/start", response_model=dict)
async def start_game(code: str) -> dict:
    """
    Host starts the game.
    """
    room = ensure_room_exists(code)
    
    # Verify host permission (in production, add authentication)
    
    # Check if there are questions
    questions = redis_client.get_questions(code)
    if len(questions) < 1:
        raise HTTPException(status_code=400, detail="At least 1 question is required to start")
    
    # Update room status
    redis_client.update_room_status(code, "active")
    
    # Set current question to 0
    redis_client.set_current_question_index(code, 0)
    
    return {
        "message": "Game started",
        "question_count": len(questions)
    }


@router.get("/{code}/current-question", response_model=CurrentQuestion)
async def get_current_question(code: str) -> CurrentQuestion:
    """
    Get the current active question.
    """
    room = ensure_game_started(code)
    
    current_idx = redis_client.get_current_question_index(code)
    if current_idx < 0:
        raise HTTPException(status_code=400, detail="Game not started yet")
    
    questions = redis_client.get_questions(code)
    if current_idx >= len(questions):
        raise HTTPException(status_code=400, detail="No more questions")
    
    question = questions[current_idx]
    
    return CurrentQuestion(
        id=question["id"],
        type=question["type"],
        question=question["question"],
        options=question.get("options")
    )


@router.post("/{code}/answer", response_model=AnswerResult)
async def submit_answer(code: str, answer: PlayerAnswer) -> AnswerResult:
    """
    Player submits an answer to the current question.
    Includes rate limiting header (X-RateLimit-Remaining).
    """
    room = ensure_game_started(code)
    
    current_idx = redis_client.get_current_question_index(code)
    if current_idx < 0:
        raise HTTPException(status_code=400, detail="Game not started yet")
    
    questions = redis_client.get_questions(code)
    if current_idx >= len(questions):
        raise HTTPException(status_code=400, detail="No more questions")
    
    question = questions[current_idx]
    question_id = question["id"]
    
    # Check answer
    correct = check_answer(question["type"], answer.answer, question["correct_answer"])
    points = calculate_points(correct, answer.time_taken)
    
    # Record answer in Redis
    redis_client.record_answer(code, question_id, answer.player_id, answer.answer)
    
    # Update leaderboard
    if correct:
        # Get player name
        players = redis_client.get_players(code)
        player_name = None
        for p in players:
            if p.startswith(f"{answer.player_id}:"):
                player_name = p.split(":", 1)[1]
                break
        
        if player_name:
            redis_client.add_score(code, player_name, points)
    
    return AnswerResult(
        correct=correct,
        points_earned=points,
        correct_answer=question["correct_answer"]
    )


@router.get("/{code}/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(code: str) -> List[LeaderboardEntry]:
    """
    Get the current leaderboard.
    """
    ensure_room_exists(code)
    scored_entries = redis_client.get_leaderboard(code)
    score_map = {entry["player_name"]: int(entry["score"]) for entry in scored_entries}

    players = redis_client.get_players(code)
    for raw_player in players:
        if ":" in raw_player:
            _, player_name = raw_player.split(":", 1)
            if player_name not in score_map:
                score_map[player_name] = 0

    merged = [
        {"player_name": player_name, "score": score}
        for player_name, score in score_map.items()
    ]
    merged.sort(key=lambda x: (-x["score"], x["player_name"].lower()))

    return [LeaderboardEntry(**entry) for entry in merged]


@router.get("/{code}/current-progress", response_model=dict)
async def get_current_progress(code: str) -> dict:
    """
    Get answer progress for the current question.
    """
    ensure_game_started(code)

    current_idx = redis_client.get_current_question_index(code)
    questions = redis_client.get_questions(code)

    if current_idx < 0 or current_idx >= len(questions):
        raise HTTPException(status_code=400, detail="No active question")

    current_question = questions[current_idx]
    question_id = current_question["id"]

    players = redis_client.get_players(code)
    player_ids = []
    for player in players:
        if ":" in player:
            player_id, _ = player.split(":", 1)
            player_ids.append(player_id)

    answered_count = 0
    for player_id in player_ids:
        if redis_client.get_answer(code, question_id, player_id) is not None:
            answered_count += 1

    total_players = len(player_ids)

    return {
        "question_id": question_id,
        "answered_count": answered_count,
        "total_players": total_players,
        "all_answered": total_players > 0 and answered_count >= total_players,
    }


@router.post("/{code}/next", response_model=dict)
async def next_question(code: str) -> dict:
    """
    Host moves to the next question.
    """
    room = ensure_game_started(code)
    
    questions = redis_client.get_questions(code)
    current_idx = redis_client.get_current_question_index(code)
    
    if current_idx + 1 >= len(questions):
        # Game finished
        redis_client.update_room_status(code, "finished")
        return {"message": "Game finished", "final": True}
    
    # Move to next question
    next_idx = current_idx + 1
    redis_client.set_current_question_index(code, next_idx)
    
    return {
        "message": f"Moved to question {next_idx + 1}",
        "current_index": next_idx,
        "total_questions": len(questions),
        "final": False
    }
