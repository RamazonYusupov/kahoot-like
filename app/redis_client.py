import redis
import json
from typing import Any, Optional, List, Set
from app.config import settings


class RedisClient:
    """Redis client wrapper for managing game state."""
    
    def __init__(self):
        """Initialize Redis connection."""
        self.redis = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )
    
    def health_check(self) -> bool:
        """Check if Redis is connected."""
        try:
            self.redis.ping()
            return True
        except Exception as e:
            print(f"Redis connection error: {e}")
            return False

    def disable_write_block_on_snapshot_error(self) -> None:
        """Allow writes even if Redis snapshot persistence fails.

        This keeps local development usable when Redis has RDB persistence
        enabled but cannot write snapshots to disk.
        """
        try:
            self.redis.config_set("stop-writes-on-bgsave-error", "no")
        except Exception as e:
            print(f"Could not update Redis config: {e}")

    def _normalize_code(self, code: str) -> str:
        """Normalize room code to keep Redis keys consistent."""
        return str(code).strip().upper()
    
    # Room Management
    def create_room(self, code: str, host_id: str, topic: str) -> None:
        """Create a new room."""
        code = self._normalize_code(code)
        room_key = f"room:{code}"
        import datetime
        self.redis.hset(room_key, mapping={
            "status": "waiting",
            "host_id": host_id,
            "topic": topic,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "current_question_index": "-1"
        })
        self.redis.sadd("rooms:index", code)
        self.redis.expire(room_key, 3600)  # 1 hour TTL

    def list_room_codes(self) -> List[str]:
        """Get all tracked room codes."""
        codes = set(self.redis.smembers("rooms:index"))

        # Backfill index for rooms created before rooms:index tracking was added.
        for key in self.redis.scan_iter(match="room:*"):
            code = key.split(":", 1)[1]
            codes.add(code)

        return sorted(codes)

    def delete_room(self, code: str) -> None:
        """Delete room and all associated data."""
        code = self._normalize_code(code)

        questions_key = f"questions:{code}"
        question_ids = self.redis.lrange(questions_key, 0, -1)
        question_keys = [f"question:{code}:{qid}" for qid in question_ids]

        answer_keys = list(self.redis.scan_iter(match=f"answer:{code}:*"))

        delete_keys = [
            f"room:{code}",
            questions_key,
            f"players:{code}",
            f"leaderboard:{code}",
            f"current_q:{code}",
            *question_keys,
            *answer_keys,
        ]

        if delete_keys:
            self.redis.delete(*delete_keys)

        self.redis.srem("rooms:index", code)
    
    def get_room(self, code: str) -> Optional[dict]:
        """Get room information."""
        code = self._normalize_code(code)
        room_key = f"room:{code}"
        room_data = self.redis.hgetall(room_key)
        if not room_data:
            return None
        return room_data
    
    def update_room_status(self, code: str, status: str) -> None:
        """Update room status."""
        code = self._normalize_code(code)
        room_key = f"room:{code}"
        self.redis.hset(room_key, "status", status)
    
    # Questions
    def add_questions(self, code: str, questions: List[dict]) -> None:
        """Add multiple questions to a room."""
        code = self._normalize_code(code)
        questions_key = f"questions:{code}"
        for i, question in enumerate(questions):
            question_id = f"{i}"
            question_data_key = f"question:{code}:{question_id}"
            self.redis.hset(question_data_key, mapping={
                "type": question.get("type"),
                "question": question.get("question"),
                "correct_answer": json.dumps(question.get("correct_answer")),
                "options": json.dumps(question.get("options", []))
            })
            self.redis.lpush(questions_key, question_id)
    
    def get_questions(self, code: str) -> List[dict]:
        """Get all questions for a room."""
        code = self._normalize_code(code)
        questions_key = f"questions:{code}"
        question_ids = self.redis.lrange(questions_key, 0, -1)
        questions = []
        
        for qid in reversed(question_ids):  # Reverse to get insertion order
            question_key = f"question:{code}:{qid}"
            q_data = self.redis.hgetall(question_key)
            if q_data:
                q_data["id"] = qid
                q_data["correct_answer"] = json.loads(q_data["correct_answer"])
                q_data["options"] = json.loads(q_data["options"])
                questions.append(q_data)
        
        return questions
    
    def add_question(self, code: str, question: dict) -> str:
        """Add a single question and return its ID."""
        code = self._normalize_code(code)
        questions_key = f"questions:{code}"
        current_count = self.redis.llen(questions_key)
        question_id = str(current_count)
        
        question_data_key = f"question:{code}:{question_id}"
        self.redis.hset(question_data_key, mapping={
            "type": question.get("type"),
            "question": question.get("question"),
            "correct_answer": json.dumps(question.get("correct_answer")),
            "options": json.dumps(question.get("options", []))
        })
        self.redis.lpush(questions_key, question_id)
        return question_id
    
    def update_question(self, code: str, question_id: str, question: dict) -> None:
        """Update a question."""
        code = self._normalize_code(code)
        question_key = f"question:{code}:{question_id}"
        self.redis.hset(question_key, mapping={
            "type": question.get("type"),
            "question": question.get("question"),
            "correct_answer": json.dumps(question.get("correct_answer")),
            "options": json.dumps(question.get("options", []))
        })
    
    def delete_question(self, code: str, question_id: str) -> None:
        """Delete a question."""
        code = self._normalize_code(code)
        question_key = f"question:{code}:{question_id}"
        questions_key = f"questions:{code}"
        self.redis.delete(question_key)
        self.redis.lrem(questions_key, 0, question_id)
    
    def get_question(self, code: str, question_id: str) -> Optional[dict]:
        """Get a single question."""
        code = self._normalize_code(code)
        question_key = f"question:{code}:{question_id}"
        q_data = self.redis.hgetall(question_key)
        if not q_data:
            return None
        q_data["id"] = question_id
        q_data["correct_answer"] = json.loads(q_data["correct_answer"])
        q_data["options"] = json.loads(q_data["options"])
        return q_data

    def clear_questions(self, code: str) -> None:
        """Remove all questions for a room."""
        code = self._normalize_code(code)
        questions_key = f"questions:{code}"
        question_ids = self.redis.lrange(questions_key, 0, -1)

        question_keys = [f"question:{code}:{qid}" for qid in question_ids]
        if question_keys:
            self.redis.delete(*question_keys)

        self.redis.delete(questions_key)
    
    # Players
    def add_player(self, code: str, player_name: str, player_id: str) -> None:
        """Add player to a room."""
        code = self._normalize_code(code)
        players_key = f"players:{code}"
        self.redis.sadd(players_key, f"{player_id}:{player_name}")
    
    def get_players(self, code: str) -> Set[str]:
        """Get all players in a room."""
        code = self._normalize_code(code)
        players_key = f"players:{code}"
        return self.redis.smembers(players_key)
    
    def remove_player(self, code: str, player_id: str) -> None:
        """Remove player from a room."""
        code = self._normalize_code(code)
        players_key = f"players:{code}"
        players = self.redis.smembers(players_key)
        for player in players:
            if player.startswith(f"{player_id}:"):
                self.redis.srem(players_key, player)
    
    # Leaderboard & Scores
    def add_score(self, code: str, player_name: str, points: int) -> None:
        """Add points to player score."""
        code = self._normalize_code(code)
        leaderboard_key = f"leaderboard:{code}"
        self.redis.zadd(leaderboard_key, {player_name: points}, incr=True)
    
    def get_leaderboard(self, code: str, limit: int = 100) -> List[dict]:
        """Get leaderboard sorted by score (descending)."""
        code = self._normalize_code(code)
        leaderboard_key = f"leaderboard:{code}"
        entries = self.redis.zrevrange(leaderboard_key, 0, limit - 1, withscores=True)
        return [{"player_name": name, "score": int(score)} for name, score in entries]
    
    # Current Question
    def set_current_question_index(self, code: str, index: int) -> None:
        """Set current question index."""
        code = self._normalize_code(code)
        current_q_key = f"current_q:{code}"
        self.redis.set(current_q_key, str(index))
    
    def get_current_question_index(self, code: str) -> int:
        """Get current question index."""
        code = self._normalize_code(code)
        current_q_key = f"current_q:{code}"
        value = self.redis.get(current_q_key)
        return int(value) if value is not None else -1
    
    # Topic Caching (Bonus)
    def cache_topic_questions(self, topic: str, questions: List[dict]) -> None:
        """Cache AI-generated questions for a topic (24h TTL)."""
        cache_key = f"cache:topic:{topic}"
        self.redis.setex(cache_key, 86400, json.dumps(questions))  # 24 hours
    
    def get_cached_topic_questions(self, topic: str) -> Optional[List[dict]]:
        """Get cached questions for a topic."""
        cache_key = f"cache:topic:{topic}"
        cached = self.redis.get(cache_key)
        return json.loads(cached) if cached else None
    
    # Answer Tracking
    def record_answer(self, code: str, question_id: str, player_id: str, answer: Any) -> None:
        """Record player's answer for a question."""
        code = self._normalize_code(code)
        answer_key = f"answer:{code}:{question_id}:{player_id}"
        self.redis.set(answer_key, json.dumps(answer))
    
    def get_answer(self, code: str, question_id: str, player_id: str) -> Optional[Any]:
        """Get player's answer for a question."""
        code = self._normalize_code(code)
        answer_key = f"answer:{code}:{question_id}:{player_id}"
        answer = self.redis.get(answer_key)
        return json.loads(answer) if answer else None


# Global Redis client instance
redis_client = RedisClient()
