import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Zap, Moon, Sun } from 'lucide-react';
import { adminAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const suggestedQuestions = [
  'What are the top complaints this month?',
  'Show me feedback about library',
  'How many pending feedbacks?',
  'Summarize negative feedback',
  'What should I prioritize?',
  'What is the most common category?',
];

const WELCOME_MESSAGE = {
  id: 0,
  role: 'assistant',
  text: "Hello! I'm your AI feedback assistant 👋\n\nI can help you:\n• Analyze student feedback and complaints\n• Identify trends and patterns\n• Suggest improvements and solutions\n• Answer follow-up questions freely\n\nTry asking:\n• \"What are the main complaints this month?\"\n• \"What should I prioritize fixing?\"\n• \"How many pending feedbacks are there?\"",
  timestamp: new Date(),
};

// ── Markdown renderer ─────────────────────────────────────────────────────
const makeMarkdownComponents = (dark) => ({
  h2: ({ children }) => (
    <h2 style={{ fontSize: '15px', fontWeight: 700, marginTop: '14px', marginBottom: '8px', paddingBottom: '5px', borderBottom: `1px solid ${dark ? 'rgba(96,165,250,0.2)' : 'rgba(37,99,235,0.18)'}`, display: 'block', width: '100%', lineHeight: 1.4 }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <p style={{ fontWeight: 600, fontSize: '13px', marginTop: '10px', marginBottom: '4px', display: 'block' }}>{children}</p>
  ),
  p: ({ children }) => {
    const text = typeof children === 'string' ? children : '';
    const isArrow = text.startsWith('→') || text.startsWith('⚠️');
    return <p style={{ marginBottom: isArrow ? '4px' : '8px', marginTop: isArrow ? '12px' : '0', lineHeight: 1.65 }}>{children}</p>;
  },
  ul: ({ children }) => <ul style={{ listStyleType: 'disc', paddingLeft: '16px', marginBottom: '8px', marginTop: '4px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '16px', marginBottom: '8px', marginTop: '4px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.6, fontSize: '13.5px' }}>{children}</li>,
  strong: ({ children }) => {
    const text = typeof children === 'string' ? children : '';
    const isLabel = text.startsWith('→') || text.startsWith('⚠️') || text.startsWith('Key Concern');
    return (
      <strong style={{ fontWeight: 700, color: isLabel ? (dark ? '#60A5FA' : '#2563EB') : 'inherit', display: isLabel ? 'block' : 'inline', marginTop: isLabel ? '10px' : '0', marginBottom: isLabel ? '3px' : '0' }}>
        {children}
      </strong>
    );
  },
  hr: () => <hr style={{ margin: '8px 0', opacity: 0.15 }} />,
});

// ── Theme tokens ──────────────────────────────────────────────────────────
const t = (dark) => ({
  // Page shell
  pageBg:      dark ? '#0F172A' : '#F4F7FB',
  // Header / input bar
  barBg:       dark ? '#1E293B' : '#FFFFFF',
  barBorder:   dark ? '#334155' : '#E2E8F0',
  barShadow:   dark ? 'none'    : '0 1px 3px rgba(15,23,42,0.04)',
  // Bubble — assistant
  aiBubbleBg:  dark ? '#1E293B' : '#FFFFFF',
  aiBubbleBdr: dark ? '#334155' : '#E2E8F0',
  aiBubbleTxt: dark ? '#E2E8F0' : '#1E293B',
  // Text
  primaryTxt:  dark ? '#F1F5F9' : '#0F172A',
  mutedTxt:    dark ? '#94A3B8' : '#64748B',
  faintTxt:    dark ? '#475569' : '#CBD5E1',
  // Suggestion chips
  chipBg:      dark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
  chipBdr:     dark ? 'rgba(96,165,250,0.25)' : '#DBEAFE',
  chipTxt:     dark ? '#93C5FD'  : '#2563EB',
  chipHover:   dark ? 'rgba(37,99,235,0.28)' : '#DBEAFE',
  // Suggested questions card
  cardBg:      dark ? '#1E293B' : '#FFFFFF',
  cardBdr:     dark ? '#334155' : '#E2E8F0',
  // Input area
  inputBg:     dark ? '#0F172A' : '#F8FAFC',
  inputBdr:    dark ? '#334155' : '#E2E8F0',
  inputTxt:    dark ? '#F1F5F9' : '#0F172A',
  inputPh:     dark ? '#475569' : '#94A3B8',
  // Icon btn
  iconBtnHoverBg: dark ? '#334155' : '#F1F5F9',
  iconBtnHoverTxt:dark ? '#CBD5E1' : '#475569',
  // Toggle btn
  toggleBg:    dark ? '#1E293B' : '#FFFFFF',
  toggleBdr:   dark ? '#334155' : '#E2E8F0',
  toggleTxt:   dark ? '#94A3B8' : '#475569',
  toggleHover: dark ? '#334155' : '#F8FAFC',
});

const ChatWithAI = () => {
  const [messages,  setMessages]  = useState([WELCOME_MESSAGE]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [dark,      setDark]      = useState(false);
  const [reactions, setReactions] = useState({});
  const [copied,    setCopied]    = useState(null);
  const messagesEndRef = useRef(null);
  const theme = t(dark);

  const getSessionId = () => {
    let id = localStorage.getItem('feedbackSessionId');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('feedbackSessionId', id); }
    return id;
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMessage    = (role, text) => { const id = Date.now() + Math.random(); setMessages(prev => [...prev, { id, role, text, timestamp: new Date() }]); return id; };
  const addStreaming   = ()           => { const id = Date.now() + Math.random(); setMessages(prev => [...prev, { id, role: 'assistant', text: '', streaming: true, timestamp: new Date() }]); return id; };
  const appendChunk   = (id, chunk)  => setMessages(prev => prev.map(m => m.id === id ? { ...m, text: m.text + chunk } : m));
  const finalizeMsg   = (id)         => setMessages(prev => prev.map(m => m.id === id ? { ...m, streaming: false } : m));

  const send = async (question) => {
    if (!question.trim() || loading) return;
    setInput('');
    addMessage('user', question);
    setLoading(true);
    const aid = addStreaming();
    try {
      await adminAPI.chatWithAIStream(question, getSessionId(), (c) => appendChunk(aid, c), (e) => appendChunk(aid, e));
    } catch { appendChunk(aid, 'Something went wrong. Please try again.'); }
    finally   { finalizeMsg(aid); setLoading(false); }
  };

  const handleSend     = ()  => send(input);
  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleReset = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setInput(''); setReactions({}); setCopied(null);
    localStorage.removeItem('feedbackSessionId');
  };

  const handleCopy = (id, text) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };
  const handleReaction  = (id, type) => setReactions(prev => ({ ...prev, [id]: prev[id] === type ? null : type }));
  const handleRegenerate = async (msgId) => {
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (!userMsg || userMsg.role !== 'user') return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setLoading(true);
    const aid = addStreaming();
    try {
      await adminAPI.chatWithAIStream(userMsg.text, getSessionId(), (c) => appendChunk(aid, c), (e) => appendChunk(aid, e));
    } catch { appendChunk(aid, 'Something went wrong. Please try again.'); }
    finally   { finalizeMsg(aid); setLoading(false); }
  };

  const IconBtn = ({ onClick, title, disabled, activeType, children }) => {
    const isUp   = activeType === 'up';
    const isDown = activeType === 'down';
    return (
      <button onClick={onClick} title={title} disabled={disabled} style={{
        width: '28px', height: '28px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
        background: isUp ? 'rgba(34,197,94,0.12)' : isDown ? 'rgba(239,68,68,0.10)' : 'transparent',
        color: isUp ? '#16A34A' : isDown ? '#B91C1C' : '#94A3B8',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'all 0.14s ease',
      }}
        onMouseEnter={(e) => { if (!disabled && !activeType) { e.currentTarget.style.background = theme.iconBtnHoverBg; e.currentTarget.style.color = theme.iconBtnHoverTxt; } }}
        onMouseLeave={(e) => { if (!activeType) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; } }}
      >
        {children}
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 6rem)', fontFamily: font,
      borderRadius: '20px', overflow: 'hidden',
      background: theme.pageBg,
      border: `1px solid ${theme.barBorder}`,
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', flexShrink: 0,
        background: theme.barBg, borderBottom: `1px solid ${theme.barBorder}`,
        boxShadow: theme.barShadow, transition: 'background 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.28)',
          }}>
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: theme.primaryTxt, margin: '0 0 3px', letterSpacing: '-0.02em', transition: 'color 0.25s ease' }}>
              AI Feedback Assistant
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 2px rgba(34,197,94,0.2)' }} />
              <span style={{ fontSize: '11px', color: theme.mutedTxt, fontWeight: 500, transition: 'color 0.25s ease' }}>
                Powered by Groq · Llama 3
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 13px', borderRadius: '20px', cursor: 'pointer', fontFamily: font,
              border: `1px solid ${theme.toggleBdr}`,
              background: theme.toggleBg, color: theme.toggleTxt,
              fontSize: '12px', fontWeight: 700, transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.toggleHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.toggleBg; }}
          >
            {dark ? <Sun size={12} /> : <Moon size={12} />}
            {dark ? 'Light' : 'Dark'}
          </button>

          {/* New chat */}
          <button
            onClick={handleReset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 13px', borderRadius: '20px', cursor: 'pointer', fontFamily: font,
              border: `1px solid ${theme.toggleBdr}`,
              background: theme.toggleBg, color: theme.toggleTxt,
              fontSize: '12px', fontWeight: 700, transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#2563EB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.toggleBdr; e.currentTarget.style.color = theme.toggleTxt; }}
          >
            <RefreshCw size={12} /> New chat
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '18px',
        background: theme.pageBg, transition: 'background 0.25s ease',
      }}>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div style={{
            background: theme.cardBg, borderRadius: '16px',
            border: `1px solid ${theme.cardBdr}`, padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'background 0.25s ease, border-color 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Zap size={13} color="#2563EB" />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: theme.mutedTxt, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Quick questions
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i} onClick={() => send(q)}
                  style={{
                    padding: '6px 13px', borderRadius: '20px', cursor: 'pointer', fontFamily: font,
                    background: theme.chipBg, border: `1px solid ${theme.chipBdr}`,
                    fontSize: '12px', fontWeight: 600, color: theme.chipTxt,
                    transition: 'all 0.14s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = theme.chipHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = theme.chipBg; }}
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
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          }}>
            {/* Avatar */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: message.role === 'assistant'
                ? dark ? 'rgba(37,99,235,0.18)' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: message.role === 'assistant' ? `1px solid ${dark ? 'rgba(96,165,250,0.25)' : '#BFDBFE'}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: message.role === 'user' ? '0 3px 8px rgba(37,99,235,0.22)' : 'none',
            }}>
              {message.role === 'assistant'
                ? <Bot size={16} color={dark ? '#60A5FA' : '#2563EB'} />
                : <User size={15} color="#FFFFFF" />
              }
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                padding: '12px 16px', fontSize: '13.5px', lineHeight: '1.65',
                boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                ...(message.role === 'user' ? {
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  borderRadius: '18px 4px 18px 18px',
                  whiteSpace: 'pre-wrap',
                } : {
                  background: theme.aiBubbleBg,
                  color: theme.aiBubbleTxt,
                  borderRadius: '4px 18px 18px 18px',
                  border: `1px solid ${theme.aiBubbleBdr}`,
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                }),
              }}>
                {message.role === 'user' ? (
                  message.text
                ) : message.streaming ? (
                  <span>
                    {message.text}
                    <span style={{
                      display: 'inline-block', width: '2px', height: '16px',
                      marginLeft: '2px', verticalAlign: 'middle',
                      background: dark ? '#60A5FA' : '#2563EB',
                      animation: 'cursorBlink 0.9s ease-in-out infinite',
                    }} />
                  </span>
                ) : (
                  <div style={{ color: theme.aiBubbleTxt }}>
                    <ReactMarkdown components={makeMarkdownComponents(dark)}>{message.text}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Actions */}
              {message.role === 'assistant' && message.id !== 0 && !message.streaming && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingLeft: '4px' }}>
                  <IconBtn onClick={() => handleCopy(message.id, message.text)} title="Copy">
                    {copied === message.id
                      ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </IconBtn>
                  <IconBtn onClick={() => handleReaction(message.id, 'up')} title="Good response" activeType={reactions[message.id] === 'up' ? 'up' : null}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                  </IconBtn>
                  <IconBtn onClick={() => handleReaction(message.id, 'down')} title="Bad response" activeType={reactions[message.id] === 'down' ? 'down' : null}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                  </IconBtn>
                  <IconBtn onClick={() => handleRegenerate(message.id)} title="Regenerate" disabled={loading}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </IconBtn>
                </div>
              )}

              <span style={{ fontSize: '10.5px', color: theme.faintTxt, paddingLeft: '4px', fontWeight: 500, transition: 'color 0.25s ease' }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && messages[messages.length - 1]?.text === '' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: dark ? 'rgba(37,99,235,0.18)' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              border: `1px solid ${dark ? 'rgba(96,165,250,0.25)' : '#BFDBFE'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={16} color={dark ? '#60A5FA' : '#2563EB'} />
            </div>
            <div style={{
              background: theme.aiBubbleBg, border: `1px solid ${theme.aiBubbleBdr}`,
              borderRadius: '4px 18px 18px 18px', padding: '12px 16px',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)', transition: 'background 0.25s ease',
            }}>
              <span style={{ fontSize: '11.5px', color: theme.mutedTxt, display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Analyzing feedback…
              </span>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: dark ? '#60A5FA' : '#2563EB', opacity: 0.7,
                    animation: `bounce 1s ease-in-out ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 18px 16px', flexShrink: 0,
        background: theme.barBg, borderTop: `1px solid ${theme.barBorder}`,
        boxShadow: dark ? 'none' : '0 -1px 3px rgba(15,23,42,0.03)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          background: theme.inputBg, border: `1px solid ${theme.inputBdr}`,
          borderRadius: '14px', padding: '10px 12px',
          transition: 'all 0.15s ease',
        }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.background = dark ? '#1E293B' : '#FFFFFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
          onBlurCapture={(e)  => { e.currentTarget.style.borderColor = theme.inputBdr; e.currentTarget.style.background = theme.inputBg; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about student feedback…"
            rows={1}
            disabled={loading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', fontSize: '13.5px', color: theme.inputTxt,
              fontFamily: font, lineHeight: '1.6', opacity: loading ? 0.5 : 1,
              transition: 'color 0.25s ease',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: !input.trim() || loading
                ? dark ? '#334155' : '#E2E8F0'
                : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: !input.trim() || loading ? (dark ? '#475569' : '#94A3B8') : '#FFFFFF',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              boxShadow: !input.trim() || loading ? 'none' : '0 4px 10px rgba(37,99,235,0.25)',
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(e) => { if (input.trim() && !loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.32)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = !input.trim() || loading ? 'none' : '0 4px 10px rgba(37,99,235,0.25)'; }}
          >
            <Send size={15} />
          </button>
        </div>
        <p style={{ fontSize: '11px', color: theme.faintTxt, textAlign: 'center', margin: '8px 0 0', fontWeight: 500, transition: 'color 0.25s ease' }}>
          Ask follow-up questions freely — I remember the conversation
        </p>
      </div>

      <style>{`
        @keyframes bounce      { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default ChatWithAI;