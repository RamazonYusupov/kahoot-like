from fastapi import APIRouter, HTTPException
from typing import List
from app.models import AdminRoomSummary, AdminLogin
from app.redis_client import redis_client
from app.config import settings
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=dict)
async def login(data: AdminLogin) -> dict:
    """Admin login endpoint."""
    if data.username != settings.ADMIN_USERNAME or data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate a simple token (in production, use JWT)
    token = str(uuid.uuid4())
    
    # Store token in Redis with expiration (24 hours)
    redis_client.redis.setex(
        f"admin_token:{token}",
        86400,  # 24 hours
        data.username
    )
    
    return {
        "token": token,
        "username": data.username,
        "message": "Login successful"
    }


@router.post("/logout", response_model=dict)
async def logout(token: str) -> dict:
    """Admin logout endpoint."""
    redis_client.redis.delete(f"admin_token:{token}")
    return {"message": "Logout successful"}


def verify_admin_token(token: str) -> bool:
    """Verify if token is valid."""
    if not token:
        return False
    result = redis_client.redis.get(f"admin_token:{token}")
    return result is not None


@router.get("/rooms", response_model=List[AdminRoomSummary])
async def list_rooms(token: str = None) -> List[AdminRoomSummary]:
    """List all tracked rooms for admin management."""
    if not verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    room_codes = redis_client.list_room_codes()
    rooms: List[AdminRoomSummary] = []

    for code in room_codes:
        room = redis_client.get_room(code)
        if not room:
            continue

        players = redis_client.get_players(code)
        player_names = []
        for raw_player in players:
            if ":" in raw_player:
                _, player_name = raw_player.split(":", 1)
                player_names.append(player_name)

        player_names.sort()
        player_count = len(player_names)
        question_count = len(redis_client.get_questions(code))

        rooms.append(
            AdminRoomSummary(
                code=code,
                status=room.get("status", "unknown"),
                host_id=room.get("host_id", ""),
                topic=room.get("topic", ""),
                created_at=room.get("created_at", ""),
                player_count=player_count,
                question_count=question_count,
                player_names=player_names,
            )
        )

    rooms.sort(key=lambda r: r.created_at, reverse=True)
    return rooms


@router.delete("/rooms/{code}", response_model=dict)
async def delete_room(code: str, token: str = None) -> dict:
    """Delete a room and all related data."""
    if not verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    room = redis_client.get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    redis_client.delete_room(code)
    return {"message": "Room deleted successfully"}
