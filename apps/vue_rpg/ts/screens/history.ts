/**
 * RPG Battle Game - Save History
 */

import { clearAllSaves, formatTime, getSortedSaves, removeSave, setActiveSaveId } from '../save/saveRepository.js';

function renderSaveList(): void {
    const saveList = document.getElementById('saveList') as HTMLElement;
    const list = getSortedSaves();

    if (!saveList) return;

    if (list.length === 0) {
        saveList.innerHTML = '<div class="save-empty">保存履歴がありません</div>';
        return;
    }

    saveList.innerHTML = '';

    for (const entry of list) {
        const card = document.createElement('div');
        card.className = 'save-card';

        const meta = document.createElement('div');
        meta.className = 'save-meta';

        const label = document.createElement('div');
        label.className = 'save-label';
        label.textContent = entry.label;

        const time = document.createElement('div');
        time.className = 'save-time';
        time.textContent = formatTime(entry.updatedAt);

        meta.appendChild(label);
        meta.appendChild(time);

        const actions = document.createElement('div');
        actions.className = 'save-actions';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'resume-btn';
        resumeBtn.textContent = '再開';
        resumeBtn.addEventListener('click', () => {
            setActiveSaveId(entry.id);
            window.location.href = 'battle/index.html';
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
            if (!confirm('この記録を削除してもよろしいですか？')) return;
            removeSave(entry.id);
            renderSaveList();
        });

        actions.appendChild(resumeBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(meta);
        card.appendChild(actions);

        saveList.appendChild(card);
    }
}

function bindActions(): void {
    const clearAllBtn = document.getElementById('clearAllBtn') as HTMLButtonElement;
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (!confirm('すべての保存履歴を削除してもよろしいですか？')) return;
            clearAllSaves();
            renderSaveList();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    bindActions();
    renderSaveList();
});
