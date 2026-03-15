import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Moon, Sun, Zap } from 'lucide-react';
import { adminAPI } from '../../services/api';

const suggestedQuestions = [
  'What are the top complaints this month?',
  'Show me feedback about library',
  'How many pending feedbacks?',
  'What should I prioritize?',
  'Summarize negative feedback',
  'What is the most common category?'
];

const WELCOME_MESSAGE = {
  id: 0,
  role: 'assistant',
  text: 'Hello! I\'m your AI assistant. I can only answer questions related to student feedback.\n\nFor example:\n• "What are the main complaints this month?"\n• "Show me feedback about facilities"\n• "How many pending feedbacks are there?"\n• "What should I prioritize?"\n\nHow can I help you today?',
  timestamp: new Date()
};

const ChatWithAI = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, text, sources = null) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      text,
      sources,
      timestamp: new Date()
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    addMessage('user', question);
    setLoading(true);
    try {
      const response = await adminAPI.chatWithAI(question);
      const data = response.data;
      addMessage('assistant', data.answer || 'I could not find an answer. Please try again.', data.sources || null);
    } catch (err) {
      const backendMessage = err.response?.data?.message || 'Something went wrong. Make sure Ollama is running.';
      addMessage('assistant', backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setInput('');
  };

  // Theme tokens
  const t = {
    bg:          dark ? '#0f1117' : '#f5f5f7',
    surface:     dark ? '#1a1d27' : '#ffffff',
    surfaceAlt:  dark ? '#22263a' : '#f0f0f5',
    border:      dark ? '#2e3250' : '#e4e4e9',
    text:        dark ? '#e8eaf0' : '#1a1a2e',
    textMuted:   dark ? '#7a7f9a' : '#8888a0',
    accent:      dark ? '#7c6af7' : '#5b4fcf',
    accentSoft:  dark ? '#2a2550' : '#ede9ff',
    accentText:  dark ? '#b0a8ff' : '#5b4fcf',
    userBubble:  dark ? '#3d3580' : '#5b4fcf',
    userText:    '#ffffff',
    aiBubble:    dark ? '#22263a' : '#f0f0f5',
    aiText:      dark ? '#e8eaf0' : '#1a1a2e',
    inputBg:     dark ? '#22263a' : '#f7f7fa',
    inputBorder: dark ? '#3a3f5c' : '#dddde8',
    tagBg:       dark ? '#2a2550' : '#ede9ff',
    tagText:     dark ? '#b0a8ff' : '#5b4fcf',
    sourceBg:    dark ? '#1e2235' : '#faf9ff',
    sourceBorder:dark ? '#35396e' : '#ddd8ff',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 6rem)',
      background: t.bg,
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      transition: 'background 0.3s ease'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderBottom: `1px solid ${t.border}`,
        background: t.surface,
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px',
            borderRadius: '12px',
            background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={18} color={t.accentText} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: t.text, letterSpacing: '-0.3px' }}>
              AI Feedback Assistant
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '11px', color: t.textMuted }}>Powered by Ollama · phi3</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.textMuted,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? 'Light' : 'Dark'}
          </button>

          {/* New chat */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: `1px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.textMuted,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={13} />
            New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: t.bg,
        transition: 'background 0.3s ease'
      }}>

        {/* Suggested questions - only at start */}
        {messages.length <= 1 && (
          <div style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={14} color={t.accentText} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick questions
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${t.border}`,
                    background: t.tagBg,
                    color: t.tagText,
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((message) => (
          <div key={message.id} style={{
            display: 'flex',
            flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            gap: '12px',
            alignItems: 'flex-start'
          }}>

            {/* Avatar */}
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '10px',
              background: message.role === 'assistant' ? t.accentSoft : t.userBubble,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {message.role === 'assistant'
                ? <Bot size={16} color={t.accentText} />
                : <User size={16} color="#fff" />
              }
            </div>

            {/* Bubble + sources */}
            <div style={{
              maxWidth: '72%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: message.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                background: message.role === 'user' ? t.userBubble : t.aiBubble,
                color: message.role === 'user' ? t.userText : t.aiText,
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'background 0.3s ease'
              }}>
                {message.text}
              </div>

              {/* Sources panel */}
              {message.sources && message.sources.length > 0 && (
                <div style={{
                  background: t.sourceBg,
                  border: `1px solid ${t.sourceBorder}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: t.accentText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Based on {message.sources.length} feedback entries
                  </p>
                  {message.sources.map((source, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '8px',
                      padding: '4px 0',
                      borderTop: i > 0 ? `1px solid ${t.border}` : 'none'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: t.accentText, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: '12px', color: t.textMuted, lineHeight: '1.5' }}>{source}</span>
                    </div>
                  ))}
                </div>
              )}

              <span style={{ fontSize: '10px', color: t.textMuted, paddingLeft: '4px' }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '10px',
              background: t.accentSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={16} color={t.accentText} />
            </div>
            <div style={{
              padding: '14px 18px',
              borderRadius: '4px 18px 18px 18px',
              background: t.aiBubble,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '11px', color: t.textMuted }}>Analyzing feedback...</span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '7px', height: '7px',
                    borderRadius: '50%',
                    background: t.accentText,
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.7
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: `1px solid ${t.border}`,
        background: t.surface,
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
          background: t.inputBg,
          border: `1px solid ${t.inputBorder}`,
          borderRadius: '14px',
          padding: '10px 10px 10px 16px',
          transition: 'all 0.2s ease'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about student feedback... (Enter to send)"
            rows={1}
            disabled={loading}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: t.text,
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              fontFamily: 'inherit',
              opacity: loading ? 0.5 : 1
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: (!input.trim() || loading) ? t.border : t.accent,
              color: (!input.trim() || loading) ? t.textMuted : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={15} />
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '11px', color: t.textMuted, textAlign: 'center' }}>
          Only answers questions related to student feedback
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default ChatWithAI;