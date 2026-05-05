# Kahoot API - Complete Endpoint Reference

## Overview

The Kahoot backend provides **14 RESTful endpoints** for managing rooms, questions, and gameplay.

---

## Base URL

```
http://localhost:8000
```

---

## Authentication

Currently, no authentication is implemented. In production, add JWT or API key authentication.

---

## Response Format

All responses are JSON with standard HTTP status codes.

### Success Response (200 OK)
```json
{
  "field": "value"
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

### HTTP Status Codes
- **200** - OK
- **400** - Bad Request (invalid input or game state)
- **403** - Forbidden (game already started)
- **404** - Not Found (room or resource)
- **500** - Internal Server Error

---

## Endpoints

### 1. Health Check

**Check if API is running**

```http
GET /health
```

**Response (200 OK)**
```json
{
  "status": "healthy",
  "redis": "connected"
}
```

---

### 2. Root

**Get API information**

```http
GET /
```

**Response (200 OK)**
```json
{
  "message": "Welcome to Kahoot Clone API",
  "docs": "/docs",
  "redoc": "/redoc"
}
```

---

## Room Endpoints

### 3. Create Room

**Create a new room and generate AI questions**

```http
POST /rooms
Content-Type: application/json

{
  "topic": "Python Programming",
  "host_id": "host_user_123"
}
```

**Response (200 OK)**
```json
{
  "code": "XKQPLM",
  "status": "waiting",
  "host_id": "host_user_123",
  "topic": "Python Programming",
  "created_at": "2024-05-04T10:30:00.123456",
  "player_count": 0
}
```

**Errors:**
- **500** - AI API call failed

**Notes:**
- Room code is randomly generated (6 uppercase letters)
- 10 questions are automatically generated from topic
- Room auto-expires after 1 hour
- Cached topics return cached questions (24h TTL)

---

### 4. Get Room

**Get current room status and information**

```http
GET /rooms/{code}
```

**Parameters:**
- `code` (path) - Room code (e.g., "XKQPLM")

**Response (200 OK)**
```json
{
  "code": "XKQPLM",
  "status": "waiting",
  "host_id": "host_user_123",
  "topic": "Python Programming",
  "created_at": "2024-05-04T10:30:00.123456",
  "player_count": 2
}
```

**Errors:**
- **404** - Room not found

**Notes:**
- Shows current number of connected players
- Status can be: "waiting", "active", or "finished"

---

## Question Endpoints

### 5. Get All Questions

**Get all questions for a room**

```http
GET /rooms/{code}/questions
```

**Parameters:**
- `code` (path) - Room code

**Response (200 OK)**
```json
[
  {
    "id": "0",
    "type": "mcq",
    "question": "What is Redis?",
    "options": ["Database", "Framework", "OS", "Language"],
    "correct_answer": 0
  },
  {
    "id": "1",
    "type": "true_false",
    "question": "Python is dynamically typed.",
    "correct_answer": true
  },
  {
    "id": "2",
    "type": "open",
    "question": "What is the capital of France?",
    "correct_answer": "Paris"
  }
]
```

**Errors:**
- **404** - Room not found

---

### 6. Add Question

**Add a new question manually (before game starts)**

```http
POST /rooms/{code}/questions
Content-Type: application/json

{
  "type": "mcq",
  "question": "What is the largest planet?",
  "options": ["Earth", "Saturn", "Jupiter", "Neptune"],
  "correct_answer": 2
}
```

**Parameters:**
- `code` (path) - Room code
- `type` (body) - "open", "true_false", or "mcq"
- `question` (body) - Question text
- `correct_answer` (body) - Answer (string for open, boolean for T/F, integer for MCQ)
- `options` (body) - Array of 4 strings for MCQ only

**Response (200 OK)**
```json
{
  "id": "10",
  "type": "mcq",
  "question": "What is the largest planet?",
  "options": ["Earth", "Saturn", "Jupiter", "Neptune"],
  "correct_answer": 2,
  "message": "Question added successfully"
}
```

**Errors:**
- **400** - Invalid question structure or game already started
- **403** - Game already started (game in "active" state)
- **404** - Room not found

**Notes:**
- MCQ must have exactly 4 options
- Question ID is auto-generated
- Only allowed before game starts

---

### 7. Edit Question

**Update an existing question (before game starts)**

```http
PUT /rooms/{code}/questions/{id}
Content-Type: application/json

