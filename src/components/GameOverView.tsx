'use client';

import { GameState } from '@/lib/gameState';
import { getScores } from '@/lib/gameLogic';
import { useEffect, useState } from 'react';

interface GameOverViewProps {
  gameState: GameState;
  myPlayerId: string;
  onBackToTop: () => void;
}

export default function GameOverView({ gameState, myPlayerId, onBackToTop }: GameOverViewProps) {
  const scores = getScores(gameState);
  const winner = scores[0];
  const isWinner = winner?.player.id === myPlayerId;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="gameover animate-fadeIn">
      {/* Grand confetti */}
      <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              backgroundColor: ['#e91e8c', '#ffd700', '#9b59b6', '#ff6b9d', '#4ecdc4', '#ff4daa'][Math.floor(Math.random() * 6)],
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
            }}
          />
        ))}
      </div>

      <div className="gameover-header">
        <div className="grand-ring animate-float">💍</div>
        <h1>ゲーム終了！</h1>
        <p className="final-label">最終結果</p>
      </div>

      {revealed && (
        <>
          <div className="champion-section glass-card animate-fadeInUp">
            <div className="champion-crown">👑</div>
            <h2 className="champion-title">
              {isWinner ? '🎉 あなたの勝利！ 🎉' : '優勝'}
            </h2>
            <div className="champion-name">
              {winner?.player.name}
            </div>
            <div className="champion-score">
              💍 × {winner?.ringsReceived}
            </div>
          </div>

          <div className="final-standings glass-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <h3>🏆 最終順位</h3>
            <div className="standings-list">
              {scores.map((entry, index) => (
                <div
                  key={entry.player.id}
                  className={`standing-item ${entry.player.id === myPlayerId ? 'is-me' : ''} ${index === 0 ? 'is-winner' : ''}`}
                  style={{ animationDelay: `${0.5 + index * 0.15}s` }}
                >
                  <span className="rank">{getRankEmoji(index)}</span>
                  <div className="standing-info">
                    <span className="standing-name">
                      {entry.player.name}
                      {entry.player.id === myPlayerId && <span className="me-tag"> (あなた)</span>}
                    </span>
                  </div>
                  <div className="standing-scores">
                    <span className="rings-received" title="もらった指輪">
                      💍×{entry.ringsReceived}
                    </span>
                    <span className="rings-remaining" title="残りの指輪">
                      (残: {entry.ringsRemaining})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="gameover-actions animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
        <button className="btn-primary large-btn" onClick={onBackToTop}>
          🏠 トップに戻る
        </button>
      </div>

      <style jsx>{`
        .gameover {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          width: 100%;
          max-width: 600px;
          padding-top: var(--space-2xl);
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
          top: -20px;
          border-radius: 2px;
          animation: confetti linear infinite;
        }

        .gameover-header {
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .grand-ring {
          font-size: 5rem;
          filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.6));
          margin-bottom: var(--space-md);
        }

        .gameover-header h1 {
          font-size: 2.5rem;
          margin-bottom: var(--space-sm);
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary), var(--color-secondary));
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s infinite;
        }

        .final-label {
          font-size: 1rem;
          color: var(--color-text-muted);
          letter-spacing: 0.3em;
        }

        .champion-section {
          width: 100%;
          padding: var(--space-2xl);
          text-align: center;
          position: relative;
          overflow: hidden;
          border-color: rgba(255, 215, 0, 0.3);
        }

        .champion-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(233, 30, 140, 0.05));
          z-index: 0;
        }

        .champion-crown {
          font-size: 3rem;
          margin-bottom: var(--space-md);
          position: relative;
          z-index: 1;
          animation: heartbeat 2s ease-in-out infinite;
        }

        .champion-title {
          font-size: 1.3rem;
          color: var(--color-secondary);
          margin-bottom: var(--space-md);
          position: relative;
          z-index: 1;
        }

        .champion-name {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: var(--space-md);
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .champion-score {
          font-size: 1.5rem;
          position: relative;
          z-index: 1;
          color: var(--color-secondary);
        }

        .final-standings {
          width: 100%;
          padding: var(--space-xl);
        }

        .final-standings h3 {
          margin-bottom: var(--space-lg);
          font-size: 1.1rem;
          text-align: center;
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
          padding: var(--space-md) var(--space-lg);
          border-radius: var(--radius-md);
          animation: fadeInUp 0.5s ease both;
          transition: all var(--transition-normal);
        }

        .standing-item.is-me {
          background: rgba(233, 30, 140, 0.1);
          border: 1px solid rgba(233, 30, 140, 0.2);
        }

        .standing-item.is-winner {
          background: rgba(255, 215, 0, 0.08);
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .rank {
          font-size: 1.5rem;
          width: 40px;
          text-align: center;
          flex-shrink: 0;
        }

        .standing-info {
          flex: 1;
        }

        .standing-name {
          font-weight: 700;
          font-size: 1.05rem;
        }

        .me-tag {
          color: var(--color-primary);
          font-size: 0.85rem;
        }

        .standing-scores {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .rings-received {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-secondary);
        }

        .rings-remaining {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .gameover-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .large-btn {
          width: 100%;
          padding: var(--space-lg);
          font-size: 1.2rem;
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
