'use client';

import Peer, { DataConnection } from 'peerjs';
import { PeerMessage, GameState, serializeGameState } from './gameState';

type MessageHandler = (msg: PeerMessage, senderId: string) => void;
type ConnectionHandler = (peerId: string) => void;
type DisconnectionHandler = (peerId: string) => void;

const PEER_PREFIX = 'propgame-';

// PeerJSの共通設定
const PEER_CONFIG = {
  debug: 2,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
    ],
  },
};

export class PeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessage: MessageHandler | null = null;
  private onConnect: ConnectionHandler | null = null;
  private onDisconnect: DisconnectionHandler | null = null;
  private isHost: boolean = false;
  private myPeerId: string = '';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private destroyed: boolean = false;

  // ホストとして初期化
  async initAsHost(roomId: string): Promise<string> {
    this.isHost = true;
    const peerId = PEER_PREFIX + roomId;
    this.myPeerId = peerId;

    return new Promise((resolve, reject) => {
      let resolved = false;

      this.peer = new Peer(peerId, PEER_CONFIG);

      this.peer.on('open', (id) => {
        if (resolved) return;
        resolved = true;
        console.log('[Host] Peer opened:', id);
        this.startPingInterval();
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        console.log('[Host] Incoming connection from:', conn.peer);
        this.handleConnection(conn);
      });

      this.peer.on('error', (err: any) => {
        console.error('[Host] Peer error:', err.type, err.message);
        if (!resolved) {
          resolved = true;
          if (err.type === 'unavailable-id') {
            reject(new Error('この部屋コードは既に使われています。別のコードをお試しください。'));
          } else {
            reject(new Error(`接続エラー: ${err.type || err.message}`));
          }
        }
      });

      this.peer.on('disconnected', () => {
        console.log('[Host] Disconnected from signaling server, attempting reconnect...');
        if (!this.destroyed && this.peer) {
          this.peer.reconnect();
        }
      });

      // タイムアウト
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('シグナリングサーバーへの接続がタイムアウトしました。'));
        }
      }, 15000);
    });
  }

  // クライアントとして接続
  async initAsClient(roomId: string): Promise<string> {
    this.isHost = false;
    const hostPeerId = PEER_PREFIX + roomId;

    return new Promise((resolve, reject) => {
      let resolved = false;

      this.peer = new Peer(PEER_CONFIG);

      this.peer.on('open', (id) => {
        console.log('[Client] Peer opened:', id);
        this.myPeerId = id;

        console.log('[Client] Connecting to host:', hostPeerId);
        // ホストに接続
        const conn = this.peer!.connect(hostPeerId, {
          reliable: true,
          serialization: 'json',
        });

        conn.on('open', () => {
          if (resolved) return;
          resolved = true;
          console.log('[Client] Connected to host successfully');
          this.connections.set(hostPeerId, conn);
          this.setupConnectionHandlers(conn);
          this.startPingInterval();
          resolve(id);
        });

        conn.on('error', (err) => {
          console.error('[Client] Connection error:', err);
          if (!resolved) {
            resolved = true;
            reject(new Error('部屋に接続できませんでした。部屋コードを確認してください。'));
          }
        });

        // 接続タイムアウト
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.error('[Client] Connection timeout. conn.open:', conn.open);
            reject(new Error('接続がタイムアウトしました。部屋コードを確認してください。'));
          }
        }, 15000);
      });

      this.peer.on('error', (err: any) => {
        console.error('[Client] Peer error:', err.type, err.message);
        if (!resolved) {
          resolved = true;
          if (err.type === 'peer-unavailable') {
            reject(new Error('部屋が見つかりません。部屋コードを確認してください。'));
          } else {
            reject(new Error(`接続エラー: ${err.type || err.message}`));
          }
        }
      });

      this.peer.on('disconnected', () => {
        console.log('[Client] Disconnected from signaling server');
        if (!this.destroyed && this.peer) {
          this.peer.reconnect();
        }
      });

      // Peer自体のオープンタイムアウト
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('シグナリングサーバーに接続できませんでした。ネットワークを確認してください。'));
        }
      }, 20000);
    });
  }

  private handleConnection(conn: DataConnection) {
    // 着信接続がすでにopenの場合があるので両方対応する
    const setup = () => {
      if (this.connections.has(conn.peer)) return; // 重複防止
      console.log('[PeerManager] Setting up connection with:', conn.peer, 'open:', conn.open);
      this.connections.set(conn.peer, conn);
      this.setupConnectionHandlers(conn);
      this.onConnect?.(conn.peer);
    };

    if (conn.open) {
      console.log('[PeerManager] Connection already open:', conn.peer);
      setup();
    }
    conn.on('open', () => {
      console.log('[PeerManager] Connection opened:', conn.peer);
      setup();
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      const msg = data as PeerMessage;
      if (msg.type === 'ping') {
        this.send(conn.peer, { type: 'pong' });
        return;
      }
      if (msg.type === 'pong') return;
      console.log('[PeerManager] Received message:', msg.type, 'from:', conn.peer);
      this.onMessage?.(msg, conn.peer);
    });

    conn.on('close', () => {
      console.log('[PeerManager] Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.onDisconnect?.(conn.peer);
    });

    conn.on('error', (err) => {
      console.error('[PeerManager] Connection error with', conn.peer, err);
    });
  }

  // 特定のピアにメッセージ送信
  send(peerId: string, msg: PeerMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    } else {
      console.warn('[PeerManager] Cannot send to', peerId, '- connection not open');
    }
  }

  // 全ピアにブロードキャスト
  broadcast(msg: PeerMessage) {
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  // ゲーム状態をブロードキャスト（ホスト用）
  broadcastGameState(state: GameState) {
    const serialized = serializeGameState(state);
    this.broadcast({ type: 'game-state', state: serialized });
  }

  // ホストにメッセージ送信（クライアント用）
  sendToHost(msg: PeerMessage) {
    const hostConn = Array.from(this.connections.values())[0];
    if (hostConn && hostConn.open) {
      console.log('[Client] Sending to host:', msg.type);
      hostConn.send(msg);
    } else {
      console.warn('[Client] Cannot send to host - no open connection');
    }
  }

  // イベントハンドラ設定
  setOnMessage(handler: MessageHandler) {
    this.onMessage = handler;
  }

  setOnConnect(handler: ConnectionHandler) {
    this.onConnect = handler;
  }

  setOnDisconnect(handler: DisconnectionHandler) {
    this.onDisconnect = handler;
  }

  // Keep-alive
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.broadcast({ type: 'ping' });
    }, 15000);
  }

  // 切断
  destroy() {
    this.destroyed = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
  }

  getPeerId(): string {
    return this.myPeerId;
  }

  getIsHost(): boolean {
    return this.isHost;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}
