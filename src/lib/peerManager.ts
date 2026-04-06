'use client';

import Peer, { DataConnection } from 'peerjs';
import { PeerMessage, GameState, serializeGameState } from './gameState';

type MessageHandler = (msg: PeerMessage, senderId: string) => void;
type ConnectionHandler = (peerId: string) => void;
type DisconnectionHandler = (peerId: string) => void;

const PEER_PREFIX = 'propose-game-';

export class PeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessage: MessageHandler | null = null;
  private onConnect: ConnectionHandler | null = null;
  private onDisconnect: DisconnectionHandler | null = null;
  private isHost: boolean = false;
  private myPeerId: string = '';
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // ホストとして初期化
  async initAsHost(roomId: string): Promise<string> {
    this.isHost = true;
    const peerId = PEER_PREFIX + roomId;
    this.myPeerId = peerId;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        console.log('Host peer opened:', id);
        this.startPingInterval();
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'unavailable-id') {
          reject(new Error('この部屋コードは既に使われています。別のコードをお試しください。'));
        } else {
          reject(err);
        }
      });
    });
  }

  // クライアントとして接続
  async initAsClient(roomId: string): Promise<string> {
    this.isHost = false;
    const hostPeerId = PEER_PREFIX + roomId;

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', (id) => {
        console.log('Client peer opened:', id);
        this.myPeerId = id;

        // ホストに接続
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        
        conn.on('open', () => {
          console.log('Connected to host');
          this.connections.set(hostPeerId, conn);
          this.setupConnectionHandlers(conn);
          this.startPingInterval();
          resolve(id);
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          reject(new Error('部屋に接続できませんでした。部屋コードを確認してください。'));
        });

        // Timeout for connection
        setTimeout(() => {
          if (!conn.open) {
            reject(new Error('接続がタイムアウトしました。部屋コードを確認してください。'));
          }
        }, 10000);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'peer-unavailable') {
          reject(new Error('部屋が見つかりません。部屋コードを確認してください。'));
        } else {
          reject(err);
        }
      });
    });
  }

  private handleConnection(conn: DataConnection) {
    // 着信接続がすでにopenの場合があるので両方対応する
    const setup = () => {
      if (this.connections.has(conn.peer)) return; // 重複防止
      console.log('New connection from:', conn.peer);
      this.connections.set(conn.peer, conn);
      this.setupConnectionHandlers(conn);
      this.onConnect?.(conn.peer);
    };

    if (conn.open) {
      setup();
    }
    conn.on('open', () => {
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
      this.onMessage?.(msg, conn.peer);
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.onDisconnect?.(conn.peer);
    });

    conn.on('error', (err) => {
      console.error('Connection error with', conn.peer, err);
    });
  }

  // 特定のピアにメッセージ送信
  send(peerId: string, msg: PeerMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }

  // 全ピアにブロードキャスト
  broadcast(msg: PeerMessage) {
    this.connections.forEach((conn) => {
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
      hostConn.send(msg);
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
