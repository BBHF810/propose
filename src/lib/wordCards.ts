import { WordCard } from './gameState';

// 甘い言葉・愛の表現
const sweetWords: string[] = [
  '愛してる', '一生一緒に', '守るよ', '天使', '宝物',
  '運命', '抱きしめたい', 'メロメロ', '女神', '大好き',
  '夢中', '尊い', 'ときめき', '永遠に', 'ロマンティック',
  '幸せ', '笑顔', 'キス', '恋', 'ハート',
  '一途', '溺愛', '情熱', '甘い', 'ラブラブ',
  '君だけ', '世界一', '最愛', '二人きり', '誓うよ',
];

// 日常的・不思議な言葉
const dailyWords: string[] = [
  '味噌汁', '宇宙', '神様', 'この星', 'あの日見た',
  '朝焼け', '満月', '花束', '虹', '海',
  '涙', '約束', '秘密', '奇跡', '冒険',
  '宝箱', '魔法', 'キャンバス', '手紙', '物語',
  '季節', '夕焼け', '星空', '雨上がり', 'メロディー',
  '時間', '景色', '記憶', '写真', '日記',
];

// 接続詞・語尾
const connectorWords: string[] = [
  'のことで頭がいっぱい', 'みたいだね', '暮らさないか？', 'ダメですか？',
  'ってなんだろう？', 'だよね？', 'のさ', 'だから',
  'してくれ', 'な気がする', 'を信じて', 'に誓って',
  'のように', 'よりも', 'と一緒に', 'の中で',
  'がなければ', 'するために', 'を探して', 'に包まれて',
  'でいっぱいの', 'まで届け', 'を込めて', 'に染まる',
  'がほしい', 'を感じて', 'とともに', 'の向こうに',
  'しかない', 'に溢れた',
];

// ユニーク・パワーワード
const uniqueWords: string[] = [
  '地獄', '墓まで', '伝説', '叫んでる', '爆発',
  '変態', '消し去る', '耐えられない', '拷問', '覚悟',
  '革命', '暴走', 'じゃじゃ馬', '修羅場', '阿鼻叫喚',
  '監視', '執着', '依存', '束縛', '逃げられない',
  '最強', 'カオス', '伝染病', '禁断', '暗黒',
  'マグマ', '雷', '台風', 'ゾンビ', '世紀末',
];

function createCards(words: string[], category: WordCard['category']): WordCard[] {
  return words.map((text, index) => ({
    id: `${category}-${index}`,
    text,
    category,
  }));
}

// 全カードデッキを作成
export function createDeck(): WordCard[] {
  return [
    ...createCards(sweetWords, 'sweet'),
    ...createCards(dailyWords, 'daily'),
    ...createCards(connectorWords, 'connector'),
    ...createCards(uniqueWords, 'unique'),
  ];
}

// デッキをシャッフルする
export function shuffleDeck(deck: WordCard[]): WordCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 指定枚数のカードを引く
export function drawCards(deck: WordCard[], count: number): { drawn: WordCard[]; remaining: WordCard[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

// カードのカテゴリに応じた色を返す
export function getCategoryColor(category: WordCard['category']): string {
  switch (category) {
    case 'sweet': return '#ff6b9d';
    case 'daily': return '#4ecdc4';
    case 'connector': return '#ffe66d';
    case 'unique': return '#a855f7';
    default: return '#ffffff';
  }
}

export function getCategoryLabel(category: WordCard['category']): string {
  switch (category) {
    case 'sweet': return '💕';
    case 'daily': return '🌟';
    case 'connector': return '🔗';
    case 'unique': return '⚡';
    default: return '';
  }
}
