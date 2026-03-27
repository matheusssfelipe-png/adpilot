'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { mockCampaigns } from '@/lib/mock-data';
import { useAdAccount } from '@/lib/AdAccountContext';
import { FiSend, FiMic, FiMicOff, FiZap, FiAlertCircle, FiCheck } from 'react-icons/fi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  isVoice?: boolean;
}

interface ChatAction {
  type: string;
  campaignId?: string;
  campaignName?: string;
  platform?: string;
  params?: any;
  executed?: boolean;
}

// Simple markdown-like rendering
function renderContent(text: string) {
  const parts = text.split(/(```action[\s\S]*?```)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('```action')) {
      return null;
    }
    
    const lines = part.split('\n');
    const elements: React.JSX.Element[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    
    lines.forEach((line, lineIdx) => {
      const key = `${i}-${lineIdx}`;
      
      if (line.trim().startsWith('|')) {
        if (!inTable) { inTable = true; tableRows = []; }
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        if (!line.includes('---')) {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        inTable = false;
        elements.push(
          <div key={`table-${key}`} className="table-container" style={{ marginBottom: 12, fontSize: 13 }}>
            <table>
              <thead><tr>{tableRows[0]?.map((h, hi) => <th key={hi}>{h}</th>)}</tr></thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      
      if (line.startsWith('## ')) {
        elements.push(<h3 key={key} style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 8px', color: 'var(--text-primary)' }}>{parseBold(line.slice(3))}</h3>);
        return;
      }
      
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        elements.push(<p key={key} style={{ fontWeight: 700, margin: '12px 0 4px' }}>{parseBold(line)}</p>);
        return;
      }
      
      if (line.trim().startsWith('>')) {
        elements.push(
          <blockquote key={key} style={{
            borderLeft: '3px solid var(--accent-primary)',
            paddingLeft: 12, margin: '8px 0',
            color: 'var(--text-secondary)', fontStyle: 'italic',
          }}>{parseBold(line.slice(line.indexOf('>') + 1).trim())}</blockquote>
        );
        return;
      }
      
      if (line.trim().match(/^[-*•]\s/) || line.trim().match(/^\d+\.\s/)) {
        elements.push(
          <div key={key} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 4 }}>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>•</span>
            <span>{parseBold(line.replace(/^[\s]*[-*•]\s|^\s*\d+\.\s/, ''))}</span>
          </div>
        );
        return;
      }
      
      if (!line.trim()) {
        elements.push(<div key={key} style={{ height: 8 }} />);
        return;
      }
      
      elements.push(<p key={key} style={{ margin: '4px 0', lineHeight: 1.7 }}>{parseBold(line)}</p>);
    });
    
    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key={`table-end-${i}`} className="table-container" style={{ marginBottom: 12, fontSize: 13 }}>
          <table>
            <thead><tr>{tableRows[0]?.map((h, hi) => <th key={hi}>{h}</th>)}</tr></thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return <div key={i}>{elements}</div>;
  });
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function ChatPage() {
  const { selectedAccount } = useAdAccount();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Olá! Sou o AdPilot AI**, seu gestor de tráfego inteligente!\n\nPosso te ajudar com:\n\n🎯 **Gerenciar Campanhas** — pausar, ativar, criar, duplicar\n💰 **Ajustar Orçamentos** — otimizar alocação de verba\n📊 **Analisar Performance** — insights e métricas detalhadas\n✍️ **Gerar Copies** — textos para Meta e Google Ads\n🎨 **Ideias de Criativos** — ângulos e conceitos visuais\n\n🎙️ Você também pode usar o **microfone** para falar comigo por voz!\n\n**Como posso te ajudar?** 🚀`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'pt-BR' | 'en-US'>('pt-BR');
  const [interimTranscript, setInterimTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get campaigns for current account
  const accountCampaigns = selectedAccount
    ? mockCampaigns.filter(c => c.accountId === selectedAccount.id)
    : mockCampaigns;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLang;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      if (final) {
        setInput(prev => (prev + ' ' + final).trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    return recognition;
  }, [voiceLang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } else {
        alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
      }
    }
  };

  const sendMessage = async (content?: string) => {
    const messageText = content || input.trim();
    if (!messageText || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      isVoice: !!content,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content,
          })),
          campaignsContext: accountCampaigns,
          accountContext: selectedAccount ? {
            id: selectedAccount.id,
            name: selectedAccount.name,
            platform: selectedAccount.platform,
            businessName: selectedAccount.businessName,
          } : null,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Desculpe, ocorreu um erro.',
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Erro ao se comunicar com o servidor. Tente novamente.',
        timestamp: new Date(),
      }]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const executeAction = (messageId: string, actionIdx: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId || !msg.actions) return msg;
      const actions = [...msg.actions];
      actions[actionIdx] = { ...actions[actionIdx], executed: true };
      return { ...msg, actions };
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    '📊 Como estão minhas campanhas?',
    '💰 Análise de orçamento',
    '✍️ Gere copies para campanha',
    '🆕 Criar nova campanha',
  ];

  return (
    <>
      <Header title="Chat IA" subtitle="Seu gestor de tráfego inteligente" />
      <div className="chat-container">
        {/* Account badge */}
        {selectedAccount && (
          <div className="chat-account-badge">
            <span className={`badge ${selectedAccount.platform === 'meta' ? 'badge-meta' : 'badge-google'}`} style={{ fontSize: 10, padding: '1px 6px' }}>
              {selectedAccount.platform === 'meta' ? 'Meta' : 'Google'}
            </span>
            <span>Analisando: <strong>{selectedAccount.name}</strong></span>
            <span style={{ color: 'var(--text-tertiary)' }}>• {accountCampaigns.length} campanhas</span>
          </div>
        )}

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-msg-row ${msg.role === 'user' ? 'user' : ''}`}>
              {/* Avatar */}
              <div className={`chat-avatar ${msg.role === 'assistant' ? 'ai' : 'human'}`}>
                {msg.role === 'assistant' ? <FiZap size={18} /> : 'U'}
              </div>

              {/* Content */}
              <div className={`chat-bubble ${msg.role === 'user' ? 'user' : ''}`}>
                {msg.isVoice && (
                  <div className="chat-voice-badge">
                    <FiMic size={10} /> Mensagem de voz
                  </div>
                )}
                
                <div>{renderContent(msg.content)}</div>

                {/* Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="chat-action-block">
                    <div className="chat-action-label">
                      <FiAlertCircle size={12} /> Ação Detectada
                    </div>
                    {msg.actions.map((action, idx) => (
                      <div key={idx} className="chat-action-item">
                        <div>
                          <span className="chat-action-name">
                            {action.type.replace(/_/g, ' ')} — {action.campaignName}
                          </span>
                          <span className={`badge ${action.platform === 'meta' ? 'badge-meta' : 'badge-google'}`} style={{ marginLeft: 8 }}>
                            {action.platform === 'meta' ? 'Meta' : 'Google'}
                          </span>
                        </div>
                        <button
                          className={`btn btn-sm ${action.executed ? 'btn-success' : 'btn-primary'}`}
                          onClick={() => executeAction(msg.id, idx)}
                          disabled={action.executed}
                        >
                          {action.executed ? <><FiCheck size={12} /> Executado</> : 'Executar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="chat-bubble-time">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="chat-loading">
              <div className="chat-avatar ai">
                <FiZap size={18} />
              </div>
              <div className="chat-loading-bubble">
                <div className="spinner" />
                <span className="text-sm text-secondary">Analisando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="chat-quick-prompts">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                className="btn btn-secondary"
                onClick={() => sendMessage(prompt.replace(/^[^\s]+\s/, ''))}
                style={{ fontSize: 13 }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Interim transcript display */}
        {interimTranscript && (
          <div className="chat-interim">
            <FiMic size={14} color="var(--danger)" className="pulse" />
            <em>{interimTranscript}</em>
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="chat-input-bar">
            {/* Language toggle for voice */}
            <button
              className="btn btn-sm"
              onClick={() => setVoiceLang(prev => prev === 'pt-BR' ? 'en-US' : 'pt-BR')}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 8px', minWidth: 44,
                background: 'var(--bg-glass)', color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
              }}
              title={`Idioma de voz: ${voiceLang === 'pt-BR' ? 'Português' : 'English'}`}
            >
              {voiceLang === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
            </button>

            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Ouvindo...' : 'Digite sua mensagem ou use o microfone...'}
              disabled={isLoading}
            />

            {/* Voice Button */}
            <button
              className={`btn btn-icon ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleListening}
              style={{
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                width: 40, height: 40,
              }}
              title={isListening ? 'Parar de ouvir' : 'Ativar microfone'}
            >
              {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
              {isListening && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--danger)',
                  animation: 'pulse 1s infinite',
                }} />
              )}
            </button>

            {/* Send Button */}
            <button
              className="btn btn-primary btn-icon"
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !isListening) || isLoading}
              style={{ borderRadius: 'var(--radius-md)', width: 40, height: 40 }}
            >
              <FiSend size={18} />
            </button>
          </div>

          <div className="chat-footer-hints">
            <span className="chat-footer-hint">
              💡 Dica: Use o microfone 🎙️ para comandos por voz
            </span>
            <span className="chat-footer-hint">
              🌐 {voiceLang === 'pt-BR' ? 'Português BR' : 'English US'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
