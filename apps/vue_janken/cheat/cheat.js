/**
 * じゃんけんゲーム チート関数集
 * ブラウザのコンソールで使用します
 */

const DEBUG_API_KEY = '__JANKEN_DEBUG__';
const CHOICES = ['rock', 'paper', 'scissors'];
const CHOICE_LABELS = Object.freeze({
    rock: '✊グー',
    paper: '✋パー',
    scissors: '✌️チョキ'
});

function getDebugApi() {
    const debugApi = window[DEBUG_API_KEY];

    if (!debugApi || !debugApi.enabled) {
        console.error('❌ デバッグモードが無効です。js/config.js の debug.enabled を確認してください。');
        return null;
    }

    return debugApi;
}

function getApp() {
    const debugApi = getDebugApi();
    if (!debugApi) {
        return null;
    }

    if (!debugApi.app) {
        console.error('❌ アプリが見つかりません。ページを読み込んでから実行してください。');
        return null;
    }

    return debugApi.app;
}

function validateChoice(choice, allowRandom = false) {
    if (allowRandom && choice === 'random') {
        return true;
    }

    return CHOICES.includes(choice);
}

/**
 * 指定した回数だけジャンケンを自動実行する
 * @param {number} count - 実行回数
 * @param {string} playerChoice - プレイヤーの手 ('rock', 'paper', 'scissors', 'random')
 * @param {number} delay - 各実行間の待機時間（ミリ秒）
 */
window.autoPlay = async function(count = 10, playerChoice = 'random', delay = 500) {
    const app = getApp();
    if (!app) {
        return;
    }

    if (!validateChoice(playerChoice, true)) {
        console.error(`❌ 無効な手: ${playerChoice}。'rock', 'paper', 'scissors', 'random' のいずれかを指定してください。`);
        return;
    }

    console.log(`🎮 自動プレイを開始: ${count}回`);

    for (let i = 0; i < count; i++) {
        const choice = playerChoice === 'random'
            ? CHOICES[Math.floor(Math.random() * CHOICES.length)]
            : playerChoice;

        app.play(choice);
        console.log(`${i + 1}/${count} - プレイヤー: ${app.getEmoji(choice)}`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        app.reset();
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('✅ 自動プレイが完了しました');
    console.log(`📊 結果 - 勝ち: ${app.score.wins}, 負け: ${app.score.losses}, あいこ: ${app.score.draws}`);
};

/**
 * コンピューターの手を固定する（チートモード）
 * @param {string} choice - 固定する手 ('rock', 'paper', 'scissors') または null で解除
 */
window.fixComputerChoice = function(choice) {
    const debugApi = getDebugApi();
    if (!debugApi) {
        return;
    }

    if (choice === null) {
        debugApi.clearComputerChoiceOverride();
        console.log('✅ コンピューターの手の固定を解除しました');
        return;
    }

    if (!validateChoice(choice)) {
        console.error(`❌ 無効な手: ${choice}。'rock', 'paper', 'scissors' のいずれかを指定してください。`);
        return;
    }

    debugApi.setComputerChoiceOverride(choice);
    console.log(`🔧 コンピューターの手を ${CHOICE_LABELS[choice]} に固定しました`);
    console.log('💡 解除するには: fixComputerChoice(null)');
};

/**
 * コンピューターの手を常にグーに固定する（ショートカット）
 */
window.fixRock = function() {
    window.fixComputerChoice('rock');
};

/**
 * コンピューターの手を常にパーに固定する（ショートカット）
 */
window.fixPaper = function() {
    window.fixComputerChoice('paper');
};

/**
 * コンピューターの手を常にチョキに固定する（ショートカット）
 */
window.fixScissors = function() {
    window.fixComputerChoice('scissors');
};

/**
 * 現在のスコアを表示
 */
window.showScore = function() {
    const app = getApp();
    if (!app) {
        return;
    }

    console.log('📊 現在のスコア');
    console.log(`勝ち: ${app.score.wins}`);
    console.log(`負け: ${app.score.losses}`);
    console.log(`あいこ: ${app.score.draws}`);
    console.log(`合計: ${app.totalGames}`);
    console.log(`勝率: ${app.winRate}%`);
};

/**
 * スコアを強制的に設定する
 * @param {number} wins - 勝利数
 * @param {number} losses - 敗北数
 * @param {number} draws - 引き分け数
 */
window.setScore = function(wins = 0, losses = 0, draws = 0) {
    if (!getDebugApi()) {
        return;
    }

    const score = { wins, losses, draws };
    localStorage.setItem('jankenScore', JSON.stringify(score));
    console.log('✅ スコアを設定しました。ページをリロードしてください。');
};

/**
 * チート関数のヘルプを表示
 */
window.cheatHelp = function() {
    const debugState = window[DEBUG_API_KEY]?.enabled ? '有効' : '無効';

    console.log(`
🎮 じゃんけんゲーム チート関数一覧

【デバッグモード】
  現在の状態: ${debugState}
  設定場所: js/config.js

【自動プレイ】
  autoPlay(回数, 手, 待機時間)
    - 回数: 実行する回数（デフォルト: 10）
    - 手: 'rock'(グー), 'paper'(パー), 'scissors'(チョキ), 'random'(ランダム)（デフォルト: 'random'）
    - 待機時間: 各実行間の待機時間（ミリ秒）（デフォルト: 500）

  例: autoPlay(20, 'rock', 300)  // グーで20回、300ms間隔で実行

【コンピューターの手を固定】
  fixComputerChoice(手)
    - 手: 'rock', 'paper', 'scissors' または null（解除）

  fixRock()      // グーに固定（ショートカット）
  fixPaper()     // パーに固定（ショートカット）
  fixScissors()  // チョキに固定（ショートカット）

  例: fixRock()  // コンピューターをグーに固定
      fixComputerChoice(null)  // 固定を解除

【スコア操作】
  showScore()              // 現在のスコアを表示
  setScore(勝, 負, あいこ)  // スコアを強制設定（要リロード）

  例: setScore(100, 0, 0)  // 100勝0敗0引き分けに設定

【ヘルプ】
  cheatHelp()  // このヘルプを表示

💡 チート関数を使う前に、必ずゲームページを開いてください！
`);
};

console.log('🎮 じゃんけんゲーム チート関数が読み込まれました');
console.log('💡 使い方を確認するには: cheatHelp()');
