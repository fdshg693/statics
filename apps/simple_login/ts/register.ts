// register.ts - 新規登録ページのロジック

import { UIManager } from './ui.js';
import { AuthManager } from './auth.js';
import { AppStorageManager } from './storage.js';

const authManager = AuthManager(AppStorageManager);
const uiManager = UIManager(authManager);

// ログイン済みの場合はホームにリダイレクト
uiManager.checkAuthAndRedirect(false);

// フォーム要素の取得
const registerForm = document.getElementById('registerForm') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const passwordConfirmInput = document.getElementById('passwordConfirm') as HTMLInputElement;
const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
const messageElement = document.getElementById('message') as HTMLElement;

// イベントリスナー: 新規登録フォーム送信
registerForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();

    const username: string = usernameInput.value.trim();
    const password: string = passwordInput.value;
    const passwordConfirm: string = passwordConfirmInput.value;

    // メッセージのクリア
    uiManager.clearMessage(messageElement);

    // 送信ボタンを取得
    const submitBtn = registerForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalBtnText = submitBtn.textContent || '登録';

    // ローディング状態の表示と入力の無効化
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = `<span class="spinner"></span>登録中...`;
    backBtn.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true;
    passwordConfirmInput.disabled = true;

    // 疑似的な非同期処理（遅延）の再現
    setTimeout(() => {
        const result = authManager.register(username, password, passwordConfirm);

        if (result.success) {
            // 登録成功時はメッセージを表示してリセット
            uiManager.showMessage(messageElement, result.message + ' ログインしてください', 'success');
            registerForm.reset();

            // 元の状態に戻す
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalBtnText;
            backBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            passwordConfirmInput.disabled = false;

            // 1.5秒後にログイン画面に遷移
            setTimeout(() => {
                uiManager.navigateTo(`login.html?username=${encodeURIComponent(username)}`);
            }, 1500);
        } else {
            // 登録失敗時は元の状態に戻してエラーを表示
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalBtnText;
            backBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            passwordConfirmInput.disabled = false;

            uiManager.showMessage(messageElement, result.message, 'error');
        }
    }, 800);
});

// イベントリスナー: 戻るボタン
backBtn.addEventListener('click', () => {
    uiManager.navigateTo('index.html');
});
