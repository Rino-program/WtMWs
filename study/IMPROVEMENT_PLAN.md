# Study Support 改善計画書

## 📋 目次
1. [現状分析](#現状分析)
2. [アーキテクチャ改善](#アーキテクチャ改善)
3. [機能強化計画](#機能強化計画)
4. [UI/UX改善](#uiux改善)
5. [技術的負債の解消](#技術的負債の解消)
6. [実装スケジュール](#実装スケジュール)
7. [移行計画](#移行計画)

---

## 🔍 現状分析

### 現在の問題点

#### コード品質・保守性
- ✗ **単一ファイル肥大化**: app.js が 2182行もあり、保守が困難
- ✗ **グローバル変数の乱用**: 状態管理が散在し、デバッグが困難
- ✗ **イベントリスナーの重複**: メモリリークの可能性
- ✗ **エラーハンドリング不足**: ユーザーフレンドリーなエラー処理が不足
- ✗ **テストコードなし**: リファクタリングやバグ修正が不安定
- ✗ **TypeScript未使用**: 型安全性がない

#### データ管理
- ✗ **localStorage の容量限定**: 大量データで動作不安定
- ✗ **データ構造の一貫性欠如**: マイグレーション処理が複雑
- ✗ **バックアップ機能の不完全**: 復元機能が未実装
- ✗ **データ同期なし**: 複数デバイス間で使えない

#### パフォーマンス
- ✗ **DOM操作の非効率性**: 頻繁な全体再描画
- ✗ **イベント処理の最適化不足**: スロットリング・デバウンス未使用
- ✗ **メモリリークの懸念**: イベントリスナーの適切な削除なし

#### 機能不足
- ✗ **SRS機能未実装**: 予定されているが未着手
- ✗ **統計分析の弱さ**: 学習パターン分析なし
- ✗ **コラボレーション機能なし**: 共同学習のサポートなし
- ✗ **モバイル最適化不足**: タッチ操作の配慮不足
- ✗ **アクセシビリティ不完全**: キーボード操作やスクリーンリーダー対応が部分的

#### UI/UX
- ✗ **レスポンシブ対応不完全**: 小画面での表示崩れ
- ✗ **ユーザーガイダンス不足**: 初回訪問者への説明が不足
- ✗ **フィードバックの弱さ**: 操作結果が分かりにくい
- ✗ **デザインの一貫性欠如**: スタイリングがバラバラ

### 現在の強み（維持すべき要素）

- ✓ **シンプルなコンセプト**: ポモドーロ + タスク管理の組み合わせ
- ✓ **完全ローカル**: プライバシー保護とオフライン動作
- ✓ **PWA対応**: インストール可能
- ✓ **基本的な統計機能**: 今日/週間の統計表示
- ✓ **カスタマイズ性**: 時間設定やテーマ変更が可能
- ✓ **フォルダ機能**: タスクの分類が可能
- ✓ **優先度・デッドライン**: タスク管理の基本機能

---

## 🏗️ アーキテクチャ改善

### 1. モジュラー設計への移行

#### ディレクトリ構造（新）
```
study-v2/
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── icons/
│   ├── sounds/
│   └── images/
├── src/
│   ├── main.ts                    # エントリーポイント
│   ├── config/
│   │   ├── constants.ts           # 定数定義
│   │   └── settings.ts            # デフォルト設定
│   ├── core/
│   │   ├── Timer.ts               # タイマークラス
│   │   ├── TaskManager.ts         # タスク管理
│   │   ├── SessionLogger.ts       # セッション記録
│   │   ├── StatisticsEngine.ts    # 統計計算
│   │   └── NotificationService.ts # 通知サービス
│   ├── storage/
│   │   ├── DatabaseManager.ts     # IndexedDB管理
│   │   ├── LocalStorageAdapter.ts # localStorage互換
│   │   ├── SyncManager.ts         # クラウド同期（将来）
│   │   └── migrations/            # データマイグレーション
│   │       ├── v1_to_v2.ts
│   │       └── index.ts
│   ├── ui/
│   │   ├── components/            # UIコンポーネント
│   │   │   ├── TimerDisplay.ts
│   │   │   ├── TaskList.ts
│   │   │   ├── TaskCard.ts
│   │   │   ├── Dashboard.ts
│   │   │   ├── Settings.ts
│   │   │   ├── Modal.ts
│   │   │   └── Toast.ts
│   │   ├── views/                 # ビュー（画面全体）
│   │   │   ├── SessionView.ts
│   │   │   ├── DashboardView.ts
│   │   │   ├── SettingsView.ts
│   │   │   └── SRSView.ts
│   │   └── utils/
│   │       ├── domHelpers.ts
│   │       └── animations.ts
│   ├── features/
│   │   ├── srs/                   # SRS機能（新）
│   │   │   ├── SRSEngine.ts
│   │   │   ├── Card.ts
│   │   │   ├── Deck.ts
│   │   │   └── ReviewScheduler.ts
│   │   ├── analytics/             # 分析機能（強化）
│   │   │   ├── PatternAnalyzer.ts
│   │   │   ├── Visualizer.ts
│   │   │   └── Reports.ts
│   │   └── collaboration/         # 共同学習（将来）
│   │       ├── Room.ts
│   │       └── Presence.ts
│   ├── utils/
│   │   ├── dateHelpers.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── errorHandlers.ts
│   │   └── performance.ts
│   └── types/
│       ├── models.ts              # データモデル型定義
│       ├── events.ts              # イベント型定義
│       └── api.ts                 # API型定義
├── styles/
│   ├── variables.css              # CSS変数
│   ├── base.css                   # ベーススタイル
│   ├── components/                # コンポーネント別CSS
│   │   ├── timer.css
│   │   ├── task.css
│   │   ├── dashboard.css
│   │   └── settings.css
│   ├── utilities.css              # ユーティリティクラス
│   └── themes/                    # テーマ定義
│       ├── dark.css
│       └── light.css
├── tests/
│   ├── unit/
│   │   ├── Timer.test.ts
│   │   ├── TaskManager.test.ts
│   │   └── StatisticsEngine.test.ts
│   ├── integration/
│   │   └── workflow.test.ts
│   └── e2e/
│       └── scenarios.test.ts
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── MIGRATION.md
│   └── USER_GUIDE.md
├── package.json
├── tsconfig.json
├── vite.config.ts                 # ビルドツール設定
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

#### TypeScript型定義の例

```typescript
// src/types/models.ts

export interface Task {
  id: string;
  title: string;
  subject: string;
  notes: string;
  folderId: string;
  priority: TaskPriority;
  status: TaskStatus;
  goalMinutes: number;
  amount: number;
  amountUnit: string;
  currentAmount: number;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  tags: string[];
  metadata: Record<string, any>;
}

export enum TaskPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent'
}

export enum TaskStatus {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
  Deleted = 'deleted'
}

export interface Session {
  id: string;
  taskId: string;
  type: SessionType;
  round: number;
  startedAt: Date;
  endedAt: Date;
  durationMs: number;
  interrupted: boolean;
  metadata: Record<string, any>;
}

export enum SessionType {
  Focus = 'focus',
  ShortBreak = 'short_break',
  LongBreak = 'long_break'
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

export interface Statistics {
  totalFocusMinutes: number;
  totalSessions: number;
  streakDays: number;
  averageFocusMinutes: number;
  productivityScore: number;
  taskCompletion: TaskCompletionStats;
  weeklyData: WeeklyData[];
}

// 他の型定義...
```

### 2. 状態管理の改善

#### EventEmitterパターンの採用

```typescript
// src/core/StateManager.ts

export class StateManager extends EventEmitter {
  private state: AppState;
  private subscribers: Map<string, Function[]> = new Map();
  
  constructor(initialState: AppState) {
    super();
    this.state = initialState;
  }
  
  getState(): Readonly<AppState> {
    return Object.freeze({ ...this.state });
  }
  
  setState(updates: Partial<AppState>): void {
    const prevState = this.state;
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', { prev: prevState, current: this.state });
    
    // 特定のプロパティの変更を監視
    Object.keys(updates).forEach(key => {
      this.emit(`change:${key}`, updates[key]);
    });
  }
  
  subscribe(event: string, callback: Function): () => void {
    this.on(event, callback);
    return () => this.off(event, callback);
  }
}

// 使用例
const stateManager = new StateManager(initialState);
stateManager.subscribe('change:currentTask', (task) => {
  // タスク変更時の処理
});
```

### 3. データベース設計の改善

#### IndexedDBへの移行

```typescript
// src/storage/DatabaseManager.ts

export class DatabaseManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'StudySupportDB';
  private readonly DB_VERSION = 2;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }
  
  private createObjectStores(db: IDBDatabase): void {
    // Tasks store
    if (!db.objectStoreNames.contains('tasks')) {
      const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
      taskStore.createIndex('folderId', 'folderId', { unique: false });
      taskStore.createIndex('status', 'status', { unique: false });
      taskStore.createIndex('deadline', 'deadline', { unique: false });
      taskStore.createIndex('priority', 'priority', { unique: false });
    }
    
    // Sessions store
    if (!db.objectStoreNames.contains('sessions')) {
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('taskId', 'taskId', { unique: false });
      sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
      sessionStore.createIndex('type', 'type', { unique: false });
    }
    
    // Folders store
    if (!db.objectStoreNames.contains('folders')) {
      db.createObjectStore('folders', { keyPath: 'id' });
    }
    
    // SRS Cards store（新）
    if (!db.objectStoreNames.contains('srs_cards')) {
      const cardStore = db.createObjectStore('srs_cards', { keyPath: 'id' });
      cardStore.createIndex('deckId', 'deckId', { unique: false });
      cardStore.createIndex('nextReview', 'nextReview', { unique: false });
      cardStore.createIndex('ease', 'ease', { unique: false });
    }
  }
  
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async put<T>(storeName: string, value: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async query<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

---

## 🚀 機能強化計画

### Phase 1: コア機能の再構築（1-2週間）

#### 1.1 タイマー機能の改善
- **高精度タイマー**: Web Workers を使用した正確な計時
- **バックグラウンド動作**: タブ非アクティブ時も正確に動作
- **通知の改善**: カスタムサウンド、バイブレーション対応
- **プリセット**: ポモドーロ以外の時間管理手法（52-17など）

```typescript
// src/core/Timer.ts (改善版)

export class Timer {
  private worker: Worker | null = null;
  private state: TimerState = TimerState.Idle;
  private config: TimerConfig;
  private callbacks: TimerCallbacks;
  
  constructor(config: TimerConfig, callbacks: TimerCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.initWorker();
  }
  
  private initWorker(): void {
    // Web Workerを使用して高精度タイマー実装
    const workerCode = `
      let interval;
      let endTime;
      
      self.onmessage = (e) => {
        const { action, duration } = e.data;
        
        if (action === 'start') {
          endTime = Date.now() + duration;
          interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            self.postMessage({ type: 'tick', remaining });
            
            if (remaining === 0) {
              clearInterval(interval);
              self.postMessage({ type: 'complete' });
            }
          }, 100); // 100msごとに更新
        } else if (action === 'stop') {
          clearInterval(interval);
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    
    this.worker.onmessage = (e) => {
      if (e.data.type === 'tick') {
        this.callbacks.onTick(e.data.remaining);
      } else if (e.data.type === 'complete') {
        this.callbacks.onComplete();
      }
    };
  }
  
  start(durationMs: number): void {
    if (!this.worker) return;
    this.state = TimerState.Running;
    this.worker.postMessage({ action: 'start', duration: durationMs });
    this.callbacks.onStart();
  }
  
  pause(): void {
    if (!this.worker) return;
    this.state = TimerState.Paused;
    this.worker.postMessage({ action: 'stop' });
    this.callbacks.onPause();
  }
  
  // 他のメソッド...
}
```

#### 1.2 タスク管理の強化
- **サブタスク機能**: 大きなタスクを細分化
- **依存関係**: タスク間の依存関係設定
- **繰り返しタスク**: 日次/週次の繰り返し設定
- **テンプレート**: よく使うタスクのテンプレート保存
- **タグ機能**: 複数タグによる柔軟な分類
- **検索・フィルター強化**: 全文検索、複数条件フィルター

#### 1.3 統計・分析の強化
- **学習パターン分析**: 集中しやすい時間帯の分析
- **生産性スコア**: 目標達成率、完了率などの総合評価
- **長期トレンド**: 月次、年次の統計
- **グラフの充実**: チャート.jsなどを使用した視覚化
- **エクスポート機能**: CSV、PDF出力

### Phase 2: SRS機能の実装（2-3週間）

#### 2.1 基本SRSエンジン
- **SM-2アルゴリズム**: 標準的な間隔反復アルゴリズム
- **カード作成**: フロント/バックのシンプルなカード
- **デッキ管理**: カードのグループ化
- **復習スケジューリング**: 適切な復習タイミング計算

```typescript
// src/features/srs/SRSEngine.ts

export class SRSEngine {
  /**
   * SM-2アルゴリズムによる次回復習日計算
   * @param card 復習するカード
   * @param quality 回答品質 (0-5)
   * @returns 更新されたカード情報
   */
  reviewCard(card: SRSCard, quality: number): SRSCard {
    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be between 0 and 5');
    }
    
    let { repetitions, ease, interval } = card;
    
    if (quality >= 3) {
      // 正解
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
      repetitions++;
    } else {
      // 不正解
      repetitions = 0;
      interval = 1;
    }
    
    // Ease調整
    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    
    return {
      ...card,
      repetitions,
      ease,
      interval,
      nextReview,
      lastReview: new Date(),
      reviewCount: card.reviewCount + 1
    };
  }
  
  /**
   * 今日の復習カード取得
   */
  async getDueCards(deckId?: string): Promise<SRSCard[]> {
    const now = new Date();
    let cards: SRSCard[];
    
    if (deckId) {
      cards = await db.query<SRSCard>('srs_cards', 'deckId', deckId);
    } else {
      cards = await db.getAll<SRSCard>('srs_cards');
    }
    
    return cards.filter(card => card.nextReview <= now);
  }
}
```

#### 2.2 カード作成・編集UI
- **マークダウン対応**: カード内容のフォーマット
- **画像・音声サポート**: メディアファイルの埋め込み
- **コード表示**: プログラミング学習向けのシンタックスハイライト
- **数式サポート**: KaTeX/MathJaxによる数式レンダリング

#### 2.3 復習セッション
- **復習モード**: カードを順次表示して回答
- **キーボードショートカット**: 効率的な復習
- **統計表示**: 復習セッションの結果サマリー
- **フィードバック**: 回答の正誤に応じたアニメーション

### Phase 3: UI/UX改善（1-2週間）

#### 3.1 レスポンシブ対応の完全化
- **モバイルファースト**: スマートフォンでの快適な操作
- **タッチジェスチャー**: スワイプ、ピンチ操作
- **PWA最適化**: ホーム画面追加後の体験向上

#### 3.2 アクセシビリティ
- **キーボード操作**: すべての機能をキーボードで操作可能
- **スクリーンリーダー対応**: ARIAラベルの完全実装
- **カラーコントラスト**: WCAG AAレベルのコントラスト
- **フォーカス管理**: 明確なフォーカス表示

#### 3.3 アニメーション・インタラクション
- **マイクロインタラクション**: ボタンクリック時のフィードバック
- **トランジション**: 画面遷移のスムーズさ
- **ローディング状態**: スケルトンスクリーン
- **エラー・成功表示**: トースト通知

#### 3.4 オンボーディング
- **初回訪問時のチュートリアル**: 機能説明のウォークスルー
- **ツールチップ**: 各機能のヒント表示
- **サンプルデータ**: 実際の使用例を含むデモデータ

### Phase 4: 高度な機能（2-3週間）

#### 4.1 データ同期（オプション）
- **クラウドバックアップ**: Google Drive / Dropbox連携
- **マルチデバイス同期**: 複数デバイス間でのデータ共有
- **競合解決**: オフライン編集時の競合処理

#### 4.2 共同学習機能
- **学習ルーム**: 友人との共同学習セッション
- **プレゼンス表示**: オンライン状態の可視化
- **チャット**: テキストチャット機能
- **進捗共有**: 学習状況の共有

#### 4.3 AI支援機能
- **学習計画提案**: 目標に基づいた学習計画の自動生成
- **最適学習時間**: 過去データから最適な学習時間を提案
- **ノート解析**: アップロードしたノートからSRSカード生成
- **音声入力**: 音声認識によるタスク追加

---

## 🎨 UI/UX改善

### デザインシステムの構築

#### カラーパレット（改善版）

```css
:root {
  /* Primary Colors */
  --color-primary-50: #ecfdf5;
  --color-primary-100: #d1fae5;
  --color-primary-200: #a7f3d0;
  --color-primary-300: #6ee7b7;
  --color-primary-400: #34d399;
  --color-primary-500: #10b981;
  --color-primary-600: #059669;
  --color-primary-700: #047857;
  --color-primary-800: #065f46;
  --color-primary-900: #064e3b;
  
  /* Neutral Colors */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;
  
  /* Semantic Colors */
  --color-success: var(--color-primary-600);
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Typography */
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-family-mono: 'Fira Code', 'Consolas', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-base: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### コンポーネントライブラリ

```typescript
// src/ui/components/Button.ts

export class Button extends Component {
  render(): string {
    const { variant = 'default', size = 'md', disabled = false } = this.props;
    
    const variantClasses = {
      default: 'btn-default',
      primary: 'btn-primary',
      danger: 'btn-danger',
      ghost: 'btn-ghost'
    };
    
    const sizeClasses = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg'
    };
    
    return `
      <button 
        class="btn ${variantClasses[variant]} ${sizeClasses[size]}"
        ${disabled ? 'disabled' : ''}
        ${this.props.onClick ? `data-action="${this.props.onClick}"` : ''}
      >
        ${this.props.icon ? `<span class="btn-icon">${this.props.icon}</span>` : ''}
        <span class="btn-label">${this.props.label}</span>
      </button>
    `;
  }
}
```

### インタラクションパターン

#### 1. タスク操作
- **ドラッグ&ドロップ**: タスクの並び替え、フォルダ間移動
- **スワイプアクション**: モバイルでの削除・完了操作
- **クイック編集**: インライン編集
- **一括操作**: 複数選択による一括処理

#### 2. フィードバック
- **楽観的更新**: UIを先に更新してレスポンス向上
- **アンドゥ/リドゥ**: 操作の取り消し・やり直し
- **プログレス表示**: 長時間処理の進捗表示
- **成功/エラートースト**: 操作結果の明確な通知

---

## 🔧 技術的負債の解消

### 1. コードの品質向上

#### ESLint & Prettier設定

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
      "alphabetize": { "order": "asc" }
    }]
  }
}
```

#### テストの追加

```typescript
// tests/unit/Timer.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timer } from '@/core/Timer';

describe('Timer', () => {
  let timer: Timer;
  let callbacks: any;
  
  beforeEach(() => {
    callbacks = {
      onStart: vi.fn(),
      onPause: vi.fn(),
      onComplete: vi.fn(),
      onTick: vi.fn()
    };
    timer = new Timer({ focusMinutes: 25 }, callbacks);
  });
  
  it('should start timer with correct duration', () => {
    timer.start(25 * 60 * 1000);
    expect(callbacks.onStart).toHaveBeenCalled();
  });
  
  it('should pause timer', () => {
    timer.start(25 * 60 * 1000);
    timer.pause();
    expect(callbacks.onPause).toHaveBeenCalled();
  });
  
  it('should emit tick events', (done) => {
    timer.start(1000);
    setTimeout(() => {
      expect(callbacks.onTick).toHaveBeenCalled();
      done();
    }, 150);
  });
  
  // 他のテストケース...
});
```

### 2. パフォーマンス最適化

#### 仮想スクロールの実装

```typescript
// src/ui/utils/VirtualScroller.ts

export class VirtualScroller<T> {
  private container: HTMLElement;
  private items: T[];
  private itemHeight: number;
  private visibleCount: number;
  private startIndex: number = 0;
  private renderItem: (item: T, index: number) => string;
  
  constructor(config: VirtualScrollerConfig<T>) {
    this.container = config.container;
    this.items = config.items;
    this.itemHeight = config.itemHeight;
    this.visibleCount = config.visibleCount;
    this.renderItem = config.renderItem;
    
    this.init();
  }
  
  private init(): void {
    this.container.style.height = `${this.visibleCount * this.itemHeight}px`;
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    this.render();
  }
  
  private handleScroll(): void {
    const scrollTop = this.container.scrollTop;
    const newStartIndex = Math.floor(scrollTop / this.itemHeight);
    
    if (newStartIndex !== this.startIndex) {
      this.startIndex = newStartIndex;
      this.render();
    }
  }
  
  private render(): void {
    const endIndex = Math.min(
      this.startIndex + this.visibleCount + 2,
      this.items.length
    );
    
    const visibleItems = this.items.slice(this.startIndex, endIndex);
    const offsetY = this.startIndex * this.itemHeight;
    
    const html = `
      <div style="transform: translateY(${offsetY}px);">
        ${visibleItems.map((item, i) => 
          this.renderItem(item, this.startIndex + i)
        ).join('')}
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  updateItems(items: T[]): void {
    this.items = items;
    this.render();
  }
}
```

#### デバウンス・スロットリング

```typescript
// src/utils/performance.ts

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用例
const handleSearch = debounce((query: string) => {
  // 検索処理
}, 300);

const handleScroll = throttle(() => {
  // スクロール処理
}, 100);
```

### 3. セキュリティ強化

#### XSS対策

```typescript
// src/utils/sanitize.ts

export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function sanitizeURL(url: string): string {
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '#';
    }
    return url;
  } catch {
    return '#';
  }
}
```

---

## 📅 実装スケジュール

### Month 1: 基盤構築

#### Week 1-2: アーキテクチャ設計と環境構築
- [ ] プロジェクト構造の決定
- [ ] TypeScript & ビルドツール設定
- [ ] テスト環境構築（Vitest）
- [ ] CI/CDパイプライン設定（GitHub Actions）
- [ ] ドキュメント整備

#### Week 3-4: コア機能の再実装
- [ ] データベース層（IndexedDB）
- [ ] 状態管理システム
- [ ] タイマーコア機能
- [ ] タスク管理基本機能
- [ ] セッション記録機能

### Month 2: 機能拡充

#### Week 5-6: UI/UX改善
- [ ] デザインシステム構築
- [ ] コンポーネントライブラリ
- [ ] レスポンシブ対応
- [ ] アクセシビリティ改善
- [ ] アニメーション実装

#### Week 7-8: 統計・分析機能
- [ ] 統計エンジンの再実装
- [ ] ダッシュボード改善
- [ ] チャート・グラフ実装
- [ ] データエクスポート機能
- [ ] レポート生成

### Month 3: 新機能開発

#### Week 9-10: SRS機能
- [ ] SRSエンジン実装
- [ ] カード作成UI
- [ ] デッキ管理
- [ ] 復習セッション
- [ ] 統計・進捗表示

#### Week 11-12: 高度な機能
- [ ] データ同期（オプション）
- [ ] オンボーディング
- [ ] パフォーマンス最適化
- [ ] バグ修正
- [ ] ドキュメント完成

### Month 4: テスト・リリース

#### Week 13-14: テストとバグ修正
- [ ] ユニットテスト完成度向上（80%以上）
- [ ] E2Eテストシナリオ実装
- [ ] パフォーマンステスト
- [ ] クロスブラウザテスト
- [ ] バグ修正

#### Week 15-16: リリース準備
- [ ] ベータテスト
- [ ] フィードバック対応
- [ ] 最終調整
- [ ] ドキュメント最終確認
- [ ] リリース

---

## 🔄 移行計画

### 既存ユーザーのデータ移行

#### 1. データマイグレーション

```typescript
// src/storage/migrations/v1_to_v2.ts

export async function migrateV1ToV2(): Promise<void> {
  // localStorage から旧データを取得
  const oldData = localStorage.getItem('studyapp.db.v1');
  if (!oldData) return;
  
  const oldDB = JSON.parse(oldData);
  
  // 新しいデータベースに移行
  const db = new DatabaseManager();
  await db.init();
  
  // タスクの移行
  for (const task of oldDB.tasks) {
    const newTask: Task = {
      ...task,
      tags: [],
      metadata: {},
      status: task.completed ? TaskStatus.Completed : 
              task.archived ? TaskStatus.Archived : TaskStatus.Active
    };
    await db.put('tasks', newTask);
  }
  
  // セッションの移行
  for (const session of oldDB.sessions) {
    const newSession: Session = {
      ...session,
      metadata: {}
    };
    await db.put('sessions', newSession);
  }
  
  // フォルダの移行
  for (const folder of oldDB.folders) {
    await db.put('folders', folder);
  }
  
  // 移行完了後、旧データをバックアップとして保存
  localStorage.setItem('studyapp.db.v1.backup', oldData);
  
  // 移行完了フラグ
  localStorage.setItem('studyapp.migration.v1_to_v2', 'complete');
}
```

#### 2. 段階的ロールアウト

1. **アルファ版**: 開発者自身でテスト（1-2週間）
2. **ベータ版**: 限定ユーザーでテスト（2-3週間）
   - フィードバック収集
   - バグ修正
3. **段階的リリース**: 
   - 5% → 25% → 50% → 100%
   - 各段階で問題がないか監視

#### 3. ロールバック計画

- 旧バージョンの維持
- データバックアップの自動作成
- 復元機能の実装

---

## 📊 成功指標（KPI）

### 技術指標
- コードカバレッジ: 80%以上
- Lighthouse スコア: 90以上（全項目）
- バンドルサイズ: 200KB以下（gzip圧縮後）
- 初回読み込み時間: 2秒以内
- Time to Interactive: 3秒以内

### ユーザー体験指標
- タスク作成完了率: 90%以上
- セッション継続率: 70%以上
- 1週間継続利用率: 40%以上
- エラー発生率: 1%以下

### 品質指標
- クリティカルバグ: 0件
- 高優先度バグ: 5件以下
- ユーザーフィードバックスコア: 4.0以上（5段階）

---

## 🎯 優先順位付け

### Must Have（必須）
1. コア機能の安定性（タイマー、タスク管理）
2. データ移行の確実性
3. パフォーマンス（読み込み速度、操作のスムーズさ）
4. モバイル対応
5. データバックアップ・復元

### Should Have（望ましい）
1. SRS機能
2. 高度な統計・分析
3. アクセシビリティ完全対応
4. オンボーディング
5. データ同期

### Could Have（あれば良い）
1. 共同学習機能
2. AI支援機能
3. カスタムテーマ
4. プラグインシステム
5. Chrome拡張版

### Won't Have（今回は対象外）
1. ネイティブアプリ版
2. サーバーサイド実装
3. ソーシャル機能（SNS連携など）
4. 有料プラン

---

## 📝 まとめ

この改善計画は、現在の Study Support アプリを **より堅牢で、拡張性が高く、ユーザーフレンドリーなアプリケーション** に生まれ変わらせることを目指しています。

### 主なポイント

1. **モジュラー設計**: コードの保守性と拡張性の向上
2. **TypeScript採用**: 型安全性とバグの早期発見
3. **IndexedDB移行**: データ容量制限の緩和
4. **テスト導入**: 品質保証とリファクタリングの安全性
5. **SRS機能**: 学習効率の大幅向上
6. **UI/UX改善**: より快適な使用体験
7. **パフォーマンス**: 高速で快適な動作

### 次のステップ

1. **承認・レビュー**: この計画書をレビューし、必要に応じて調整
2. **詳細設計**: 各機能の詳細仕様を策定
3. **開発開始**: Phase 1から順次実装
4. **継続的改善**: ユーザーフィードバックを元に改善

この計画に従って開発を進めることで、より優れた学習支援アプリケーションが完成することを確信しています。
