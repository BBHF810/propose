'use client';

import { useState } from 'react';

interface TopPageProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  error: string;
  isConnecting: boolean;
}

export default function TopPage({ onCreateRoom, onJoinRoom, error, isConnecting }: TopPageProps) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="top-page">
      {/* Title Section */}
      <div className="title-section animate-fadeIn">
        <div className="ring-icon animate-float">💍</div>
        <h1 className="game-title">
          <span className="title-line">たった今考えた</span>
          <span className="title-line accent">プロポーズの言葉</span>
          <span className="title-line">を君に捧ぐよ。</span>
        </h1>
        <p className="subtitle">〜 オンライン版 〜</p>
      </div>

      {mode === 'home' && (
        <div className="home-buttons animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <button className="btn-primary large-btn" onClick={() => setMode('create')} disabled={isConnecting}>
            <span className="btn-icon">🏠</span>
            部屋を作る
          </button>
          <button className="btn-secondary large-btn" onClick={() => setMode('join')} disabled={isConnecting}>
            <span className="btn-icon">🚪</span>
            部屋に参加
          </button>

          <div className="rules-section glass-card">
            <h3>📖 遊び方</h3>
            <ol>
              <li>3〜6人で遊べるパーティーゲーム</li>
              <li>配られた<strong>単語カード</strong>を組み合わせてプロポーズを作ろう</li>
              <li>制限時間は<strong>30秒</strong>！</li>
              <li>「親」プレイヤーが最高のプロポーズを選ぶ</li>
              <li>選ばれたら<strong>💍指輪</strong>を渡せる！</li>
              <li>一番多く指輪をもらったプレイヤーの勝ち！</li>
            </ol>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="form-section animate-fadeInUp">
          <div className="glass-card form-card">
            <h2>🏠 部屋を作る</h2>
            <div className="form-group">
              <label htmlFor="create-name">あなたの名前</label>
              <input
                id="create-name"
                type="text"
                placeholder="例：たろう"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={10}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleCreate} disabled={!playerName.trim() || isConnecting}>
                {isConnecting ? '作成中...' : '部屋を作成'}
              </button>
              <button className="btn-secondary" onClick={() => { setMode('home'); setPlayerName(''); }}>
                戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="form-section animate-fadeInUp">
          <div className="glass-card form-card">
            <h2>🚪 部屋に参加</h2>
            <div className="form-group">
              <label htmlFor="join-name">あなたの名前</label>
              <input
                id="join-name"
                type="text"
                placeholder="例：はなこ"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={10}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="room-code">部屋コード</label>
              <input
                id="room-code"
                type="text"
                placeholder="例：AB12"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="room-code-input"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleJoin}
                disabled={!playerName.trim() || !roomCode.trim() || isConnecting}
              >
                {isConnecting ? '参加中...' : '参加する'}
              </button>
              <button className="btn-secondary" onClick={() => { setMode('home'); setPlayerName(''); setRoomCode(''); }}>
                戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message animate-fadeIn">
          ⚠️ {error}
        </div>
      )}

      <style jsx>{`
        .top-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xl);
          width: 100%;
          max-width: 500px;
          padding-top: var(--space-2xl);
        }

        .title-section {
          text-align: center;
        }

        .ring-icon {
          font-size: 4rem;
          margin-bottom: var(--space-md);
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
        }

        .game-title {
          font-size: 1.8rem;
          line-height: 1.6;
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .title-line {
          display: block;
        }

        .title-line.accent {
          font-size: 2.2rem;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          margin-top: var(--space-sm);
          color: var(--color-text-muted);
          font-size: 1rem;
          letter-spacing: 0.2em;
        }

        .home-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          width: 100%;
        }

        .large-btn {
          padding: var(--space-lg) var(--space-xl);
          font-size: 1.2rem;
          width: 100%;
        }

        .btn-icon {
          font-size: 1.4rem;
        }

        .rules-section {
          padding: var(--space-lg);
          margin-top: var(--space-md);
        }

        .rules-section h3 {
          margin-bottom: var(--space-md);
          font-size: 1.1rem;
        }

        .rules-section ol {
          padding-left: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .form-section {
          width: 100%;
        }

        .form-card {
          padding: var(--space-xl);
        }

        .form-card h2 {
          margin-bottom: var(--space-lg);
          font-size: 1.3rem;
          text-align: center;
        }

        .form-group {
          margin-bottom: var(--space-lg);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--space-sm);
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: var(--space-md);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          font-size: 1.1rem;
          color: var(--color-text);
          transition: all var(--transition-normal);
        }

        .form-group input:focus {
          border-color: var(--color-primary);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.2);
        }

        .form-group input::placeholder {
          color: var(--color-text-muted);
        }

        .room-code-input {
          text-align: center;
          font-size: 1.8rem !important;
          letter-spacing: 0.5em;
          font-family: var(--font-display);
          font-weight: 700;
          text-transform: uppercase;
        }

        .form-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-actions .btn-primary,
        .form-actions .btn-secondary {
          width: 100%;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: var(--space-md) var(--space-lg);
          border-radius: var(--radius-md);
          color: #fca5a5;
          font-size: 0.9rem;
          text-align: center;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
