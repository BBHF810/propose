'use client';

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { PeerMessage, GameState, serializeGameState } from './gameState';

type MessageHandler = (msg: PeerMessage, senderId: string) => void;
type ConnectionHandler = (playerId: string) => void;
type DisconnectionHandler = (playerId: string) => void;

// Supabase設定（環境変数から取得）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export class PeerManager {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private onMessage: MessageHandler | null = null;
  private onConnect: ConnectionHandler | null = null;
  private onDisconnect: DisconnectionHandler | null = null;
  private isHost: boolean = false;
  private myPeerId: string = '';
  private roomId: string = '';

  private generateId(): string {
    return 'player-' + Math.random().toString(36).substring(2, 10);
  }

  // Supabaseクライアント初期化
  private initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase設定が見つかりません。');
    }
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // ホストとして初期化
  async initAsHost(roomId: string): Promise<string> {
    this.isHost = true;
    this.roomId = roomId;
    this.myPeerId = 'host-' + roomId;

    this.initSupabase();

    return new Promise((resolve, reject) => {
      const channelName = `propose-${roomId}`;
      console.log('[Host] Creating channel:', channelName);

      this.channel = this.supabase!.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      });

      // メッセージ受信ハンドラ
      this.channel
        .on('broadcast', { event: 'game-message' }, (payload) => {
          const msg = payload.payload as { message: PeerMessage; senderId: string };
          console.log('[Host] Received:', msg.message.type, 'from:', msg.senderId);
          this.onMessage?.(msg.message, msg.senderId);
        })
        .subscribe((status) => {
          console.log('[Host] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[Host] Channel ready');
            resolve(this.myPeerId);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error('チャンネルへの接続に失敗しました。'));
          }
        });

      // タイムアウト
      setTimeout(() => {
        if (!this.channel) {
          reject(new Error('接続がタイムアウトしました。'));
        }
      }, 15000);
    });
  }

  // クライアントとして接続
  async initAsClient(roomId: string): Promise<string> {
    this.isHost = false;
    this.roomId = roomId;
    this.myPeerId = this.generateId();

    this.initSupabase();

    return new Promise((resolve, reject) => {
      const channelName = `propose-${roomId}`;
      console.log('[Client] Joining channel:', channelName);

      this.channel = this.supabase!.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      });

      // メッセージ受信ハンドラ
      this.channel
        .on('broadcast', { event: 'game-message' }, (payload) => {
          const msg = payload.payload as { message: PeerMessage; senderId: string };
          console.log('[Client] Received:', msg.message.type, 'from:', msg.senderId);
          this.onMessage?.(msg.message, msg.senderId);
        })
        .subscribe((status) => {
          console.log('[Client] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[Client] Channel ready');
            resolve(this.myPeerId);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error('部屋に接続できませんでした。'));
          }
        });

      // タイムアウト
      setTimeout(() => {
        if (!this.channel) {
          reject(new Error('接続がタイムアウトしました。'));
        }
      }, 15000);
    });
  }

  // メッセージ送信（ブロードキャスト）
  async send(_peerId: string, msg: PeerMessage) {
    await this.broadcast(msg);
  }

  // ブロードキャスト
  async broadcast(msg: PeerMessage) {
    if (!this.channel) {
      console.warn('[PeerManager] No channel to broadcast to');
      return;
    }
    await this.channel.send({
      type: 'broadcast',
      event: 'game-message',
      payload: {
        message: msg,
        senderId: this.myPeerId,
      },
    });
  }

  // ゲーム状態をブロードキャスト（ホスト用）
  async broadcastGameState(state: GameState) {
    const serialized = serializeGameState(state);
    await this.broadcast({ type: 'game-state', state: serialized });
  }

  // ホストにメッセージ送信（クライアント用）— Broadcastではすべてブロードキャスト
  async sendToHost(msg: PeerMessage) {
    await this.broadcast(msg);
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

  // 切断
  destroy() {
    if (this.channel && this.supabase) {
      this.supabase.removeChannel(this.channel);
    }
    this.channel = null;
    this.supabase = null;
  }

  getPeerId(): string {
    return this.myPeerId;
  }

  getIsHost(): boolean {
    return this.isHost;
  }

  getConnectionCount(): number {
    return 0; // Broadcastでは直接的な接続数は取得不可
  }
}
