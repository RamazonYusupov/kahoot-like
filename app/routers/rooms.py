from fastapi import APIRouter
from app.models import RoomCreate, RoomResponse
from app.redis_client import redis_client
from app.utils import get_unique_room_code, ensure_room_exists

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomResponse)
async def create_room(room: RoomCreate) -> RoomResponse:
    """
    Create a new room.
    """
    code = get_unique_room_code()
    
    # Create room in Redis
    redis_client.create_room(code, room.host_id, room.topic)
    
    room_data = redis_client.get_room(code)
    return RoomResponse(
        code=code,
        status=room_data["status"],
        host_id=room_data["host_id"],
        topic=room_data["topic"],
        created_at=room_data["created_at"],
        player_count=0
    )


@router.get("/{code}", response_model=RoomResponse)
async def get_room(code: str) -> RoomResponse:
    """
    Get room information and current status.
    """
    room = ensure_room_exists(code)
    
    # Get player count
    players = redis_client.get_players(code)
    player_count = len(players)
    
    return RoomResponse(
        code=code,
        status=room["status"],
        host_id=room["host_id"],
        topic=room["topic"],
        created_at=room["created_at"],
        player_count=player_count
    )
