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
  text: "Hello! I'm your AI assistant. I can only answer questions related to student feedback.\n\nFor example:\n• \"What are the main complaints this month?\"\n• \"Show me feedback about facilities\"\n• \"How many pending feedbacks are there?\"\n• \"What should I prioritize?\"\n\nHow can I help you today?",
  timestamp: new Date()
};

const ChatWithAI = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [dark,     setDark]     = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, text, sources = null) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role, text, sources,
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
      addMessage('assistant', err.response?.data?.message || 'Something went wrong. Make sure Ollama is running.');
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

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden transition-colors duration-300 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}
      style={{ height: 'calc(100vh - 6rem)' }}
    >

      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300
        ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>

        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-indigo-900' : 'bg-indigo-50'}`}>
            <Sparkles className={`w-4.5 h-4.5 ${dark ? 'text-indigo-300' : 'text-indigo-600'}`} size={18} />
          </div>
          <div>
            <h2 className={`text-sm font-bold leading-none mb-1 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
              AI Feedback Assistant
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Powered by Ollama · phi3</span>
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

        {/* Suggested questions */}
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

        {/* Messages */}
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
            <div className={`max-w-[72%] flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                ${message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-[18px_4px_18px_18px]'
                  : dark
                    ? 'bg-slate-800 text-slate-100 rounded-[4px_18px_18px_18px]'
                    : 'bg-white text-slate-800 rounded-[4px_18px_18px_18px]'
                }`}>
                {message.text}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className={`rounded-xl px-4 py-3 w-full border
                  ${dark ? 'bg-slate-800/80 border-indigo-900' : 'bg-indigo-50/80 border-indigo-100'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                    Based on {message.sources.length} feedback entries
                  </p>
                  {message.sources.map((source, i) => (
                    <div key={i} className={`flex gap-2 py-1 ${i > 0 ? `border-t ${dark ? 'border-slate-700' : 'border-indigo-100'}` : ''}`}>
                      <span className={`text-xs font-bold flex-shrink-0 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`}>{i + 1}.</span>
                      <span className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{source}</span>
                    </div>
                  ))}
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
            placeholder="Ask about student feedback... (Enter to send)"
            rows={1}
            disabled={loading}
            className={`flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed font-inherit
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
          Only answers questions related to student feedback
        </p>
      </div>

    </div>
  );
};

export default ChatWithAI;