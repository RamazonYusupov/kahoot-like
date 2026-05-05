from pydantic import BaseModel, Field
from typing import List, Optional, Union


class QuestionBase(BaseModel):
    """Base model for questions"""
    type: str  # "open", "true_false", "mcq"
    question: str


class OpenQuestion(QuestionBase):
    """Open-ended question model"""
    type: str = "open"
    correct_answer: str


class TrueFalseQuestion(QuestionBase):
    """True/False question model"""
    type: str = "true_false"
    correct_answer: bool


class MCQQuestion(QuestionBase):
    """Multiple choice question model"""
    type: str = "mcq"
    options: List[str]
    correct_answer: int


Question = Union[OpenQuestion, TrueFalseQuestion, MCQQuestion]


class QuestionCreate(BaseModel):
    """Request body for creating a question manually"""
    type: str
    question: str
    correct_answer: Union[str, bool, int]
    options: Optional[List[str]] = None


class RoomCreate(BaseModel):
    """Request body for creating a room"""
    topic: str
    host_id: str = Field(..., description="The host's user ID")


class RoomResponse(BaseModel):
    """Response model for room information"""
    code: str
    status: str
    host_id: str
    topic: str
    created_at: str
    player_count: int = 0


class AdminRoomSummary(BaseModel):
    """Admin room summary model."""
    code: str
    status: str
    host_id: str
    topic: str
    created_at: str
    player_count: int = 0
    question_count: int = 0
    player_names: List[str] = []


class PlayerJoin(BaseModel):
    """Request body for player joining"""
    player_name: str


class PlayerAnswer(BaseModel):
    """Request body for player answer submission"""
    player_id: str
    answer: Union[str, bool, int]
    time_taken: int = Field(..., description="Time taken to answer in seconds")


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    player_name: str
    score: int


class CurrentQuestion(BaseModel):
    """Current question response"""
    id: str
    type: str
    question: str
    options: Optional[List[str]] = None


class AnswerResult(BaseModel):
    """Result after submitting an answer"""
    correct: bool
    points_earned: int
    correct_answer: Union[str, bool, int]


class AdminLogin(BaseModel):
    """Admin login request"""
    username: str
    password: str


class AIGenerateRequest(BaseModel):
    """Request body for AI question generation customization."""
    prompt: Optional[str] = None
    question_count: int = Field(default=10, ge=1, le=30)
