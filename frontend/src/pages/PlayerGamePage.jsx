import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import kahootAPI from '../services/api';

const QUESTION_TIME_LIMIT = 20;

export default function PlayerGamePage() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [answering, setAnswering] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const playerId = sessionStorage.getItem(`player_${code}`);
  const playerName = sessionStorage.getItem(`playerName_${code}`);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    if (!answering || submitted || !currentQuestion) {
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setAnswering(false);
          setSubmitted(true);
          setResult(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [answering, submitted, currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setSelectedAnswer(null);
    setSubmitted(false);
    setResult(null);
    setAnswering(true);
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentQuestion?.id]);

  const loadData = async () => {
    try {
      // Always load room - this is required
      const roomRes = await kahootAPI.getRoom(code);
      setRoom(roomRes.data);

      // Try to load game data, but don't fail if game hasn't started yet
      try {
        const [currentQRes, questionsRes] = await Promise.all([
          kahootAPI.getCurrentQuestion(code),
          kahootAPI.getQuestions(code),
        ]);

        setCurrentQuestion(currentQRes.data);
        setTotalQuestions(questionsRes.data.length);
        
        // Find current index
        const currentIdx = questionsRes.data.findIndex((q) => q.id === currentQRes.data.id);
        setCurrentIndex(currentIdx >= 0 ? currentIdx : 0);
      } catch (gameErr) {
        // Game hasn't started yet, that's ok
        setCurrentQuestion(null);
        setTotalQuestions(0);
        setCurrentIndex(0);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load room');
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      setError('Please select an answer');
      return;
    }

    if (!playerId) {
      setError('Player session not found. Please join the room again.');
      return;
    }

    setSubmitted(true);
    setAnswering(false);

    try {
      const timeTaken = QUESTION_TIME_LIMIT - timeLeft;
      const response = await kahootAPI.submitAnswer(code, playerId, selectedAnswer, timeTaken);
      setResult(response.data);
    } catch (err) {
      setError('Failed to submit answer');
    }
  };

  const handleTextAnswer = async (text) => {
    if (!playerId) {
      setError('Player session not found. Please join the room again.');
      return;
    }

    setSubmitted(true);
    setAnswering(false);

    try {
      const timeTaken = QUESTION_TIME_LIMIT - timeLeft;
      const response = await kahootAPI.submitAnswer(code, playerId, text, timeTaken);
      setResult(response.data);
    } catch (err) {
      setError('Failed to submit answer');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="page">
        <div className="container">
          <div className="card">
            <div className="alert alert-error">Room not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header>
        <h1>🎮 Quiz Game</h1>
        <p>
          {playerName} | Room: <span className="room-code">{code}</span>
        </p>
      </header>

      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}

        {currentQuestion ? (
          <div className="card">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#666', marginBottom: '10px' }}>
                Question {currentIndex + 1} of {totalQuestions}
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.3s',
                  }}
                ></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <div>
                <span className={`question-type ${currentQuestion.type}`}>
                  {currentQuestion.type.replace('_', '/')}
                </span>
                <div className="question-text">{currentQuestion.question}</div>
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: timeLeft <= 5 ? '#ef4444' : '#667eea',
                }}
              >
                {timeLeft}s
              </div>
            </div>

            {!submitted ? (
              <>
                {currentQuestion.type === 'mcq' && (
                  <div className="options">
                    {currentQuestion.options.map((opt, idx) => (
                      <label key={idx} className={`option ${selectedAnswer === idx ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="answer"
                          value={idx}
                          checked={selectedAnswer === idx}
                          onChange={() => setSelectedAnswer(idx)}
                          disabled={!answering}
                        />
                        <span>
                          {String.fromCharCode(65 + idx)}. {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <div className="options">
                    <label className={`option ${selectedAnswer === true ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="answer"
                        value="true"
                        checked={selectedAnswer === true}
                        onChange={() => setSelectedAnswer(true)}
                        disabled={!answering}
                      />
                      <span>A. True</span>
                    </label>
                    <label className={`option ${selectedAnswer === false ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="answer"
                        value="false"
                        checked={selectedAnswer === false}
                        onChange={() => setSelectedAnswer(false)}
                        disabled={!answering}
                      />
                      <span>B. False</span>
                    </label>
                  </div>
                )}

                {currentQuestion.type === 'open' && (
                  <div className="form-group">
                    <input
                      type="text"
                      id="openAnswer"
                      placeholder="Type your answer..."
                      disabled={!answering}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && answering) {
                          handleTextAnswer(e.target.value);
                        }
                      }}
                    />
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={
                    currentQuestion.type === 'open'
                      ? () => handleTextAnswer(document.getElementById('openAnswer').value)
                      : handleSubmitAnswer
                  }
                  disabled={!answering || timeLeft === 0}
                  style={{ marginTop: '20px', width: '100%' }}
                >
                  Submit Answer
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {result && (
                  <>
                    {result.correct ? (
                      <div className="alert alert-success">
                        <h3 style={{ margin: '10px 0' }}>✓ Correct!</h3>
                        <p>You earned {result.points_earned} points</p>
                      </div>
                    ) : (
                      <div className="alert alert-error">
                        <h3 style={{ margin: '10px 0' }}>✗ Incorrect</h3>
                        <p>Correct answer: {String(result.correct_answer)}</p>
                      </div>
                    )}
                  </>
                )}
                <p style={{ marginTop: '20px', color: '#666' }}>Waiting for next question...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="alert alert-info">Waiting for the host to start the game...</div>
          </div>
        )}
      </div>
    </div>
  );
}
