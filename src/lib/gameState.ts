// ゲーム状態の型定義

export interface WordCard {
  id: string;
  text: string;
  category: 'sweet' | 'daily' | 'connector' | 'unique';
}

export interface Player {
  id: string;
  name: string;
  rings: number;        // 残り指輪数
  hand: WordCard[];     // 手札
  proposal: WordCard[]; // 組み立てたプロポーズ
  isHost: boolean;
  isReady: boolean;
}

export type GamePhase =
  | 'lobby'        // ロビー（参加待ち）
  | 'preparing'    // ラウンド準備中
  | 'composing'    // プロポーズ作成中
  | 'presenting'   // 発表中
  | 'judging'      // 審査中
  | 'result'       // ラウンド結果
  | 'gameover';    // ゲーム終了

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  currentJudgeIndex: number;   // 親プレイヤーのインデックス
  currentPresenterIndex: number; // 発表中のプレイヤーインデックス
  roundNumber: number;
  maxRounds: number;
  timeRemaining: number;       // 残り制限時間（秒）
  maxTime: number;             // 最大制限時間（秒）
  proposals: Map<string, WordCard[]>; // playerId -> proposal
  selectedWinner: string | null; // 選ばれたプレイヤーのID
  ringsReceived: Map<string, number>; // playerId -> 受け取った指輪数
}

// PeerJS メッセージの型定義
export type PeerMessage =
  | { type: 'player-join'; player: Player }
  | { type: 'player-leave'; playerId: string }
  | { type: 'game-state'; state: SerializedGameState }
  | { type: 'start-game' }
  | { type: 'submit-proposal'; playerId: string; proposal: WordCard[] }
  | { type: 'next-presenter' }
  | { type: 'select-winner'; winnerId: string }
  | { type: 'next-round' }
  | { type: 'player-update'; player: Player }
  | { type: 'ping' }
  | { type: 'pong' };

// シリアライズ可能なGameState（Map -> Record変換）
export interface SerializedGameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  currentJudgeIndex: number;
  currentPresenterIndex: number;
  roundNumber: number;
  maxRounds: number;
  timeRemaining: number;
  maxTime: number;
  proposals: Record<string, WordCard[]>;
  selectedWinner: string | null;
  ringsReceived: Record<string, number>;
}

export function serializeGameState(state: GameState): SerializedGameState {
  return {
    ...state,
    proposals: Object.fromEntries(state.proposals),
    ringsReceived: Object.fromEntries(state.ringsReceived),
  };
}

export function deserializeGameState(data: SerializedGameState): GameState {
  return {
    ...data,
    proposals: new Map(Object.entries(data.proposals)),
    ringsReceived: new Map(Object.entries(data.ringsReceived)),
  };
}

export function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    phase: 'lobby',
    players: [],
    currentJudgeIndex: 0,
    currentPresenterIndex: 0,
    roundNumber: 0,
    maxRounds: 0, // プレイヤー数に応じて設定
    timeRemaining: 30,
    maxTime: 30,
    proposals: new Map(),
    selectedWinner: null,
    ringsReceived: new Map(),
  };
}
