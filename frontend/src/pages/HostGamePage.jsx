import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import kahootAPI from '../services/api';

const QUESTION_TIME_LIMIT = 20;

export default function HostGamePage() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [canGoNext, setCanGoNext] = useState(false);
  const [progress, setProgress] = useState({ answered_count: 0, total_players: 0, all_answered: false });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [code]);

  const loadData = async () => {
    try {
      const [roomRes, currentQRes, leaderboardRes, progressRes] = await Promise.all([
        kahootAPI.getRoom(code),
        kahootAPI.getCurrentQuestion(code),
        kahootAPI.getLeaderboard(code),
        kahootAPI.getCurrentProgress(code),
      ]);

      setRoom(roomRes.data);
      setCurrentQuestion(currentQRes.data);
      setLeaderboard(leaderboardRes.data);
      setProgress(progressRes.data);

      if (progressRes.data.all_answered) {
        setCanGoNext(true);
      }
      
      // Get total questions
      const questionsRes = await kahootAPI.getQuestions(code);
      setTotalQuestions(questionsRes.data.length);
      
      // Find current index
      const currentIdx = questionsRes.data.findIndex((q) => q.id === currentQRes.data.id);
      setQuestionIndex(currentIdx >= 0 ? currentIdx : 0);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load game data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentQuestion || gameFinished) {
      return;
    }

    setTimeLeft(QUESTION_TIME_LIMIT);
    setCanGoNext(false);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCanGoNext(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [currentQuestion?.id, gameFinished]);

  useEffect(() => {
    if (progress.all_answered) {
      setCanGoNext(true);
    }
  }, [progress.all_answered]);

  const handleNextQuestion = async () => {
    try {
      const response = await kahootAPI.nextQuestion(code);
      if (response.data.final) {
        setGameFinished(true);
      }
      loadData();
    } catch (err) {
      setError('Failed to move to next question');
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

  return (
    <div className="page">
      <header>
        <h1>🎙️ Host Control</h1>
        <p>Room Code: <span className="room-code">{code}</span> | Players: {room?.player_count || 0}</p>
      </header>

      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid grid-2">
          {/* Current Question */}
          <div className="card">
            <h2>📋 Current Question</h2>
            {gameFinished ? (
              <div className="alert alert-info">
                ✅ Game Finished! Show the final leaderboard.
              </div>
            ) : currentQuestion ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#666', marginBottom: '10px' }}>
                    Question {questionIndex + 1} of {totalQuestions}
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
                        width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        transition: 'width 0.3s',
                      }}
                    ></div>
                  </div>
                </div>

                <span className={`question-type ${currentQuestion.type}`}>
                  {currentQuestion.type.replace('_', '/')}
                </span>
                <div className="question-text">{currentQuestion.question}</div>

                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: timeLeft <= 5 ? '#ef4444' : '#667eea',
                    marginBottom: '16px',
                  }}
                >
                  Time Left: {timeLeft}s
                </div>

                <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                  Javoblar: {progress.answered_count}/{progress.total_players}
                </div>

                {currentQuestion.type === 'mcq' && (
                  <div className="options">
                    {currentQuestion.options.map((opt, idx) => (
                      <div key={idx} className="option">
                        <span style={{ fontWeight: 'bold', minWidth: '30px' }}>
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <div className="options">
                    <div className="option">
                      <span style={{ fontWeight: 'bold' }}>A.</span>
                      <span>True</span>
                    </div>
                    <div className="option">
                      <span style={{ fontWeight: 'bold' }}>B.</span>
                      <span>False</span>
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'open' && (
                  <div style={{ background: '#f0f4ff', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                    <p style={{ color: '#666', marginBottom: '5px' }}>Players are typing their answers...</p>
                  </div>
                )}

                {canGoNext ? (
                  <button className="btn btn-primary" onClick={handleNextQuestion} style={{ marginTop: '20px', width: '100%' }}>
                    ⏭️ Next Question
                  </button>
                ) : (
                  <div className="alert alert-info" style={{ marginTop: '20px' }}>
                    Keyingi savol tugmasi vaqt tugagandan keyin yoki barcha playerlar javob berganda chiqadi.
                  </div>
                )}
              </>
            ) : (
              <div className="alert alert-info">Loading question...</div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="card">
            <h2>🏆 Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <div className="alert alert-info">No scores yet. Players will appear as they answer.</div>
            ) : (
              <table className="leaderboard">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={idx}>
                      <td className={`rank ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                      </td>
                      <td>{entry.player_name}</td>
                      <td style={{ fontWeight: 'bold', color: '#667eea' }}>{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
