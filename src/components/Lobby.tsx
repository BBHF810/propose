'use client';

import { GameState } from '@/lib/gameState';

interface LobbyProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onBack: () => void;
}

export default function Lobby({ gameState, myPlayerId, isHost, onStartGame, onBack }: LobbyProps) {
  const canStart = gameState.players.length >= 3 && isHost;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
  };

  return (
    <div className="lobby animate-fadeIn">
      <div className="lobby-header">
        <h1>💍 ロビー</h1>
        <p className="lobby-subtitle">仲間を待っています...</p>
      </div>

      <div className="room-code-section glass-card">
        <p className="room-code-label">部屋コード</p>
        <div className="room-code-display" onClick={copyRoomCode} title="クリックでコピー">
          {gameState.roomId.split('').map((char, i) => (
            <span key={i} className="room-code-char" style={{ animationDelay: `${i * 0.1}s` }}>
              {char}
            </span>
          ))}
        </div>
        <button className="copy-btn" onClick={copyRoomCode}>
          📋 コピー
        </button>
      </div>

      <div className="players-section">
        <h2>👥 プレイヤー ({gameState.players.length}/6)</h2>
        <div className="players-grid">
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className={`player-card glass-card ${player.id === myPlayerId ? 'is-me' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="player-avatar">
                {getAvatar(index)}
              </div>
              <div className="player-info">
                <span className="player-name">
                  {player.name}
                  {player.id === myPlayerId && <span className="me-badge">あなた</span>}
                </span>
                {player.isHost && <span className="host-badge">👑 ホスト</span>}
              </div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - gameState.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card glass-card empty">
              <div className="player-avatar empty-avatar">?</div>
              <div className="player-info">
                <span className="player-name empty-name">待機中...</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-actions">
        {isHost ? (
          <>
            <button
              className="btn-gold large-btn"
              onClick={onStartGame}
              disabled={!canStart}
            >
              🎮 ゲーム開始！
            </button>
            {gameState.players.length < 3 && (
              <p className="min-players-notice">
                あと{3 - gameState.players.length}人参加するとゲームを開始できます
              </p>
            )}
          </>
        ) : (
          <p className="waiting-notice animate-pulse">
            ホストがゲームを開始するのを待っています...
          </p>
        )}
        <button className="btn-secondary" onClick={onBack}>
          退出する
        </button>
      </div>

      <style jsx>{`
        .lobby {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          width: 100%;
          max-width: 500px;
          padding-top: var(--space-lg);
        }

        .lobby-header {
          text-align: center;
        }

        .lobby-header h1 {
          font-size: 2rem;
          margin-bottom: var(--space-xs);
        }

        .lobby-subtitle {
          color: var(--color-text-muted);
          font-size: 0.95rem;
        }

        .room-code-section {
          padding: var(--space-lg);
          text-align: center;
          width: 100%;
        }

        .room-code-label {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          margin-bottom: var(--space-sm);
          letter-spacing: 0.1em;
        }

        .room-code-display {
          display: flex;
          justify-content: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
          cursor: pointer;
          transition: transform var(--transition-normal);
        }

        .room-code-display:hover {
          transform: scale(1.05);
        }

        .room-code-char {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 64px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 900;
          color: white;
          box-shadow: var(--shadow-glow-pink);
          animation: fadeInUp 0.4s ease both;
        }

        .copy-btn {
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          transition: all var(--transition-normal);
        }

        .copy-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--color-primary);
        }

        .players-section {
          width: 100%;
        }

        .players-section h2 {
          font-size: 1.1rem;
          margin-bottom: var(--space-md);
          color: var(--color-text-secondary);
        }

        .players-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .player-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md) var(--space-lg);
          animation: slideInLeft 0.4s ease both;
          transition: all var(--transition-normal);
        }

        .player-card.is-me {
          border-color: var(--color-primary);
          background: rgba(233, 30, 140, 0.1);
        }

        .player-card.empty {
          opacity: 0.4;
        }

        .player-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: linear-gradient(135deg, rgba(233, 30, 140, 0.2), rgba(155, 89, 182, 0.2));
          flex-shrink: 0;
        }

        .empty-avatar {
          font-size: 1.2rem;
          color: var(--color-text-muted);
          background: rgba(255, 255, 255, 0.05);
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .player-name {
          font-weight: 600;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .empty-name {
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .me-badge {
          font-size: 0.7rem;
          padding: 2px 8px;
          background: var(--color-primary);
          border-radius: var(--radius-full);
          font-weight: 500;
        }

        .host-badge {
          font-size: 0.75rem;
          color: var(--color-secondary);
        }

        .lobby-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          width: 100%;
        }

        .large-btn {
          width: 100%;
          padding: var(--space-lg);
          font-size: 1.3rem;
        }

        .min-players-notice {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          text-align: center;
        }

        .waiting-notice {
          color: var(--color-secondary);
          font-size: 1rem;
          text-align: center;
          animation: pulse 2s ease-in-out infinite;
        }

        .lobby-actions .btn-secondary {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function getAvatar(index: number): string {
  const avatars = ['😊', '😎', '🥰', '😜', '🤩', '😇'];
  return avatars[index % avatars.length];
}
