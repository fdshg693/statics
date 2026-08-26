// home.ts - ホームページ（ログイン済み画面）のロジック

import { UIManager } from './ui.js';
import { AuthManager } from './auth.js';
import { AppStorageManager } from './storage.js';

const authManager = AuthManager(AppStorageManager);
const uiManager = UIManager(authManager);

// 未ログインの場合はトップページにリダイレクト
uiManager.checkAuthAndRedirect(true);

// ユーザー名の表示
const usernameElement = document.getElementById('username') as HTMLElement;
const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;

const currentUser: string | null = authManager.getLoggedInUser();
if (currentUser) {
    usernameElement.textContent = currentUser;
}

// イベントリスナー: ログアウトボタン
logoutBtn.addEventListener('click', () => {
    authManager.logout();
    uiManager.navigateTo('index.html');
});