{
  "type": "true_false",
  "question": "Python is a compiled language.",
  "correct_answer": false
}
```

**Parameters:**
- `code` (path) - Room code
- `id` (path) - Question ID
- `type` (body) - Question type
- `question` (body) - Question text
- `correct_answer` (body) - Correct answer
- `options` (body) - Options for MCQ

**Response (200 OK)**
```json
{
  "id": "0",
  "type": "true_false",
  "question": "Python is a compiled language.",
  "correct_answer": false,
  "message": "Question updated successfully"
}
```

**Errors:**
- **400** - Invalid structure or game started
- **403** - Game already started
- **404** - Question not found

**Notes:**
- Same validation as POST
- MCQ must have 4 options
- Only before game starts

---

### 8. Delete Question

**Remove a question (before game starts)**

```http
DELETE /rooms/{code}/questions/{id}
```

**Parameters:**
- `code` (path) - Room code
- `id` (path) - Question ID

**Response (200 OK)**
```json
{
  "message": "Question deleted successfully"
}
```

**Errors:**
- **403** - Game already started
- **404** - Question not found

**Notes:**
- Only before game starts
- Question count can drop to 0

---

## Gameplay Endpoints

### 9. Player Join

**Player joins a room**

```http
POST /rooms/{code}/join
Content-Type: application/json

{
  "player_name": "Alice"
}
```

**Parameters:**
- `code` (path) - Room code
- `player_name` (body) - Player's display name

**Response (200 OK)**
```json
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Alice joined the room"
}
```

**Errors:**
- **400** - Game already started
- **404** - Room not found

**Notes:**
- Player ID is UUID
- Player can join during "waiting" state only
- Must use returned player_id for answer submission

---

### 10. Start Game

**Host starts the game (transitions to active state)**

```http
POST /rooms/{code}/start
```

**Parameters:**
- `code` (path) - Room code

**Response (200 OK)**
```json
{
  "message": "Game started",
  "question_count": 10
}
```

**Errors:**
- **400** - Less than 1 question or game already started
- **404** - Room not found

**Notes:**
- Sets room status to "active"
- Disables question editing after this
- Requires at least 1 question
- Sets current question index to 0

---

### 11. Get Current Question

**Get the currently active question**

```http
GET /rooms/{code}/current-question
```

**Parameters:**
- `code` (path) - Room code

**Response (200 OK)**
```json
{
  "id": "0",
  "type": "mcq",
  "question": "What is Redis?",
  "options": ["Database", "Framework", "OS", "Language"]
}
```

**Errors:**
- **400** - Game not started or no more questions
- **404** - Room not found

**Notes:**
- Does NOT return the correct answer
- Players see options but not answers
- Only available during "active" state

---

### 12. Submit Answer

**Player submits an answer to current question**

```http
POST /rooms/{code}/answer
Content-Type: application/json

