// login.ts - ログインページのロジック

import { UIManager } from './ui.js';
import { AuthManager } from './auth.js';
import { AppStorageManager } from './storage.js';

const authManager = AuthManager(AppStorageManager);
const uiManager = UIManager(authManager);

// ログイン済みの場合はホームにリダイレクト
uiManager.checkAuthAndRedirect(false);

// フォーム要素の取得
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
const messageElement = document.getElementById('message') as HTMLElement;

// URLパラメータからユーザー名を取得（新規登録後の遷移用）
const urlParams = new URLSearchParams(window.location.search);
const prefilledUsername: string | null = urlParams.get('username');
if (prefilledUsername) {
    usernameInput.value = prefilledUsername;
    passwordInput.focus();
}

// イベントリスナー: ログインフォーム送信
loginForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();

    const username: string = usernameInput.value.trim();
    const password: string = passwordInput.value;

    // メッセージのクリア
    uiManager.clearMessage(messageElement);

    // 送信ボタンを取得
    const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalBtnText = submitBtn.textContent || 'ログイン';

    // ローディング状態の表示と入力の無効化
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = `<span class="spinner"></span>ログイン中...`;
    backBtn.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true;

    // 疑似的な非同期処理（遅延）の再現
    setTimeout(() => {
        const result = authManager.login(username, password);

        if (result.success) {
            // ログイン成功時はそのまま画面遷移
            uiManager.navigateTo('home.html');
        } else {
            // ログイン失敗時は元の状態に戻してエラーを表示
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalBtnText;
            backBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;

            uiManager.showMessage(messageElement, result.message, 'error');
            passwordInput.focus();
        }
    }, 800);
});

// イベントリスナー: 戻るボタン
backBtn.addEventListener('click', () => {
    uiManager.navigateTo('index.html');
});
