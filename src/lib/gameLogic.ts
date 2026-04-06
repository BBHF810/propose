import { GameState, Player, WordCard, SerializedGameState, serializeGameState, deserializeGameState } from './gameState';
import { createDeck, shuffleDeck, drawCards } from './wordCards';

const CARDS_PER_PLAYER = 8;
const INITIAL_RINGS = 3;
const DEFAULT_TIME = 30;

// ルームIDを生成（4桁の英数字）
export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// プレイヤーを作成
export function createPlayer(id: string, name: string, isHost: boolean): Player {
  return {
    id,
    name,
    rings: INITIAL_RINGS,
    hand: [],
    proposal: [],
    isHost,
    isReady: false,
  };
}

// ゲームを開始（カードを配る）
export function startRound(state: GameState): GameState {
  let deck = shuffleDeck(createDeck());
  const newState = { ...state };
  
  newState.phase = 'composing';
  newState.roundNumber += 1;
  newState.timeRemaining = newState.maxTime || DEFAULT_TIME;
  newState.proposals = new Map();
  newState.selectedWinner = null;
  newState.currentPresenterIndex = 0;

  // 各プレイヤー（親以外）にカードを配る
  newState.players = state.players.map((player, index) => {
    if (index === newState.currentJudgeIndex) {
      // 親プレイヤーにはカードを配らない
      return { ...player, hand: [], proposal: [] };
    }
    const { drawn, remaining } = drawCards(deck, CARDS_PER_PLAYER);
    deck = remaining;
    return { ...player, hand: drawn, proposal: [] };
  });

  return newState;
}

// ゲーム全体のセットアップ
export function setupGame(state: GameState): GameState {
  const newState = { ...state };
  // ラウンド数はプレイヤー数と同じ（全員1回ずつ親をやる）
  newState.maxRounds = state.players.length;
  newState.roundNumber = 0;
  newState.currentJudgeIndex = 0;
  newState.maxTime = DEFAULT_TIME;
  
  // 指輪の初期化
  newState.ringsReceived = new Map();
  newState.players = state.players.map(p => ({
    ...p,
    rings: INITIAL_RINGS,
    hand: [],
    proposal: [],
  }));

  return startRound(newState);
}

// プロポーズを提出
export function submitProposal(state: GameState, playerId: string, proposal: WordCard[]): GameState {
  const newState = { ...state };
  newState.proposals = new Map(state.proposals);
  newState.proposals.set(playerId, proposal);

  // プレイヤーのproposalも更新
  newState.players = state.players.map(p =>
    p.id === playerId ? { ...p, proposal } : p
  );

  // 全員提出したか確認
  const nonJudgePlayers = state.players.filter((_, i) => i !== state.currentJudgeIndex);
  const allSubmitted = nonJudgePlayers.every(p => newState.proposals.has(p.id));

  if (allSubmitted) {
    newState.phase = 'presenting';
    // 最初の発表者を設定（親をスキップ）
    newState.currentPresenterIndex = getFirstPresenterIndex(state);
  }

  return newState;
}

// 時間切れ処理
export function handleTimeUp(state: GameState): GameState {
  const newState = { ...state };
  
  // まだ提出していないプレイヤーは空のプロポーズで提出
  newState.proposals = new Map(state.proposals);
  state.players.forEach((player, index) => {
    if (index !== state.currentJudgeIndex && !newState.proposals.has(player.id)) {
      newState.proposals.set(player.id, player.proposal.length > 0 ? player.proposal : []);
    }
  });

  newState.phase = 'presenting';
  newState.currentPresenterIndex = getFirstPresenterIndex(state);

  return newState;
}

// 最初の発表者のインデックスを取得
function getFirstPresenterIndex(state: GameState): number {
  for (let i = 0; i < state.players.length; i++) {
    if (i !== state.currentJudgeIndex) return i;
  }
  return 0;
}

// 次の発表者に移動
export function nextPresenter(state: GameState): GameState {
  const newState = { ...state };
  let nextIndex = state.currentPresenterIndex + 1;
  
  // 親をスキップしながら次の発表者を探す
  while (nextIndex < state.players.length) {
    if (nextIndex !== state.currentJudgeIndex) {
      newState.currentPresenterIndex = nextIndex;
      return newState;
    }
    nextIndex++;
  }

  // 全員発表完了 → 審査フェーズへ
  newState.phase = 'judging';
  return newState;
}

// 勝者を選択
export function selectWinner(state: GameState, winnerId: string): GameState {
  const newState = { ...state };
  newState.selectedWinner = winnerId;
  newState.phase = 'result';

  // 指輪の受け渡し
  newState.ringsReceived = new Map(state.ringsReceived);
  const currentCount = newState.ringsReceived.get(winnerId) || 0;
  newState.ringsReceived.set(winnerId, currentCount + 1);

  // 勝者の指輪を1つ減らす
  newState.players = state.players.map(p => {
    if (p.id === winnerId) {
      return { ...p, rings: Math.max(0, p.rings - 1) };
    }
    return p;
  });

  return newState;
}

// 次のラウンドへ進む
export function nextRound(state: GameState): GameState {
  // 全ラウンド終了チェック
  if (state.roundNumber >= state.maxRounds) {
    return { ...state, phase: 'gameover' };
  }

  const newState = { ...state };
  // 次の親を設定
  newState.currentJudgeIndex = (state.currentJudgeIndex + 1) % state.players.length;
  
  return startRound(newState);
}

// ゲーム全体のスコアを取得
export function getScores(state: GameState): { player: Player; ringsReceived: number; ringsRemaining: number }[] {
  return state.players.map(player => ({
    player,
    ringsReceived: state.ringsReceived.get(player.id) || 0,
    ringsRemaining: player.rings,
  })).sort((a, b) => {
    // 受け取った指輪が多い順、同数なら残り指輪が少ない順
    if (b.ringsReceived !== a.ringsReceived) return b.ringsReceived - a.ringsReceived;
    return a.ringsRemaining - b.ringsRemaining;
  });
}

// 勝者を判定
export function getWinner(state: GameState): Player | null {
  const scores = getScores(state);
  if (scores.length === 0) return null;
  return scores[0].player;
}

export { serializeGameState, deserializeGameState };
export type { SerializedGameState };
