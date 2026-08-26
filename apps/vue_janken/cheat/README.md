# チート機能

`cheat/`にはコンソールから、javascriptのコードを実行してじゃんけんアプリの挙動を確認したり、操作したりするためのスクリプトが入っています。

## 使い方

### 1. ゲームページを開く

まず、じゃんけんゲームのページをブラウザで開きます。

### 1.5. デバッグモードを確認する

`js/config.js` の `debug.enabled` が `true` のときだけ、チート関数が有効になります。

```javascript
export const APP_CONFIG = Object.freeze({
  debug: Object.freeze({
    enabled: true
  })
});
```

### 2. チートスクリプトを読み込む

ブラウザの開発者ツール（F12キー）を開き、コンソールタブを選択します。

以下のコードをコピーして、コンソールに貼り付けて実行します：

```javascript
// チートスクリプトを読み込む
const script = document.createElement("script");
script.src = "./cheat/cheat.js";
document.head.appendChild(script);
```

または、直接 `cheat.js` の内容をコンソールにコピー＆ペーストしても動作します。

### 3. チート関数を使う

スクリプトが読み込まれたら、以下の関数が使えるようになります。

## チート関数一覧

### 📋 ヘルプ表示

```javascript
cheatHelp();
```

すべてのチート関数の使い方を表示します。

### 🎮 自動プレイ

```javascript
autoPlay(回数, 手, 待機時間);
```

指定した回数だけジャンケンを自動実行します。

**パラメータ:**

- `回数`: 実行する回数（デフォルト: 10）
- `手`: プレイヤーの手
  - `'rock'` - グー
  - `'paper'` - パー
  - `'scissors'` - チョキ
  - `'random'` - ランダム（デフォルト）
- `待機時間`: 各実行間の待機時間（ミリ秒、デフォルト: 500）

**使用例:**

```javascript
// ランダムな手で10回自動プレイ
autoPlay();

// グーで20回自動プレイ（300ms間隔）
autoPlay(20, "rock", 300);

// パーで50回自動プレイ
autoPlay(50, "paper");

// チョキで100回高速プレイ（100ms間隔）
autoPlay(100, "scissors", 100);
```

### 🔧 コンピューターの手を固定

```javascript
fixComputerChoice(手);
```

コンピューターの手を固定して、常に同じ手を出させます。

**パラメータ:**

- `手`: 固定する手
  - `'rock'` - グー
  - `'paper'` - パー
  - `'scissors'` - チョキ
  - `null` - 固定を解除

**ショートカット関数:**

```javascript
fixRock(); // グーに固定
fixPaper(); // パーに固定
fixScissors(); // チョキに固定
```

**使用例:**

```javascript
// コンピューターをグーに固定
fixRock();

// または
fixComputerChoice("rock");

// パーに固定（プレイヤーがチョキを選べば必ず勝てる）
fixPaper();

// 固定を解除
fixComputerChoice(null);
```

**活用例:**

```javascript
// コンピューターをグーに固定して、パーで100回勝つ
fixRock();
autoPlay(100, "paper", 200);

// 元に戻す
fixComputerChoice(null);
```

### 📊 スコア操作

#### スコア表示

```javascript
showScore();
```

現在のスコアをコンソールに表示します。

#### スコア設定

```javascript
setScore(勝, 負, あいこ);
```

スコアを強制的に設定します（設定後、ページをリロードする必要があります）。

**使用例:**

```javascript
// 現在のスコアを確認
showScore();

// 100勝0敗0引き分けに設定
setScore(100, 0, 0);
// ページをリロード

// 50勝50敗10引き分けに設定
setScore(50, 50, 10);
// ページをリロード
```

## 実践例

### 例1: 素早く勝率100%を達成する

```javascript
// 1. チートスクリプトを読み込む
const script = document.createElement("script");
script.src = "./cheat/cheat.js";
document.head.appendChild(script);

// 2. コンピューターをグーに固定
fixRock();

// 3. パーで100回自動プレイ（すべて勝ち）
autoPlay(100, "paper", 200);
```

### 例2: 大量のデータを生成する

```javascript
// ランダムな手で1000回プレイ（高速）
autoPlay(1000, "random", 50);
```

### 例3: 特定の勝率を作る

```javascript
// まずチョキに固定してグーで負ける（50回）
fixScissors();
autoPlay(50, "rock", 100);

// 次にグーに固定してパーで勝つ（50回）
fixRock();
autoPlay(50, "paper", 100);

// 固定を解除
fixComputerChoice(null);

// スコアを確認
showScore(); // 勝率50%くらいになっているはず
```

## 注意事項

- チート関数は開発・テスト・デモ用です
- チート関数の有効/無効は `js/config.js` の `debug.enabled` で切り替えます
- ブラウザをリロードすると、チートスクリプトは再読み込みが必要です
- スコア操作は `localStorage` に保存されるため、ブラウザを閉じても残ります
