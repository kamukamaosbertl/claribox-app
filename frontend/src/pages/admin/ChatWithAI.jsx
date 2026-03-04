import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const ChatWithAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      text: 'Hello! I\'m your AI assistant. You can ask me anything about the feedback submitted by students. For example:\n\n• "What are the main complaints this month?"\n• "Show me all feedback about WiFi"\n• "What should I prioritize?"\n• "Summarize all feedback from last week"\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const response = await adminAPI.chatWithAI(input, history);
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.answer || response.message || 'I couldn\'t find an answer. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const suggestedQuestions = [
    'What are the top complaints this month?',
    'Show me all feedback about library',
    'What should I prioritize?',
    'Summarize all feedback from this week'
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Assistant
          </h1>
          <p className="text-gray-600">Ask me anything about student feedback</p>
        </div>
        <button
          onClick={() => setMessages([{
            id: 0,
            role: 'assistant',
            text: 'Hello! I\'m your AI assistant. How can I help you today?',
            timestamp: new Date()
          }])}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant' ? 'bg-purple-100' : 'bg-primary-100'
              }`}>
                {message.role === 'assistant' ? (
                  <Bot className="w-5 h-5 text-purple-600" />
                ) : (
                  <User className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'assistant' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-primary-600 text-white'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about feedback..."
              rows={1}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;