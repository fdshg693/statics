// storage.ts - localStorage操作の責務

export interface IStorageManager {
    saveUser(username: string, password: string): void;
    getUser(username: string): string | null;
    userExists(username: string): boolean;
    setCurrentUser(username: string): void;
    getCurrentUser(): string | null;
    clearCurrentUser(): void;
}

export const AppStorageManager: IStorageManager = {
    // ユーザー情報の保存
    saveUser(username: string, password: string): void {
        localStorage.setItem(`user_${username}`, password);
    },

    // ユーザー情報の取得
    getUser(username: string): string | null {
        return localStorage.getItem(`user_${username}`);
    },

    // ユーザーの存在確認
    userExists(username: string): boolean {
        return localStorage.getItem(`user_${username}`) !== null;
    },

    // 現在のログインユーザーの保存
    setCurrentUser(username: string): void {
        localStorage.setItem('currentUser', username);
    },

    // 現在のログインユーザーの取得
    getCurrentUser(): string | null {
        return localStorage.getItem('currentUser');
    },

    // 現在のログインユーザーの削除
    clearCurrentUser(): void {
        localStorage.removeItem('currentUser');
    }
};
