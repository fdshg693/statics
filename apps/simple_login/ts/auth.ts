// auth.ts - 認証処理の責務

import { IStorageManager } from './storage.js';

export interface AuthResult {
    success: boolean;
    message: string;
}

export interface IAuthManager {
    register(username: string, password: string, passwordConfirm: string): AuthResult;
    login(username: string, password: string): AuthResult;
    logout(): void;
    isLoggedIn(): boolean;
    getLoggedInUser(): string | null;
}

export const AuthManager = (storageManager: IStorageManager): IAuthManager => ({
    // ユーザー登録
    register(username: string, password: string, passwordConfirm: string): AuthResult {
        // バリデーション
        if (!username || username.trim() === '') {
            return { success: false, message: 'ユーザー名を入力してください' };
        }

        if (password.length < 4) {
            return { success: false, message: 'パスワードは4文字以上にしてください' };
        }

        if (password !== passwordConfirm) {
            return { success: false, message: 'パスワードが一致しません' };
        }

        // 既存ユーザーのチェック
        if (storageManager.userExists(username)) {
            return { success: false, message: 'このユーザー名は既に使用されています' };
        }

        // ユーザー情報を保存
        storageManager.saveUser(username, password);
        return { success: true, message: '登録が完了しました！' };
    },

    // ログイン処理
    login(username: string, password: string): AuthResult {
        // バリデーション
        if (!username || username.trim() === '' || !password) {
            return { success: false, message: 'ユーザー名とパスワードを入力してください' };
        }

        // ユーザー情報の取得
        const storedPassword: string | null = storageManager.getUser(username);

        if (!storedPassword) {
            return { success: false, message: 'ユーザーが見つかりません' };
        }

        // パスワード照合
        if (storedPassword === password) {
            storageManager.setCurrentUser(username);
            return { success: true, message: 'ログインに成功しました' };
        } else {
            return { success: false, message: 'パスワードが正しくありません' };
        }
    },

    // ログアウト処理
    logout(): void {
        storageManager.clearCurrentUser();
    },

    // ログイン状態のチェック
    isLoggedIn(): boolean {
        return storageManager.getCurrentUser() !== null;
    },

    // ログインユーザーの取得
    getLoggedInUser(): string | null {
        return storageManager.getCurrentUser();
    }
});
