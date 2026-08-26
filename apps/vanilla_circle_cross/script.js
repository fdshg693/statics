// ゲーム定数
const GAME_CONFIG = {
    BOARD_SIZE: 3,
    EMPTY_CELL: '',
    PLAYERS: {
        O: 'o',
        X: 'x'
    },
    SYMBOLS: {
        o: '〇',
        x: '×'
    }
};

// 勝利パターンを生成
const generateWinningConditions = (size) => {
    const conditions = [];
    
    // 横の列
    for (let row = 0; row < size; row++) {
        const line = [];
        for (let col = 0; col < size; col++) {
            line.push(row * size + col);
        }
        conditions.push(line);
    }
    
    // 縦の列
    for (let col = 0; col < size; col++) {
        const line = [];
        for (let row = 0; row < size; row++) {
            line.push(row * size + col);
        }
        conditions.push(line);
    }
    
    // 斜め（左上から右下）
    const diagonal1 = [];
    for (let i = 0; i < size; i++) {
        diagonal1.push(i * size + i);
    }
    conditions.push(diagonal1);
    
    // 斜め（右上から左下）
    const diagonal2 = [];
    for (let i = 0; i < size; i++) {
        diagonal2.push(i * size + (size - 1 - i));
    }
    conditions.push(diagonal2);
    
    return conditions;
};

// ゲームの状態
let currentPlayer = GAME_CONFIG.PLAYERS.O;
let gameBoard = Array(GAME_CONFIG.BOARD_SIZE ** 2).fill(GAME_CONFIG.EMPTY_CELL);
let gameActive = true;

// DOM要素の取得
const cells = document.querySelectorAll('.cell');
const messageElement = document.getElementById('message');
const resetBtn = document.getElementById('resetBtn');

// 勝利パターン
const winningConditions = generateWinningConditions(GAME_CONFIG.BOARD_SIZE);

// ヘルパー関数
const getPlayerSymbol = (player) => GAME_CONFIG.SYMBOLS[player];
const switchPlayer = (player) => player === GAME_CONFIG.PLAYERS.O ? GAME_CONFIG.PLAYERS.X : GAME_CONFIG.PLAYERS.O;

// セルがクリックされた時の処理
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    // すでに埋まっている、またはゲームが終了している場合は何もしない
    if (gameBoard[index] !== GAME_CONFIG.EMPTY_CELL || !gameActive) {
        return;
    }

    // マスを更新
    gameBoard[index] = currentPlayer;
    cell.textContent = getPlayerSymbol(currentPlayer);
    cell.classList.add(currentPlayer);
    cell.classList.add('taken');

    // 勝敗判定
    checkResult();
}

// 勝敗判定
function checkResult() {
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const condition = winningConditions[i];
        const firstCell = gameBoard[condition[0]];
        
        if (firstCell === GAME_CONFIG.EMPTY_CELL) {
            continue;
        }
        
        if (condition.every(index => gameBoard[index] === firstCell)) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        messageElement.textContent = `${getPlayerSymbol(currentPlayer)}の勝ち！`;
        gameActive = false;
        return;
    }

    // 引き分け判定
    if (!gameBoard.includes(GAME_CONFIG.EMPTY_CELL)) {
        messageElement.textContent = '引き分けです！';
        gameActive = false;
        return;
    }

    // プレイヤー交代
    currentPlayer = switchPlayer(currentPlayer);
    messageElement.textContent = `${getPlayerSymbol(currentPlayer)}の番です`;
}

// ゲームをリセット
function resetGame() {
    currentPlayer = GAME_CONFIG.PLAYERS.O;
    gameBoard = Array(GAME_CONFIG.BOARD_SIZE ** 2).fill(GAME_CONFIG.EMPTY_CELL);
    gameActive = true;
    messageElement.textContent = `${getPlayerSymbol(currentPlayer)}の番です`;

    cells.forEach(cell => {
        cell.textContent = GAME_CONFIG.EMPTY_CELL;
        cell.classList.remove(GAME_CONFIG.PLAYERS.O, GAME_CONFIG.PLAYERS.X, 'taken');
    });
}

// イベントリスナーの登録
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
