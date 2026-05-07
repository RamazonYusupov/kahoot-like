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
      setCanGoNext(false);
      setProgress({ answered_count: 0, total_players: progress.total_players, all_answered: false });
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

        {/* Full-screen Leaderboard Overlay - shows when all players answered */}
        {progress.all_answered && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '40px 20px',
              color: 'white',
            }}
          >
            <h1 style={{ fontSize: '64px', marginBottom: '10px', textShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
              🏆 Leaderboard
            </h1>
            <p style={{ fontSize: '24px', marginBottom: '60px', opacity: 0.95 }}>
              Question {questionIndex + 1} completed
            </p>

            <div
              style={{
                width: '100%',
                maxWidth: '800px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              }}
            >
              <table
                className="leaderboard"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  color: '#1f2937',
                }}
              >
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        No scores yet
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx < leaderboard.length - 1 ? '1px solid #e5e7eb' : 'none',
                          padding: '20px 0',
                          fontSize: '20px',
                        }}
                      >
                        <td
                          style={{
                            padding: '20px',
                            fontWeight: 'bold',
                            fontSize: '32px',
                            width: '80px',
                            textAlign: 'center',
                          }}
                        >
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                        </td>
                        <td style={{ padding: '20px', flex: 1, fontWeight: 500 }}>
                          {entry.player_name}
                        </td>
                        <td
                          style={{
                            padding: '20px',
                            fontWeight: 'bold',
                            fontSize: '28px',
                            color: '#667eea',
                            textAlign: 'right',
                          }}
                        >
                          {entry.score}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleNextQuestion}
              style={{
                marginTop: '60px',
                padding: '16px 40px',
                fontSize: '18px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                fontWeight: 'bold',
                minWidth: '200px',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.background = 'white')}
            >
              ⏭️ Next Question
            </button>
          </div>
        )}

        {/* Current Question - Full Width */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>📋 Current Question</h2>
          {gameFinished ? (
            <div className="alert alert-info">
              ✅ Game Finished! Final leaderboard is displayed.
            </div>
          ) : currentQuestion ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
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
              <div className="question-text" style={{ fontSize: '22px', marginBottom: '15px' }}>
                {currentQuestion.question}
              </div>

              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: timeLeft <= 5 ? '#ef4444' : '#667eea',
                  marginBottom: '15px',
                  textAlign: 'center',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                {timeLeft}s
              </div>

              <div className="alert alert-info" style={{ marginBottom: '15px', fontSize: '14px' }}>
                Javoblar: <strong>{progress.answered_count}/{progress.total_players}</strong>
                {progress.all_answered && (
                  <span style={{ marginLeft: '10px', color: '#10b981' }}>✓ Barcha o'yinchilar javob berdi!</span>
                )}
              </div>

              {currentQuestion.type === 'mcq' && (
                <div className="options">
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="option" style={{ fontSize: '16px', padding: '12px' }}>
                      <span style={{ fontWeight: 'bold', minWidth: '30px', fontSize: '18px' }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="options">
                  <div className="option" style={{ fontSize: '16px', padding: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>A.</span>
                    <span>True</span>
                  </div>
                  <div className="option" style={{ fontSize: '16px', padding: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>B.</span>
                    <span>False</span>
                  </div>
                </div>
              )}

              {currentQuestion.type === 'open' && (
                <div style={{ background: '#f0f4ff', padding: '20px', borderRadius: '8px', marginTop: '20px', fontSize: '18px' }}>
                  <p style={{ color: '#666', marginBottom: '5px' }}>O'yinchilar javob yozmoqda...</p>
                </div>
              )}

              {!progress.all_answered && (
                <div className="alert alert-info" style={{ marginTop: '30px', fontSize: '16px' }}>
                  ⏳ Barcha o'yinchilar javob bergungacha kutilmoqda... ({progress.answered_count}/{progress.total_players})
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-info">Savol yuklanmoqda...</div>
          )}
        </div>
      </div>
    </div>
  );
}
