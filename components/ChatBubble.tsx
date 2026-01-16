
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import hljs from 'highlight.js';

interface ChatBubbleProps {
  message: Message;
  onTimestampClick?: (seconds: number) => void;
}

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const isDiff = language === 'diff';

  useEffect(() => {
    if (codeRef.current) {
        codeRef.current.removeAttribute('data-highlighted');
        hljs.highlightElement(codeRef.current);
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleDownloadPatch = () => {
      const blob = new Blob([code], { type: 'text/x-diff' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fix-${Date.now()}.patch`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className={`relative group my-3 rounded-xl overflow-hidden border shadow-sm ${isDiff ? 'border-warning/40 bg-[#1e293b]' : 'border-border-subtle bg-elevated-1'}`}>
      <div className={`flex justify-between items-center px-3 py-2 border-b backdrop-blur-sm ${isDiff ? 'bg-warning/10 border-warning/30' : 'bg-base/50 border-border-subtle'}`}>
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-error/20 border border-error/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-warning/20 border border-warning/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-success/20 border border-success/50"></div>
            </div>
            {isDiff && <span className="text-xs text-warning font-mono ml-2 font-bold">PATCH / DIFF</span>}
        </div>
        
        <div className="flex gap-2">
            {isDiff && (
                <button
                    onClick={handleDownloadPatch}
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-warning/20 transition-colors text-xs text-warning hover:text-white border border-transparent hover:border-warning/30"
                    title="تحميل ملف التصحيح (.patch)"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>تحميل Patch</span>
                </button>
            )}
            <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-base transition-colors text-xs text-text-secondary hover:text-white"
            title="نسخ الكود"
            >
            {copied ? (
                <>
                <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-success font-medium">تم النسخ</span>
                </>
            ) : (
                <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span>نسخ</span>
                </>
            )}
            </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar" dir="ltr">
        <pre className="text-sm font-mono leading-relaxed">
          <code ref={codeRef} className={`bg-transparent ${language ? `language-${language}` : ''}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onTimestampClick }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  const parseTimestamps = (text: string) => {
     const regex = /(\[(?:\d{1,2}:)?\d{1,2}:\d{2}\])/g;
     const parts = text.split(regex);

     return parts.map((part, index) => {
        if (regex.test(part)) {
            const timeStr = part.replace('[', '').replace(']', '');
            const timeParts = timeStr.split(':').map(Number);
            let seconds = 0;
            if (timeParts.length === 3) {
                seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            } else if (timeParts.length === 2) {
                seconds = timeParts[0] * 60 + timeParts[1];
            }

            return (
                <button 
                    key={index}
                    onClick={() => onTimestampClick?.(seconds)}
                    className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-secondary/10 text-secondary hover:text-white hover:bg-secondary transition-colors font-mono text-xs cursor-pointer border border-secondary/30"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {timeStr}
                </button>
            );
        }
        return part;
     });
  };

  const formatContent = (text: string) => {
    return text.split(/(```[\s\S]*?```)/g).map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/^```(\w+)?\n/);
        const language = match ? match[1] : undefined;
        const content = part.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
        return <CodeBlock key={index} code={content} language={language} />;
      }
      
      return (
        <span key={index} className="whitespace-pre-wrap">
          {onTimestampClick ? parseTimestamps(part) : part}
        </span>
      );
    });
  };

  if (isSystem) {
    return (
        <div className="flex w-full mb-6 justify-center animate-fade-in">
            <div className="bg-surface border border-border-subtle text-text-secondary text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                {message.content}
            </div>
        </div>
    );
  }

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-start' : 'justify-end'} animate-slide-up`}>
        {!isUser && (
            <div className="hidden md:flex flex-shrink-0 ml-3 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 items-center justify-center shadow-lg shadow-glow-primary text-tertiary">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
        )}
      <div
        className={`relative max-w-[90%] md:max-w-[75%] px-6 py-4 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-primary text-white rounded-br-sm shadow-glow-primary border border-primary/50'
            : 'bg-surface backdrop-blur-sm text-text-primary rounded-bl-sm border border-border-subtle shadow-glass'
        }`}
      >
        <div className={`text-[15px] leading-7 tracking-wide ${isUser ? 'font-medium' : 'font-normal'}`} dir="auto">
           {isUser ? message.content : formatContent(message.content)}
        </div>
        <div className={`text-[10px] mt-2 opacity-60 flex items-center gap-1 ${isUser ? 'text-blue-100 justify-end' : 'text-text-secondary justify-start'}`}>
          {isUser && <span>أنت</span>}
          {!isUser && <span>AI</span>}
          <span>•</span>
          {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
