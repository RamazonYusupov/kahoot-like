#!/usr/bin/env python
"""
Simple test script to verify the Kahoot API is working correctly.
Run this after starting the server: python test_api.py
"""

import requests
import json
import time
from typing import Any, Dict

BASE_URL = "http://localhost:8000"
TIMEOUT = 10

def test_health():
    """Test health check endpoint."""
    print("\n[TEST] Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_create_room():
    """Test room creation with AI question generation."""
    print("\n[TEST] Create Room with AI Generation")
    try:
        payload = {
            "topic": "World Geography",
            "host_id": "test_host_1"
        }
        response = requests.post(
            f"{BASE_URL}/rooms",
            json=payload,
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            return data.get("code")  # Return room code for next tests
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def test_get_room(room_code: str):
    """Test getting room information."""
    print(f"\n[TEST] Get Room Info ({room_code})")
    try:
        response = requests.get(
            f"{BASE_URL}/rooms/{room_code}",
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_get_questions(room_code: str):
    """Test getting generated questions."""
    print(f"\n[TEST] Get Generated Questions ({room_code})")
    try:
        response = requests.get(
            f"{BASE_URL}/rooms/{room_code}/questions",
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        questions = response.json()
        print(f"Number of questions: {len(questions)}")
        
        if questions:
            print(f"\nFirst question:")
            print(json.dumps(questions[0], indent=2))
        
        return response.status_code == 200 and len(questions) > 0
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_add_question(room_code: str):
    """Test adding a manual question."""
    print(f"\n[TEST] Add Manual Question ({room_code})")
    try:
        payload = {
            "type": "mcq",
            "question": "What is the largest planet in our solar system?",
            "options": ["Earth", "Saturn", "Jupiter", "Neptune"],
            "correct_answer": 2
        }
        response = requests.post(
            f"{BASE_URL}/rooms/{room_code}/questions",
            json=payload,
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_player_join(room_code: str):
    """Test player joining."""
    print(f"\n[TEST] Player Joins Room ({room_code})")
    try:
        payload = {"player_name": "TestPlayer"}
        response = requests.post(
            f"{BASE_URL}/rooms/{room_code}/join",
            json=payload,
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            return data.get("player_id")  # Return player ID for next tests
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def test_start_game(room_code: str):
    """Test starting the game."""
    print(f"\n[TEST] Start Game ({room_code})")
    try:
        response = requests.post(
            f"{BASE_URL}/rooms/{room_code}/start",
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_get_current_question(room_code: str):
    """Test getting current question."""
    print(f"\n[TEST] Get Current Question ({room_code})")
    try:
        response = requests.get(
            f"{BASE_URL}/rooms/{room_code}/current-question",
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_submit_answer(room_code: str, player_id: str):
    """Test submitting an answer."""
    print(f"\n[TEST] Submit Answer ({room_code})")
    try:
        payload = {
            "player_id": player_id,
            "answer": 0,
            "time_taken": 5
        }
        response = requests.post(
            f"{BASE_URL}/rooms/{room_code}/answer",
            json=payload,
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_leaderboard(room_code: str):
    """Test getting leaderboard."""
    print(f"\n[TEST] Get Leaderboard ({room_code})")
    try:
        response = requests.get(
            f"{BASE_URL}/rooms/{room_code}/leaderboard",
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 50)
    print("Kahoot API - Test Suite")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("\n❌ Server is not running! Start it with: python -m uvicorn app.main:app --reload")
        return
    
    # Create room
    room_code = test_create_room()
    if not room_code:
        print("\n❌ Failed to create room. Check your AI API configuration.")
        return
    
    # Test room operations
    test_get_room(room_code)
    test_get_questions(room_code)
    test_add_question(room_code)
    
    # Player operations
    player_id = test_player_join(room_code)
    if not player_id:
        print("\n❌ Failed to add player")
        return
    
    # Game flow
    test_start_game(room_code)
    test_get_current_question(room_code)
    test_submit_answer(room_code, player_id)
    test_leaderboard(room_code)
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    main()
