'use client';

import { GameState } from '@/lib/gameState';

interface JudgeViewProps {
  gameState: GameState;
  myPlayerId: string;
  isJudge: boolean;
  isHost: boolean;
  onSelectWinner: (winnerId: string) => void;
}

export default function JudgeView({ gameState, myPlayerId, isJudge, isHost, onSelectWinner }: JudgeViewProps) {
  const judge = gameState.players[gameState.currentJudgeIndex];
  const nonJudgePlayers = gameState.players.filter((_, i) => i !== gameState.currentJudgeIndex);

  return (
    <div className="judge-view animate-fadeIn">
      <div className="phase-header">
        <div className="round-badge">Round {gameState.roundNumber}</div>
        <h1>{isJudge ? '👑 最高のプロポーズを選ぼう！' : '⏳ 審査中...'}</h1>
        <p className="sub-text">
          {isJudge 
            ? 'あなたのハートに響いたプロポーズを選んでください' 
            : `${judge?.name} が最高のプロポーズを選んでいます...`
          }
        </p>
      </div>

      <div className="proposals-list">
        {nonJudgePlayers.map((player, index) => {
          const proposal = gameState.proposals.get(player.id);
          const proposalText = proposal?.map(c => c.text).join('') || '(提出なし)';

          return (
            <div
              key={player.id}
              className={`proposal-item glass-card ${player.id === myPlayerId ? 'is-mine' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="proposal-header">
                <span className="proposer-name">{player.name}</span>
                {player.id === myPlayerId && <span className="me-tag">あなた</span>}
              </div>
              <p className="proposal-content">
                「{proposalText}」
              </p>
              {isJudge && proposal && proposal.length > 0 && (
                <button
                  className="btn-primary select-btn"
                  onClick={() => onSelectWinner(player.id)}
                >
                  💍 この人に決めた！
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!isJudge && !isHost && (
        <p className="wait-notice">結果をお待ちください...</p>
      )}

      <style jsx>{`
        .judge-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          width: 100%;
          max-width: 600px;
          padding-top: var(--space-lg);
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
          margin-bottom: var(--space-md);
        }

        .phase-header h1 {
          font-size: 1.5rem;
          margin-bottom: var(--space-sm);
        }

        .sub-text {
          color: var(--color-text-secondary);
          font-size: 0.95rem;
        }

        .proposals-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          width: 100%;
        }

        .proposal-item {
          padding: var(--space-lg);
          animation: fadeInUp 0.5s ease both;
          transition: all var(--transition-normal);
        }

        .proposal-item.is-mine {
          border-color: var(--color-primary);
          background: rgba(233, 30, 140, 0.08);
        }

        .proposal-item:hover {
          background: var(--glass-bg-hover);
        }

        .proposal-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .proposer-name {
          font-weight: 700;
          font-size: 1rem;
        }

        .me-tag {
          font-size: 0.7rem;
          padding: 2px 8px;
          background: var(--color-primary);
          border-radius: var(--radius-full);
        }

        .proposal-content {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          line-height: 1.8;
          margin-bottom: var(--space-md);
          color: var(--color-text);
        }

        .select-btn {
          width: 100%;
        }

        .wait-notice {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
