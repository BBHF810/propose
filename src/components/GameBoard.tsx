'use client';

import { useState, useCallback } from 'react';
import { GameState, WordCard } from '@/lib/gameState';
import { getCategoryColor, getCategoryLabel } from '@/lib/wordCards';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  isJudge: boolean;
  onSubmitProposal: (proposal: WordCard[]) => void;
}

export default function GameBoard({ gameState, myPlayerId, isJudge, onSubmitProposal }: GameBoardProps) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const judge = gameState.players[gameState.currentJudgeIndex];
  const [selectedCards, setSelectedCards] = useState<WordCard[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const hasSubmitted = gameState.proposals.has(myPlayerId) || submitted;

  const handleCardSelect = useCallback((card: WordCard) => {
    if (hasSubmitted) return;
    setSelectedCards(prev => [...prev, card]);
  }, [hasSubmitted]);

  const handleCardRemove = useCallback((index: number) => {
    if (hasSubmitted) return;
    setSelectedCards(prev => prev.filter((_, i) => i !== index));
  }, [hasSubmitted]);

  const handleSubmit = useCallback(() => {
    if (selectedCards.length === 0 || hasSubmitted) return;
    onSubmitProposal(selectedCards);
    setSubmitted(true);
  }, [selectedCards, hasSubmitted, onSubmitProposal]);

  const availableCards = myPlayer?.hand.filter(
    card => !selectedCards.some(sc => sc.id === card.id)
  ) || [];

  // Judge view
  if (isJudge) {
    const submittedCount = gameState.proposals.size;
    const totalPlayers = gameState.players.length - 1;

    return (
      <div className="game-board animate-fadeIn">
        <div className="phase-header">
          <div className="round-badge">Round {gameState.roundNumber}</div>
          <h1>👑 あなたは「親」です</h1>
          <p className="judge-instruction">
            みんながプロポーズを考えています...<br/>
            最高のプロポーズを選んでください！
          </p>
        </div>

        <div className="timer-section">
          <div className="timer-ring">
            <svg viewBox="0 0 120 120" className="timer-svg">
              <circle cx="60" cy="60" r="54" className="timer-bg" />
              <circle
                cx="60" cy="60" r="54"
                className="timer-progress"
                style={{
                  strokeDasharray: `${2 * Math.PI * 54}`,
                  strokeDashoffset: `${2 * Math.PI * 54 * (1 - gameState.timeRemaining / gameState.maxTime)}`,
                }}
              />
            </svg>
            <span className="timer-text">{gameState.timeRemaining}</span>
          </div>
        </div>

        <div className="submission-status glass-card">
          <p>提出状況: {submittedCount} / {totalPlayers}</p>
          <div className="status-bar">
            <div
              className="status-fill"
              style={{ width: `${(submittedCount / totalPlayers) * 100}%` }}
            />
          </div>
        </div>

        <style jsx>{`
          .game-board {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-xl);
            width: 100%;
            max-width: 600px;
            padding-top: var(--space-lg);
          }

          .phase-header {
            text-align: center;
          }

          .round-badge {
            display: inline-block;
            padding: var(--space-xs) var(--space-md);
            background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
            border-radius: var(--radius-full);
            font-size: 0.85rem;
            font-weight: 700;
            margin-bottom: var(--space-md);
            letter-spacing: 0.05em;
          }

          .phase-header h1 {
            font-size: 1.8rem;
            margin-bottom: var(--space-sm);
          }

          .judge-instruction {
            color: var(--color-text-secondary);
            line-height: 1.6;
          }

          .timer-section {
            position: relative;
          }

          .timer-ring {
            position: relative;
            width: 140px;
            height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .timer-svg {
            position: absolute;
            inset: 0;
            transform: rotate(-90deg);
          }

          .timer-bg {
            fill: none;
            stroke: rgba(255, 255, 255, 0.08);
            stroke-width: 6;
          }

          .timer-progress {
            fill: none;
            stroke: ${gameState.timeRemaining <= 10 ? '#ef4444' : 'var(--color-primary)'};
            stroke-width: 6;
            stroke-linecap: round;
            transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
          }

          .timer-text {
            font-family: var(--font-display);
            font-size: 3rem;
            font-weight: 900;
            color: ${gameState.timeRemaining <= 10 ? '#ef4444' : 'var(--color-text)'};
            transition: color 0.3s ease;
          }

          .submission-status {
            padding: var(--space-lg);
            width: 100%;
            text-align: center;
          }

          .submission-status p {
            margin-bottom: var(--space-sm);
            color: var(--color-text-secondary);
          }

          .status-bar {
            height: 8px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-full);
            overflow: hidden;
          }

          .status-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
            border-radius: var(--radius-full);
            transition: width 0.5s ease;
          }
        `}</style>
      </div>
    );
  }

  // Player view
  return (
    <div className="game-board animate-fadeIn">
      <div className="phase-header">
        <div className="round-badge">Round {gameState.roundNumber}</div>
        <h1>💌 プロポーズを作ろう！</h1>
        <p className="judge-info">
          親: <strong>{judge?.name}</strong> に捧げるプロポーズを考えよう！
        </p>
      </div>

      {/* Timer */}
      <div className="timer-section">
        <div className="timer-ring small">
          <svg viewBox="0 0 120 120" className="timer-svg">
            <circle cx="60" cy="60" r="54" className="timer-bg" />
            <circle
              cx="60" cy="60" r="54"
              className="timer-progress"
              style={{
                strokeDasharray: `${2 * Math.PI * 54}`,
                strokeDashoffset: `${2 * Math.PI * 54 * (1 - gameState.timeRemaining / gameState.maxTime)}`,
              }}
            />
          </svg>
          <span className="timer-text">{gameState.timeRemaining}</span>
        </div>
      </div>

      {/* Proposal Area */}
      <div className="proposal-area glass-card">
        <h3>💍 あなたのプロポーズ</h3>
        <div className="proposal-cards">
          {selectedCards.length === 0 ? (
            <p className="empty-proposal">下のカードをタップして文章を作ろう！</p>
          ) : (
            selectedCards.map((card, index) => (
              <button
                key={`${card.id}-${index}`}
                className="proposal-card"
                onClick={() => handleCardRemove(index)}
                disabled={hasSubmitted}
                style={{
                  borderColor: getCategoryColor(card.category),
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <span>{card.text}</span>
                {!hasSubmitted && <span className="remove-icon">✕</span>}
              </button>
            ))
          )}
        </div>
        {selectedCards.length > 0 && (
          <div className="proposal-preview">
            <p className="preview-text">
              「{selectedCards.map(c => c.text).join('')}」
            </p>
          </div>
        )}
        {!hasSubmitted && (
          <button
            className="btn-gold submit-btn"
            onClick={handleSubmit}
            disabled={selectedCards.length === 0}
          >
            💍 プロポーズを確定！
          </button>
        )}
        {hasSubmitted && (
          <div className="submitted-notice">
            ✅ プロポーズを提出しました！発表をお待ちください...
          </div>
        )}
      </div>

      {/* Hand Cards */}
      {!hasSubmitted && (
        <div className="hand-section">
          <h3>🃏 手札</h3>
          <div className="hand-cards">
            {availableCards.map((card, index) => (
              <button
                key={card.id}
                className="hand-card"
                onClick={() => handleCardSelect(card)}
                style={{
                  '--card-color': getCategoryColor(card.category),
                  animationDelay: `${index * 0.05}s`,
                } as React.CSSProperties}
              >
                <span className="card-emoji">{getCategoryLabel(card.category)}</span>
                <span className="card-text">{card.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .game-board {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-lg);
          width: 100%;
          max-width: 600px;
          padding-top: var(--space-md);
          padding-bottom: var(--space-3xl);
        }

        .phase-header {
          text-align: center;
        }

        .round-badge {
          display: inline-block;
          padding: var(--space-xs) var(--space-md);
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: var(--space-sm);
        }

        .phase-header h1 {
          font-size: 1.5rem;
          margin-bottom: var(--space-xs);
        }

        .judge-info {
          color: var(--color-text-secondary);
          font-size: 0.95rem;
        }

        .timer-section {
          position: relative;
        }

        .timer-ring {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timer-svg {
          position: absolute;
          inset: 0;
          transform: rotate(-90deg);
        }

        .timer-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 6;
        }

        .timer-progress {
          fill: none;
          stroke: ${gameState.timeRemaining <= 10 ? '#ef4444' : 'var(--color-primary)'};
          stroke-width: 6;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear;
        }

        .timer-text {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 900;
          color: ${gameState.timeRemaining <= 10 ? '#ef4444' : 'var(--color-text)'};
        }

        .proposal-area {
          width: 100%;
          padding: var(--space-lg);
        }

        .proposal-area h3 {
          font-size: 1rem;
          margin-bottom: var(--space-md);
          color: var(--color-text-secondary);
        }

        .proposal-cards {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
          min-height: 50px;
          padding: var(--space-md);
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
        }

        .empty-proposal {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          width: 100%;
          text-align: center;
          padding: var(--space-md) 0;
        }

        .proposal-card {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid;
          border-radius: var(--radius-sm);
          font-size: 0.95rem;
          color: var(--color-text);
          cursor: pointer;
          transition: all var(--transition-fast);
          animation: fadeIn 0.2s ease both;
        }

        .proposal-card:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .remove-icon {
          font-size: 0.7rem;
          opacity: 0.5;
        }

        .proposal-preview {
          margin-bottom: var(--space-md);
          padding: var(--space-md);
          background: linear-gradient(135deg, rgba(233, 30, 140, 0.1), rgba(255, 215, 0, 0.1));
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .preview-text {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.8;
          background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .submit-btn {
          width: 100%;
          padding: var(--space-md);
          font-size: 1.1rem;
        }

        .submitted-notice {
          text-align: center;
          color: var(--color-secondary);
          font-weight: 600;
          padding: var(--space-md);
          animation: pulse 2s ease-in-out infinite;
        }

        .hand-section {
          width: 100%;
        }

        .hand-section h3 {
          font-size: 1rem;
          margin-bottom: var(--space-md);
          color: var(--color-text-secondary);
        }

        .hand-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: var(--space-sm);
        }

        .hand-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-md);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-normal);
          animation: fadeInUp 0.3s ease both;
          position: relative;
          overflow: hidden;
        }

        .hand-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--card-color);
        }

        .hand-card:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-4px);
          border-color: var(--card-color);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .hand-card:active {
          transform: translateY(-2px);
        }

        .card-emoji {
          font-size: 1.2rem;
        }

        .card-text {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
