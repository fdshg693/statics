/**
 * RPG Battle Game - Start Screen
 * スタート画面のロジック
 */

import { clearActiveSaveId, clearAllSaves, getSortedSaves, migrateLegacySave, setActiveSaveId } from '../save/saveRepository.js';

/**
 * セーブデータの存在チェック
 */
function checkSaveData(): void {
    migrateLegacySave();
    const list = getSortedSaves();
    const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
    const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    const saveInfo = document.getElementById('saveInfo') as HTMLElement;

    continueBtn.disabled = list.length === 0;
    resetBtn.disabled = list.length === 0;

    if (list.length > 0) {
        const latest = list[0];
        saveInfo.textContent = `最新の記録: ${latest.label}`;
    } else {
        saveInfo.textContent = '';
    }
}

/**
 * 新規ゲーム開始
 */
function newGame(): void {
    // 現在のアクティブセーブだけ解除
    clearActiveSaveId();
    
    // ゲーム画面へ遷移
    window.location.href = 'battle/index.html';
}

/**
 * ゲーム再開
 */
function continueGame(): void {
    const list = getSortedSaves();
    if (list.length === 0) {
        alert('セーブデータが見つかりません。');
        return;
    }

    setActiveSaveId(list[0].id);

    // ゲーム画面へ遷移
    window.location.href = 'battle/index.html';
}

/**
 * ゲームリセット
 */
function resetGame(): void {
    const list = getSortedSaves();
    if (list.length === 0) {
        alert('セーブデータがありません。');
        return;
    }

    if (confirm('セーブデータを削除してもよろしいですか？')) {
        clearAllSaves();
        checkSaveData();
        alert('セーブデータを削除しました。');
    }
}

// モジュール環境のためにグローバルへ公開
(window as any).newGame = newGame;
(window as any).continueGame = continueGame;
(window as any).resetGame = resetGame;

// ページ読み込み時にセーブデータをチェック
window.addEventListener('DOMContentLoaded', checkSaveData);
