/**
 * UI Module
 * Study Support NG v1.0
 * 
 * Handles UI components: navigation, toasts, modals, etc.
 */

import { store } from '../core/store.js';

class Toast {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isShowing = false;
  }

  init() {
    // Create toast container if not exists
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, options = {}) {
    const {
      type = 'info', // success, error, warning, info
      duration = 3000,
      icon = null,
      action = null,
      actionText = '取消'
    } = options;

    const toast = {
      id: Date.now(),
      message,
      type,
      duration,
      icon: icon || this.getDefaultIcon(type),
      action,
      actionText
    };

    this.queue.push(toast);
    this.processQueue();
  }

  getDefaultIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  processQueue() {
    if (this.isShowing || this.queue.length === 0) return;
    
    const toast = this.queue.shift();
    this.displayToast(toast);
  }

  displayToast(toast) {
    this.isShowing = true;

    const element = document.createElement('div');
    element.className = `toast toast--${toast.type}`;
    element.innerHTML = `
      <span class="toast__icon">${toast.icon}</span>
      <span class="toast__message">${toast.message}</span>
      ${toast.action ? `<button class="toast__action">${toast.actionText}</button>` : ''}
      <button class="toast__close">×</button>
    `;

    // Add to container
    this.container.appendChild(element);

    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('toast--visible');
    });

    // Event listeners
    element.querySelector('.toast__close')?.addEventListener('click', () => {
      this.removeToast(element);
    });

    if (toast.action) {
      element.querySelector('.toast__action')?.addEventListener('click', () => {
        toast.action();
        this.removeToast(element);
      });
    }

    // Auto remove
    if (toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(element);
      }, toast.duration);
    }
  }

  removeToast(element) {
    element.classList.remove('toast--visible');
    element.classList.add('toast--hiding');

    setTimeout(() => {
      element.remove();
      this.isShowing = false;
      this.processQueue();
    }, 300);
  }

  success(message, options = {}) {
    this.show(message, { ...options, type: 'success' });
  }

  error(message, options = {}) {
    this.show(message, { ...options, type: 'error' });
  }

  warning(message, options = {}) {
    this.show(message, { ...options, type: 'warning' });
  }

  info(message, options = {}) {
    this.show(message, { ...options, type: 'info' });
  }
}

class Navigation {
  constructor() {
    this.currentView = 'timer';
    this.navItems = [];
    this.views = [];
  }

  init() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.views = document.querySelectorAll('.view');
    
    this.bindEvents();
    this.restoreLastView();
  }

  bindEvents() {
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) {
          this.switchTo(view);
        }
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state?.view) {
        this.switchTo(e.state.view, false);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Alt + number to switch views
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const viewMap = {
          '1': 'timer',
          '2': 'tasks',
          '3': 'stats',
          '4': 'achievements',
          '5': 'settings'
        };
        
        const view = viewMap[e.key];
        if (view) {
          e.preventDefault();
          this.switchTo(view);
        }
      }
    });
  }

  switchTo(viewName, pushState = true) {
    // Update nav items
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    this.views.forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}-view`);
    });

    this.currentView = viewName;

    // Save to sessionStorage
    sessionStorage.setItem('currentView', viewName);

    // Update history
    if (pushState) {
      history.pushState({ view: viewName }, '', `#${viewName}`);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('view-changed', {
      detail: { view: viewName }
    }));
  }

  restoreLastView() {
    // Check URL hash first
    const hash = location.hash.slice(1);
    if (hash && ['timer', 'tasks', 'stats', 'achievements', 'settings'].includes(hash)) {
      this.switchTo(hash, false);
      return;
    }

    // Then check sessionStorage
    const savedView = sessionStorage.getItem('currentView');
    if (savedView) {
      this.switchTo(savedView, false);
    }
  }

  getCurrentView() {
    return this.currentView;
  }
}

class Modal {
  constructor() {
    this.overlay = null;
    this.activeModal = null;
  }

  init() {
    this.overlay = document.getElementById('modal-overlay');
    
    // Close modal on overlay click
    this.overlay?.addEventListener('click', () => {
      this.closeActive();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeActive();
      }
    });

    // Prevent modal content click from closing
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  }

  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    this.overlay?.classList.add('active');
    modal.classList.add('active');
    this.activeModal = modal;

    // Focus first input
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('modal-opened', {
      detail: { modalId }
    }));
  }

  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    this.overlay?.classList.remove('active');
    modal.classList.remove('active');
    
    if (this.activeModal === modal) {
      this.activeModal = null;
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('modal-closed', {
      detail: { modalId }
    }));
  }

  closeActive() {
    if (this.activeModal) {
      this.close(this.activeModal.id);
    }
  }

  isOpen(modalId) {
    const modal = document.getElementById(modalId);
    return modal?.classList.contains('active') || false;
  }
}

class LoadingIndicator {
  constructor() {
    this.element = null;
    this.counter = 0;
  }

  init() {
    // Create loading indicator
    this.element = document.createElement('div');
    this.element.className = 'loading-indicator';
    this.element.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-text">読み込み中...</span>
    `;
    document.body.appendChild(this.element);
  }

  show(text = '読み込み中...') {
    this.counter++;
    this.element.querySelector('.loading-text').textContent = text;
    this.element.classList.add('active');
  }

  hide() {
    this.counter = Math.max(0, this.counter - 1);
    if (this.counter === 0) {
      this.element.classList.remove('active');
    }
  }

  forceHide() {
    this.counter = 0;
    this.element.classList.remove('active');
  }
}

// Create instances
export const toast = new Toast();
export const navigation = new Navigation();
export const modal = new Modal();
export const loading = new LoadingIndicator();

// UI Module initialization
export function initUI() {
  toast.init();
  navigation.init();
  modal.init();
  loading.init();
  
  // Setup service worker update notification
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      toast.info('新しいバージョンが利用可能です', {
        duration: 0,
        action: () => location.reload(),
        actionText: '更新'
      });
    });
  }
}
