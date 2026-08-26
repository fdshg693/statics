// index.ts - トップページ（未ログイン画面）のロジック

import { UIManager } from './ui.js';
import { AuthManager } from './auth.js';
import { AppStorageManager } from './storage.js';

const authManager = AuthManager(AppStorageManager);
const uiManager = UIManager(authManager);

// ログイン済みの場合はホームにリダイレクト
uiManager.checkAuthAndRedirect(false);

// ボタン要素の取得
const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
const registerBtn = document.getElementById('registerBtn') as HTMLButtonElement;

// イベントリスナー: ログインボタン
loginBtn.addEventListener('click', () => {
    uiManager.navigateTo('login.html');
});

// イベントリスナー: 新規登録ボタン
registerBtn.addEventListener('click', () => {
    uiManager.navigateTo('register.html');
});
