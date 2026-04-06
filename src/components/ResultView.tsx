'use client';

import { GameState } from '@/lib/gameState';
import { useEffect, useState } from 'react';

interface ResultViewProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onNextRound: () => void;
}

export default function ResultView({ gameState, myPlayerId, isHost, onNextRound }: ResultViewProps) {
  const winner = gameState.players.find(p => p.id === gameState.selectedWinner);
  const judge = gameState.players[gameState.currentJudgeIndex];
  const winnerProposal = gameState.proposals.get(gameState.selectedWinner || '');
  const proposalText = winnerProposal?.map(c => c.text).join('') || '';
  const isWinner = gameState.selectedWinner === myPlayerId;
  const [showConfetti, setShowConfetti] = useState(false);
  const isLastRound = gameState.roundNumber >= gameState.maxRounds;

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="result-view animate-fadeIn">
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: ['#e91e8c', '#ffd700', '#9b59b6', '#ff6b9d', '#4ecdc4'][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      <div className="result-header">
        <div className="trophy animate-float">🏆</div>
        <h1>結果発表！</h1>
      </div>

      <div className="winner-section glass-card">
        <div className="winner-badge">
          <span className="crown">👑</span>
          <h2>{judge?.name} が選んだのは...</h2>
        </div>

        <div className="winner-name-section">
          <div className="ring-animation animate-heartbeat">💍</div>
          <h3 className="winner-name">{winner?.name} {isWinner ? '(あなた!)' : ''}</h3>
        </div>

        <div className="winning-proposal">
          <p className="proposal-label">受賞プロポーズ:</p>
          <p className="proposal-text">「{proposalText}」</p>
        </div>

        {isWinner && (
          <div className="congrats">
            🎉 おめでとう！指輪を渡しました！🎉
          </div>
        )}
      </div>

      {/* Current Standings */}
      <div className="standings glass-card">
        <h3>📊 現在の順位</h3>
        <div className="standings-list">
          {gameState.players
            .map(p => ({
              player: p,
              received: gameState.ringsReceived.get(p.id) || 0,
            }))
            .sort((a, b) => b.received - a.received)
            .map((entry, index) => (
              <div
                key={entry.player.id}
                className={`standing-item ${entry.player.id === myPlayerId ? 'is-me' : ''}`}
              >
                <span className="rank">{getRankEmoji(index)}</span>
                <span className="standing-name">{entry.player.name}</span>
                <span className="rings-count">
                  {'💍'.repeat(entry.received)}
                  {entry.received === 0 && <span className="no-rings">-</span>}
                </span>
              </div>
            ))}
        </div>
      </div>

      {isHost && (
        <button className="btn-gold next-round-btn" onClick={onNextRound}>
          {isLastRound ? '🏆 最終結果を見る' : '▶ 次のラウンドへ'}
        </button>
      )}

      {!isHost && (
        <p className="wait-text">
          {isLastRound 
            ? 'ホストが最終結果を表示するのを待っています...' 
            : 'ホストが次のラウンドを開始するのを待っています...'
          }
        </p>
      )}

      <style jsx>{`
        .result-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          width: 100%;
          max-width: 600px;
          padding-top: var(--space-lg);
          padding-bottom: var(--space-3xl);
          position: relative;
        }

        .confetti-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          overflow: hidden;
        }

        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confetti linear forwards;
        }

        .result-header {
          text-align: center;
        }

        .trophy {
          font-size: 4rem;
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
          margin-bottom: var(--space-md);
        }

        .result-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .winner-section {
          width: 100%;
          padding: var(--space-xl);
          text-align: center;
          border-color: rgba(255, 215, 0, 0.3);
        }

        .winner-badge {
          margin-bottom: var(--space-lg);
        }

        .crown {
          font-size: 2rem;
          display: block;
          margin-bottom: var(--space-sm);
        }

        .winner-badge h2 {
          font-size: 1.1rem;
          color: var(--color-text-secondary);
        }

        .winner-name-section {
          margin-bottom: var(--space-lg);
        }

        .ring-animation {
          font-size: 3rem;
          margin-bottom: var(--space-sm);
          filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
        }

        .winner-name {
          font-size: 2rem;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .winning-proposal {
          padding: var(--space-lg);
          background: linear-gradient(135deg, rgba(233, 30, 140, 0.08), rgba(255, 215, 0, 0.08));
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
        }

        .proposal-label {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-bottom: var(--space-sm);
        }

        .proposal-text {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          line-height: 1.8;
        }

        .congrats {
          padding: var(--space-md);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-secondary);
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        .standings {
          width: 100%;
          padding: var(--space-lg);
        }

        .standings h3 {
          margin-bottom: var(--space-md);
          font-size: 1rem;
        }

        .standings-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .standing-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .standing-item.is-me {
          background: rgba(233, 30, 140, 0.1);
        }

        .rank {
          font-size: 1.2rem;
          width: 30px;
          text-align: center;
        }

        .standing-name {
          flex: 1;
          font-weight: 600;
        }

        .rings-count {
          font-size: 1.2rem;
          letter-spacing: 4px;
        }

        .no-rings {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }

        .next-round-btn {
          width: 100%;
          max-width: 300px;
          padding: var(--space-md) var(--space-xl);
          font-size: 1.1rem;
        }

        .wait-text {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function getRankEmoji(index: number): string {
  switch (index) {
    case 0: return '🥇';
    case 1: return '🥈';
    case 2: return '🥉';
    default: return `${index + 1}`;
  }
}
