import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import kahootAPI from '../services/api';

export default function HostPanel() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiQuestionCount, setAIQuestionCount] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'mcq',
    question: '',
    correct_answer: '',
    options: ['', '', '', ''],
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [code]);

  const loadData = async () => {
    try {
      const [roomRes, questionsRes] = await Promise.all([
        kahootAPI.getRoom(code),
        kahootAPI.getQuestions(code),
      ]);
      setRoom(roomRes.data);
      setQuestions(questionsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load room data');
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      setError('Please enter a question');
      return;
    }

    try {
      const data = { ...formData };
      if (formData.type === 'mcq') {
        data.correct_answer = parseInt(formData.correct_answer);
        data.options = formData.options.filter((o) => o.trim());
        if (data.options.length < 4) {
          setError('MCQ must have 4 options');
          return;
        }
      } else if (formData.type === 'true_false') {
        data.correct_answer = formData.correct_answer === 'true';
        data.options = undefined;
      }

      if (editingId) {
        await kahootAPI.updateQuestion(code, editingId, data);
        setEditingId(null);
      } else {
        await kahootAPI.addQuestion(code, data);
      }

      setFormData({
        type: 'mcq',
        question: '',
        correct_answer: '',
        options: ['', '', '', ''],
      });
      setShowAddForm(false);
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Delete this question?')) {
      try {
        await kahootAPI.deleteQuestion(code, questionId);
        loadData();
      } catch (err) {
        setError('Failed to delete question');
      }
    }
  };

  const handleEditQuestion = (question) => {
    setEditingId(question.id);
    setFormData({
      type: question.type,
      question: question.question,
      correct_answer: question.type === 'mcq' ? question.correct_answer : String(question.correct_answer),
      options: question.options || ['', '', '', ''],
    });
    setShowAddForm(true);
  };

  const handleStartGame = async () => {
    if (questions.length === 0) {
      setError('Add at least one question before starting');
      return;
    }
    try {
      await kahootAPI.startGame(code);
      navigate(`/host/game/${code}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start game');
    }
  };

  const handleGenerateAIQuestions = async () => {
    if (generatingAI) {
      return;
    }

    if (questions.length > 0) {
      const confirmed = window.confirm('Existing questions will be replaced. Continue?');
      if (!confirmed) {
        return;
      }
    }

    setGeneratingAI(true);
    setError('');
    try {
      await kahootAPI.generateAIQuestions(code, {
        prompt: aiPrompt.trim(),
        question_count: Number(aiQuestionCount),
      });
      setShowAddForm(false);
      setShowAIModal(false);
      setEditingId(null);
      setAIPrompt('');
      setAIQuestionCount(10);
      setFormData({
        type: 'mcq',
        question: '',
        correct_answer: '',
        options: ['', '', '', ''],
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate AI questions');
    } finally {
      setGeneratingAI(false);
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
        <h1>🎙️ Host Panel</h1>
        <p>Room Code: <span className="room-code">{code}</span></p>
      </header>

      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2>📋 Manage Questions</h2>
              <p style={{ color: '#666', marginTop: '5px' }}>
                Topic: <strong>{room.topic}</strong> | Players: <strong>{room.player_count}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAIModal(true)} disabled={generatingAI}>
                {generatingAI ? '⏳ Generating...' : '🤖 Generate Questions AI'}
              </button>
              <button className="btn btn-success" onClick={handleStartGame}>
                ▶️ Start Game ({questions.length} questions)
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {showAIModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px',
              }}
            >
              <div
                className="card"
                style={{ width: '100%', maxWidth: '680px', margin: 0 }}
              >
                <h3 style={{ marginBottom: '10px' }}>🤖 AI Prompt Sozlamalari</h3>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Qanday savollar kerakligini yozing: daraja, til, format, mavzu chuqurligi va boshqalar.
                </p>

                <div className="form-group">
                  <label>Savollar soni</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={aiQuestionCount}
                    onChange={(e) => setAIQuestionCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                  />
                </div>

                <div className="form-group">
                  <label>Custom Prompt (ixtiyoriy)</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    placeholder={'Masalan:\n- Savollar o\'rtacha qiyinlikda bo\'lsin\n- 60% mcq, 20% true/false, 20% open\n- Savollar o\'zbek tilida bo\'lsin\n- 2 ta amaliy coding savol qo\'shilsin'}
                    style={{ minHeight: '150px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAIModal(false)}
                    disabled={generatingAI}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGenerateAIQuestions}
                    disabled={generatingAI}
                  >
                    {generatingAI ? '⏳ Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddForm && (
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>{editingId ? 'Edit' : 'Add'} Question</h3>
              <form onSubmit={handleAddQuestion} style={{ marginTop: '15px' }}>
                <div className="form-group">
                  <label>Question Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        type: e.target.value,
                        correct_answer: '',
                        options: ['', '', '', ''],
                      });
                    }}
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="open">Open Answer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question text"
                  />
                </div>

                {formData.type === 'mcq' && (
                  <>
                    {formData.options.map((option, idx) => (
                      <div key={idx} className="form-group">
                        <label>Option {idx + 1}</label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[idx] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Correct Answer (option index)</label>
                      <select value={formData.correct_answer} onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}>
                        <option value="">Select correct option</option>
                        {formData.options.map((_, idx) => (
                          <option key={idx} value={idx}>
                            Option {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.type === 'true_false' && (
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <select value={formData.correct_answer} onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}>
                      <option value="">Select answer</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                )}

                {formData.type === 'open' && (
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <input
                      type="text"
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="Enter the correct answer"
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Question' : 'Add Question'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                      setFormData({
                        type: 'mcq',
                        question: '',
                        correct_answer: '',
                        options: ['', '', '', ''],
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showAddForm && (
            <button className="btn btn-secondary" onClick={() => setShowAddForm(true)} style={{ marginBottom: '20px' }}>
              ➕ Add Question Manually
            </button>
          )}

          <div>
            {questions.length === 0 ? (
              <div className="empty-state">
                <p>No questions yet. AI-generated questions will appear here.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="question-card">
                  <div className="question-header">
                    <div>
                      <span className={`question-type ${q.type}`}>{q.type.replace('_', '/')}</span>
                      <div className="question-text">Q{idx + 1}: {q.question}</div>
                    </div>
                  </div>

                  {q.type === 'mcq' && (
                    <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                      {q.options.map((opt, i) => (
                        <div key={i} style={{ padding: '5px 0', color: i === q.correct_answer ? '#10b981' : '#666' }}>
                          {i === q.correct_answer ? '✓ ' : ''}
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div style={{ marginLeft: '20px', marginBottom: '10px', color: '#666' }}>
                      Correct: <strong>{q.correct_answer ? 'True' : 'False'}</strong>
                    </div>
                  )}

                  {q.type === 'open' && (
                    <div style={{ marginLeft: '20px', marginBottom: '10px', color: '#666' }}>
                      Answer: <strong>{q.correct_answer}</strong>
                    </div>
                  )}

                  <div className="question-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => handleEditQuestion(q)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDeleteQuestion(q.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
