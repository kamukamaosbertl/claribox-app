import { useState, useEffect, useRef } from 'react';
import {
  Send,
  RefreshCw,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Check,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';

const WELCOME_MESSAGE = {
  id: 0,
  role: 'assistant',
  text: 'I’m ClariBox AI. Ask me about student feedback, complaints, trends, priorities, or possible solutions.',
  timestamp: new Date(),
};

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
  h2: ({ children }) => <h2 className="mt-4 mb-1 text-sm font-bold text-slate-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-800">{children}</h3>,
};

const ChatWithAI = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [reactions, setReactions] = useState({});

  const messagesEndRef = useRef(null);
  const streamQueueRef = useRef([]);
  const streamTimerRef = useRef(null);

  const getSessionId = () => {
    let id = localStorage.getItem('feedbackSessionId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('feedbackSessionId', id);
    }
    return id;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  const addMessage = (role, text) => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, role, text, timestamp: new Date() }]);
    return id;
  };

  const addStreamingMessage = () => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [
      ...prev,
      { id, role: 'assistant', text: '', streaming: true, timestamp: new Date() },
    ]);
    return id;
  };

  const appendText = (id, text) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, text: message.text + text } : message
      )
    );
  };

  const finalizeMessage = (id) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, streaming: false } : message
      )
    );
  };

  const startSmoothStreaming = (id) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    streamTimerRef.current = setInterval(() => {
      const next = streamQueueRef.current.shift();
      if (next) appendText(id, next);
    }, 16);
  };

  const stopSmoothStreaming = () => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  };

  const send = async (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    setInput('');
    addMessage('user', cleanQuestion);
    setLoading(true);

    const assistantId = addStreamingMessage();
    streamQueueRef.current = [];
    startSmoothStreaming(assistantId);

    try {
      await adminAPI.chatWithAIStream(
        cleanQuestion,
        getSessionId(),
        (chunk) => {
          const pieces = chunk.match(/.{1,3}/g) || [chunk];
          streamQueueRef.current.push(...pieces);
        },
        (error) => {
          streamQueueRef.current.push(error || 'Something went wrong.');
        }
      );

      const waitForQueue = setInterval(() => {
        if (streamQueueRef.current.length === 0) {
          clearInterval(waitForQueue);
          stopSmoothStreaming();
          finalizeMessage(assistantId);
          setLoading(false);
        }
      }, 40);
    } catch {
      stopSmoothStreaming();
      appendText(assistantId, 'Something went wrong. Please try again.');
      finalizeMessage(assistantId);
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('feedbackSessionId');
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setInput('');
    setCopiedId(null);
    setReactions({});
  };

  const handleCopy = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleReaction = (id, type) => {
    setReactions((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleRegenerate = async (assistantMessageId) => {
    const index = messages.findIndex((m) => m.id === assistantMessageId);
    const previousUserMessage = messages[index - 1];

    if (!previousUserMessage || previousUserMessage.role !== 'user') return;

    setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    send(previousUserMessage.text);
  };

  const handleSend = () => send(input);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

const normalizeMarkdown = (text) => {
  if (!text) return text;
  return text
    .replace(/^\*\s*$/gm, '')           // ← ADD: remove empty "* " lines
    .replace(/^-\s*$/gm, '')            // ← ADD: remove empty "- " lines  
    .replace(/^\*\s*/gm, '- ')
    .replace(/^•\s*/gm, '- ')
    .replace(/\.\s*\*\s*(?=[A-Z*])/g, '.\n\n**')
    .replace(/:\s*\*\s*(?=[A-Z*])/g, ':\n\n**')
    .replace(/\*\s+(?=[A-Z])/gm, '\n\n**')
    .replace(/\s\*(?=[A-Z])/g, '\n\n**')
    .replace(/(?<!\n)-\s(?=[A-Z])/gm, '\n- ')
    .replace(/(\.)(\d+\.)\s+/g, '.\n$2 ')
    .replace(/:\s*-\s*/g, ':\n- ')
    .replace(/^\d+\.\s+/gm, (match) => match);
};
  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#F6F8FC]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-sm">
            <Sparkles size={18} />
          </div>

          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-950">
              ClariBox AI
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Student feedback intelligence
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={13} />
          New chat
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const reaction = reactions[message.id];

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  <div
                    className={[
                      'rounded-3xl px-4 py-3 text-sm leading-7',
                      isUser
                        ? 'rounded-br-lg bg-blue-600 text-white'
                        : 'rounded-bl-lg border border-slate-200 bg-white/95 text-slate-800 shadow-sm',
                    ].join(' ')}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : message.streaming ? (
                    <div className="relative">
                      <ReactMarkdown components={markdownComponents}>
                        {normalizeMarkdown(message.text)}
                      </ReactMarkdown>
                      <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-blue-500 align-middle" />
                    </div>
                  ) : (
                    <ReactMarkdown components={markdownComponents}>
                      {normalizeMarkdown(message.text)}
                    </ReactMarkdown>
                  )}

                    <div className={`mt-2 text-[10px] ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {!isUser && message.id !== 0 && !message.streaming && (
                    <div className="flex items-center gap-1 pl-1">
                      <button
                        onClick={() => handleCopy(message.id, message.text)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
                        title="Copy"
                      >
                        {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      <button
                        onClick={() => handleReaction(message.id, 'up')}
                        className={[
                          'rounded-lg p-1.5 transition',
                          reaction === 'up'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-slate-400 hover:bg-white hover:text-slate-700',
                        ].join(' ')}
                        title="Good response"
                      >
                        <ThumbsUp size={14} />
                      </button>

                      <button
                        onClick={() => handleReaction(message.id, 'down')}
                        className={[
                          'rounded-lg p-1.5 transition',
                          reaction === 'down'
                            ? 'bg-red-50 text-red-600'
                            : 'text-slate-400 hover:bg-white hover:text-slate-700',
                        ].join(' ')}
                        title="Bad response"
                      >
                        <ThumbsDown size={14} />
                      </button>

                      <button
                        onClick={() => handleRegenerate(message.id)}
                        disabled={loading}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-40"
                        title="Regenerate"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && messages[messages.length - 1]?.text === '' && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                ClariBox is thinking<span className="animate-pulse">...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ClariBox about feedback, trends, complaints, or priorities..."
            rows={1}
            disabled={loading}
            className="max-h-32 flex-1 resize-none border-none bg-transparent py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Send size={16} />
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-slate-400">
          ClariBox uses your feedback data to answer. Ask clear questions for better insights.
        </p>
      </footer>
    </div>
  );
};

export default ChatWithAI;