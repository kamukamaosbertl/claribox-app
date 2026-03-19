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
  text: "Hello! I'm your AI feedback assistant 👋\n\nI can help you:\n• Analyze student feedback and complaints\n• Identify trends and patterns\n• Suggest improvements and solutions\n• Answer follow-up questions freely\n\nTry asking:\n• \"What are the main complaints this month?\"\n• \"What should I prioritize fixing?\"\n• \"How many pending feedbacks are there?\"",
  timestamp: new Date()
};

const ChatWithAI = () => {
  const [messages,  setMessages]  = useState([WELCOME_MESSAGE]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [dark,      setDark]      = useState(false);
  const [reactions, setReactions] = useState({});
  const [copied,    setCopied]    = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role, text,
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
      // Build conversation history from past messages
      // Pairs up user questions with assistant answers
      const history = messages
        .filter(m => m.id !== 0)
        .reduce((acc, msg, i, arr) => {
          if (msg.role === 'user') {
            const next = arr[i + 1];
            if (next && next.role === 'assistant') {
              acc.push({ question: msg.text, answer: next.text });
            }
          }
          return acc;
        }, []);

      const response = await adminAPI.chatWithAI(question, history);
      const data = response.data;
      addMessage('assistant', data.answer || 'I could not find an answer. Please try again.');
    } catch (err) {
      addMessage('assistant', err.response?.data?.message || 'Something went wrong. Please try again.');
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
    setReactions({});
    setCopied(null);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReaction = (id, type) => {
    setReactions(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type
    }));
  };

  const handleRegenerate = async (messageId) => {
    // Find the user message before this assistant message
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex <= 0) return;
    const userMsg = messages[msgIndex - 1];
    if (!userMsg || userMsg.role !== 'user') return;

    // Remove the old assistant message
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setLoading(true);

    try {
      const history = messages
        .slice(0, msgIndex - 1)
        .filter(m => m.id !== 0)
        .reduce((acc, msg, i, arr) => {
          if (msg.role === 'user') {
            const next = arr[i + 1];
            if (next && next.role === 'assistant') {
              acc.push({ question: msg.text, answer: next.text });
            }
          }
          return acc;
        }, []);

      const response = await adminAPI.chatWithAI(userMsg.text, history);
      const data = response.data;
      addMessage('assistant', data.answer || 'I could not find an answer. Please try again.');
    } catch (err) {
      addMessage('assistant', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden transition-colors duration-300 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}
      style={{ height: 'calc(100vh - 6rem)' }}
    >

      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300
        ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>

        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-indigo-900' : 'bg-indigo-50'}`}>
            <Sparkles size={18} className={dark ? 'text-indigo-300' : 'text-indigo-600'} />
          </div>
          <div>
            <h2 className={`text-sm font-bold leading-none mb-1 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
              AI Feedback Assistant
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
                Powered by Groq · Llama 3
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer
              ${dark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {dark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer
              ${dark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-6 flex flex-col gap-5 transition-colors duration-300
        ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>

        {/* Suggested questions — only show at start */}
        {messages.length <= 1 && (
          <div className={`rounded-2xl p-5 border transition-colors ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-3.5 h-3.5 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
                Quick questions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer
                    ${dark ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((message) => (
          <div key={message.id}
            className={`flex gap-3 items-start ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
              ${message.role === 'assistant'
                ? dark ? 'bg-indigo-900' : 'bg-indigo-50'
                : 'bg-indigo-600'
              }`}>
              {message.role === 'assistant'
                ? <Bot className={`w-4 h-4 ${dark ? 'text-indigo-300' : 'text-indigo-600'}`} />
                : <User className="w-4 h-4 text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] flex flex-col gap-1.5 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                ${message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-[18px_4px_18px_18px]'
                  : dark
                    ? 'bg-slate-800 text-slate-100 rounded-[4px_18px_18px_18px]'
                    : 'bg-white text-slate-800 rounded-[4px_18px_18px_18px]'
                }`}>
                {message.text}
              </div>
              {/* Action buttons — only on assistant messages, not welcome message */}
              {message.role === 'assistant' && message.id !== 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(message.id, message.text)}
                    title="Copy"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer
                      ${dark ? 'bg-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                  >
                    {copied === message.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  {/* Thumbs up */}
                  <button
                    onClick={() => handleReaction(message.id, 'up')}
                    title="Good response"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer
                      ${reactions[message.id] === 'up'
                        ? 'bg-green-100 text-green-600'
                        : dark ? 'bg-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>

                  {/* Thumbs down */}
                  <button
                    onClick={() => handleReaction(message.id, 'down')}
                    title="Bad response"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer
                      ${reactions[message.id] === 'down'
                        ? 'bg-red-100 text-red-500'
                        : dark ? 'bg-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={() => handleRegenerate(message.id)}
                    title="Regenerate response"
                    disabled={loading}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer
                      ${loading ? 'opacity-40 cursor-not-allowed' : ''}
                      ${dark ? 'bg-transparent text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              )}

              <span className={`text-xs px-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? 'bg-indigo-900' : 'bg-indigo-50'}`}>
              <Bot className={`w-4 h-4 ${dark ? 'text-indigo-300' : 'text-indigo-600'}`} />
            </div>
            <div className={`px-4 py-3 rounded-[4px_18px_18px_18px] flex flex-col gap-1.5 ${dark ? 'bg-slate-800' : 'bg-white'}`}>
              <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Analyzing feedback...</span>
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i}
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${dark ? 'bg-indigo-400' : 'bg-indigo-500'}`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`px-6 pt-4 pb-5 border-t transition-colors duration-300
        ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className={`flex gap-2.5 items-end rounded-2xl px-4 py-2.5 border transition-colors
          ${dark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about student feedback..."
            rows={1}
            disabled={loading}
            className={`flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed
              ${dark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}
              ${loading ? 'opacity-50' : ''}`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-none transition-all cursor-pointer
              ${!input.trim() || loading
                ? dark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:-translate-y-0.5 hover:bg-indigo-500'
              }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className={`text-xs text-center mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Ask follow-up questions freely — I remember the conversation
        </p>
      </div>

    </div>
  );
};

export default ChatWithAI;