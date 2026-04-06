'use client';

import { GameState } from '@/lib/gameState';

interface PresentationViewProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onNextPresenter: () => void;
}

export default function PresentationView({ gameState, myPlayerId, isHost, onNextPresenter }: PresentationViewProps) {
  const presenter = gameState.players[gameState.currentPresenterIndex];
  const judge = gameState.players[gameState.currentJudgeIndex];
  const proposal = gameState.proposals.get(presenter?.id || '');
  const proposalText = proposal?.map(c => c.text).join('') || '(提出なし)';
  const isMyPresentation = presenter?.id === myPlayerId;

  return (
    <div className="presentation animate-fadeIn">
      <div className="phase-header">
        <div className="round-badge">Round {gameState.roundNumber}</div>
        <h1>🎤 プロポーズ発表</h1>
        <p className="judge-label">
          親: <strong>{judge?.name}</strong> への告白
        </p>
      </div>

      <div className="presenter-section glass-card">
        <div className="presenter-name">
          <span className="presenter-icon">{isMyPresentation ? '😍' : '💑'}</span>
          <h2>{presenter?.name}{isMyPresentation ? ' (あなた)' : ''}</h2>
        </div>

        <div className="proposal-display">
          <div className="proposal-text-wrapper">
            <p className="proposal-text">
              「{proposalText}」
            </p>
          </div>
          <div className="proposal-footer">
            <span className="ring-offer animate-heartbeat">💍</span>
            <p className="marry-text">結婚しよう。</p>
          </div>
        </div>
      </div>

      {isHost && (
        <button className="btn-primary next-btn" onClick={onNextPresenter}>
          次の発表へ ▶
        </button>
      )}

      {!isHost && (
        <p className="wait-text">ホストが次に進めるのを待っています...</p>
      )}

      <style jsx>{`
        .presentation {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          width: 100%;
          max-width: 600px;
          padding-top: var(--space-2xl);
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
        }

        .phase-header h1 {
          font-size: 1.8rem;
          margin-bottom: var(--space-sm);
        }

        .judge-label {
          color: var(--color-text-secondary);
        }

        .presenter-section {
          width: 100%;
          padding: var(--space-xl);
          text-align: center;
        }

        .presenter-name {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
        }

        .presenter-icon {
          font-size: 2rem;
        }

        .presenter-name h2 {
          font-size: 1.3rem;
        }

        .proposal-display {
          padding: var(--space-xl);
          background: linear-gradient(135deg, rgba(233, 30, 140, 0.08), rgba(255, 215, 0, 0.08));
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 215, 0, 0.15);
        }

        .proposal-text-wrapper {
          margin-bottom: var(--space-xl);
        }

        .proposal-text {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 2;
          background: linear-gradient(135deg, var(--color-text), var(--color-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInUp 0.8s ease both;
        }

        .proposal-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }

        .ring-offer {
          font-size: 3rem;
          filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
        }

        .marry-text {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--color-secondary);
          letter-spacing: 0.2em;
        }

        .next-btn {
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
