/**
 * ヘッダービュー
 */

import { App } from '@/core/App';

export class HeaderView {
  private app: App;
  private container: HTMLElement | null = null;

  constructor(app: App) {
    this.app = app;
  }

  render(): void {
    this.container = document.getElementById('header');
    if (!this.container) return;

    this.container.innerHTML = `
      <header class="app-header">
        <h1 class="app-title">📚 Study Support v2</h1>
        <nav class="tabs">
          <button class="tab-button active" data-tab="session">
            セッション
          </button>
          <button class="tab-button" data-tab="dashboard">
            ダッシュボード
          </button>
          <button class="tab-button" data-tab="settings">
            設定
          </button>
        </nav>
      </header>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const tabs = this.container?.querySelectorAll('.tab-button');
    tabs?.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName || 'session');
      });
    });
  }

  private switchTab(tabName: string): void {
    // タブの切り替え
    const tabs = this.container?.querySelectorAll('.tab-button');
    tabs?.forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // ビューの切り替え
    document.querySelector('.session-view')?.classList.toggle('hidden', tabName !== 'session');
    document
      .getElementById('dashboard-view')
      ?.classList.toggle('hidden', tabName !== 'dashboard');
    document
      .getElementById('settings-view')
      ?.classList.toggle('hidden', tabName !== 'settings');
  }
}