{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "answer": 0,
  "time_taken": 8
}
```

**Parameters:**
- `code` (path) - Room code
- `player_id` (body) - UUID from join response
- `answer` (body) - Answer (string for open, boolean for T/F, int for MCQ)
- `time_taken` (body) - Seconds to answer (integer)

**Response (200 OK)**
```json
{
  "correct": true,
  "points_earned": 100,
  "correct_answer": 0
}
```

**Errors:**
- **400** - Game not started or no more questions
- **404** - Room not found

**Scoring Rules:**
- Correct ≤ 5s: 100 points
- Correct ≤ 15s: 75 points
- Correct > 15s: 50 points
- Wrong or timeout: 0 points

**Answer Checking:**
- **open**: Case-insensitive, whitespace trimmed
- **true_false**: Exact boolean match
- **mcq**: Index must match correct_answer

**Notes:**
- Answer is recorded and affects leaderboard
- Player can answer multiple times per question
- Time is in seconds

---

### 13. Get Leaderboard

**Get current scores and rankings**

```http
GET /rooms/{code}/leaderboard
```

**Parameters:**
- `code` (path) - Room code

**Response (200 OK)**
```json
[
  {
    "player_name": "Alice",
    "score": 350
  },
  {
    "player_name": "Bob",
    "score": 250
  },
  {
    "player_name": "Charlie",
    "score": 175
  }
]
```

**Errors:**
- **404** - Room not found

**Notes:**
- Sorted by score (descending)
- Returns all players with scores
- Scores accumulate throughout game
- Empty array if no players have answered

---

### 14. Next Question

**Move to next question (host only)**

```http
POST /rooms/{code}/next
```

**Parameters:**
- `code` (path) - Room code

**Response (200 OK)**
```json
{
  "message": "Moved to question 2",
  "current_index": 1,
  "total_questions": 10,
  "final": false
}
```

**OR on game end:**
```json
{
  "message": "Game finished",
  "final": true
}
```

**Errors:**
- **400** - Game not started
- **404** - Room not found

**Notes:**
- Increments current question index
- If no more questions, sets status to "finished"
- Host calls this after accepting all answers
- Current question index starts at 0

---

## Request/Response Examples

### Complete Game Flow

```bash
# 1. Host creates room with topic
curl -X POST http://localhost:8000/rooms \
  -H "Content-Type: application/json" \
  -d '{"topic":"Python Programming","host_id":"host1"}'
# Returns: {"code":"XKQPLM", ...}

# 2. Host reviews generated questions
curl http://localhost:8000/rooms/XKQPLM/questions

# 3. Players join
curl -X POST http://localhost:8000/rooms/XKQPLM/join \
  -H "Content-Type: application/json" \
  -d '{"player_name":"Alice"}'
# Returns: {"player_id":"550e8400...", ...}

# 4. Host starts game
curl -X POST http://localhost:8000/rooms/XKQPLM/start

# 5. Get current question
curl http://localhost:8000/rooms/XKQPLM/current-question

# 6. Player answers
curl -X POST http://localhost:8000/rooms/XKQPLM/answer \
  -H "Content-Type: application/json" \
  -d '{"player_id":"550e8400...","answer":0,"time_taken":5}'

# 7. View leaderboard
curl http://localhost:8000/rooms/XKQPLM/leaderboard

# 8. Move to next question
curl -X POST http://localhost:8000/rooms/XKQPLM/next

# ... repeat steps 5-8 for each question
```

---

## Data Types

### Room Code
- **Format**: 6 uppercase letters (A-Z)
- **Example**: "XKQPLM"
- **Generation**: Random, unique per room

### Player ID
- **Format**: UUID v4
- **Example**: "550e8400-e29b-41d4-a716-446655440000"
- **Returned**: On successful join

### Question Type
- **Values**: "open" | "true_false" | "mcq"
- **Case**: Lowercase with underscores

### Room Status
- **Values**: "waiting" | "active" | "finished"
- **Transitions**: waiting → active → finished

### Answer
- **Type**: Depends on question type
  - open: string
  - true_false: boolean
  - mcq: integer (0-3)

---

## Rate Limiting

Currently, no rate limiting is implemented. The endpoint supports X-RateLimit headers for future implementation.

---

## Caching

- **AI Questions**: 24-hour cache per topic
- **Room Data**: 1-hour TTL per room
- **Player Data**: 1-hour TTL per room

---

## Error Codes Reference

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format and game state |
| 403 | Forbidden | Game already started (editing not allowed) |
| 404 | Not Found | Room/question doesn't exist |
| 500 | Server Error | AI API failed, check configuration |

---

## Best Practices

1. **Always store player_id** after join - needed for answers
2. **Check game status** before operations
3. **Handle errors gracefully** in frontend
4. **Use /docs endpoint** for interactive testing
5. **Cache room codes** in browser storage

---

## Interactive Documentation

Visit **http://localhost:8000/docs** for interactive Swagger UI where you can:
- Test all endpoints
- See response examples
- Read parameter descriptions
- Try requests in real-time

---

**Last Updated**: May 4, 2024
