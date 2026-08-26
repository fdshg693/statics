// ui.ts - UI操作の責務

import { IAuthManager } from './auth.js';

export type MessageType = 'error' | 'success';

export interface IUIManager {
    showMessage(element: HTMLElement, message: string, type: MessageType): void;
    clearMessage(element: HTMLElement): void;
    navigateTo(page: string): void;
    checkAuthAndRedirect(requireAuth?: boolean): boolean;
}

function initThemeSystem(): void {
    if (document.getElementById('themeToggle')) return;

    // 背景の装飾用オーブの生成
    const orb1 = document.createElement('div');
    orb1.className = 'bg-orb orb-1';
    const orb2 = document.createElement('div');
    orb2.className = 'bg-orb orb-2';
    document.body.appendChild(orb1);
    document.body.appendChild(orb2);

    // テーマ切り替えボタンの生成
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'themeToggle';
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'テーマ切り替え');
    toggleBtn.innerHTML = `
        <span class="sun-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
        </span>
        <span class="moon-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
        </span>
    `;
    document.body.appendChild(toggleBtn);

    // 初期テーマの設定
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // クリックイベントの設定
    toggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function initPasswordToggles(): void {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
        const wrapper = btn.closest('.password-wrapper');
        if (!wrapper) return;
        const input = wrapper.querySelector('input') as HTMLInputElement;
        const eyeOpen = btn.querySelector('.eye-open') as HTMLElement;
        const eyeClosed = btn.querySelector('.eye-closed') as HTMLElement;

        if (!input || !eyeOpen || !eyeClosed) return;

        btn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    });
}

export const UIManager = (authManager: IAuthManager): IUIManager => {
    // テーマシステムとパスワードトグルの初期化
    if (document.body) {
        initThemeSystem();
        initPasswordToggles();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initThemeSystem();
            initPasswordToggles();
        });
    }

    return {
        // メッセージの表示
        showMessage(element: HTMLElement, message: string, type: MessageType): void {
            element.textContent = message;
            element.className = `message ${type}`;
        },

        // メッセージのクリア
        clearMessage(element: HTMLElement): void {
            element.textContent = '';
            element.className = 'message';
        },

        // ページ遷移
        navigateTo(page: string): void {
            window.location.href = page;
        },

        // ログイン状態の確認とリダイレクト
        checkAuthAndRedirect(requireAuth: boolean = true): boolean {
            const isLoggedIn: boolean = authManager.isLoggedIn();

            if (requireAuth && !isLoggedIn) {
                // 認証が必要なページで未ログインの場合
                this.navigateTo('index.html');
                return false;
            } else if (!requireAuth && isLoggedIn) {
                // 未ログインページでログイン済みの場合
                this.navigateTo('home.html');
                return false;
            }

            return true;
        }
    };
};
