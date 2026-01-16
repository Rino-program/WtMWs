/**
 * Creative Lab - 共通ユーティリティ関数
 */

// ストレージユーティリティ
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Storage.get failed for key "${key}":`, error.message);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Storage.set failed for key "${key}":`, error.message);
            return false;
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    }
};

// 通知システム
const Toast = {
    container: null,
    
    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${this.getIcon(type)}</span>
            <span>${message}</span>
        `;
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    },
    
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

// モーダル
const Modal = {
    create(content, options = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        if (options.title) {
            const titleEl = document.createElement('h2');
            titleEl.style.marginBottom = '1rem';
            titleEl.textContent = options.title;
            modal.appendChild(titleEl);
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'modal-content';
        contentDiv.innerHTML = content;
        modal.appendChild(contentDiv);
        
        if (options.showClose !== false) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-ghost';
            closeBtn.style.marginTop = '1rem';
            closeBtn.textContent = '閉じる';
            closeBtn.addEventListener('click', () => this.close());
            modal.appendChild(closeBtn);
        }
        
        overlay.appendChild(modal);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        
        return overlay;
    },
    
    close() {
        const overlay = document.querySelector('.modal-overlay.active');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    },
    
    confirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const msgEl = document.createElement('p');
        msgEl.style.marginBottom = '1.5rem';
        msgEl.textContent = message;
        modal.appendChild(msgEl);
        
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display:flex;gap:0.5rem;justify-content:flex-end';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-ghost';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.addEventListener('click', () => {
            this.close();
            if (onCancel) onCancel();
        });
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = '確認';
        confirmBtn.addEventListener('click', () => {
            this.close();
            onConfirm();
        });
        
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        
        return overlay;
    }
};

// アニメーションユーティリティ
const Animate = {
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        requestAnimationFrame(() => element.style.opacity = '1');
    },
    
    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        return new Promise(resolve => setTimeout(resolve, duration));
    },
    
    slideUp(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `all ${duration}ms ease`;
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
};

// 数学ユーティリティ
const MathUtils = {
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },
    
    distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },
    
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    
    radToDeg(rad) {
        return rad * 180 / Math.PI;
    }
};

// カラーユーティリティ
const ColorUtils = {
    hslToRgb(h, s, l) {
        h /= 360;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h * 12) % 12;
            return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        };
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    },
    
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    },
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    },
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    },
    
    randomColor() {
        return `hsl(${Math.random() * 360}, 70%, 60%)`;
    },
    
    randomGradient() {
        const h1 = Math.random() * 360;
        const h2 = (h1 + 30 + Math.random() * 60) % 360;
        return `linear-gradient(135deg, hsl(${h1}, 70%, 60%), hsl(${h2}, 70%, 60%))`;
    }
};

// DOM ユーティリティ
const DOM = {
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return [...document.querySelectorAll(selector)];
    },
    
    create(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'class') el.className = value;
            else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child) el.appendChild(child);
        });
        return el;
    },
    
    empty(element) {
        while (element.firstChild) element.removeChild(element.firstChild);
    },
    
    onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};

// イベントユーティリティ
const Events = {
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    once(element, event, callback) {
        const handler = (e) => {
            callback(e);
            element.removeEventListener(event, handler);
        };
        element.addEventListener(event, handler);
    }
};

// キーボードショートカット
const Keyboard = {
    shortcuts: new Map(),
    
    init() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyCombo(e);
            const callback = this.shortcuts.get(key);
            if (callback) {
                e.preventDefault();
                callback(e);
            }
        });
    },
    
    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    },
    
    register(combo, callback) {
        this.shortcuts.set(combo.toLowerCase(), callback);
    },
    
    unregister(combo) {
        this.shortcuts.delete(combo.toLowerCase());
    }
};

// サウンドエフェクト
const Sound = {
    audioContext: null,
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    
    play(frequency = 440, duration = 0.1, type = 'sine', volume = 0.3) {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        gainNode.gain.value = volume;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        oscillator.stop(this.audioContext.currentTime + duration);
    },
    
    success() { this.play(880, 0.1); setTimeout(() => this.play(1320, 0.15), 100); },
    error() { this.play(220, 0.2, 'square', 0.2); },
    click() { this.play(600, 0.05, 'sine', 0.1); },
    beep() { this.play(1000, 0.1, 'sine', 0.2); }
};

// フォーマットユーティリティ
const Format = {
    time(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },
    
    number(num) {
        return num.toLocaleString();
    },
    
    percent(value, total) {
        return Math.round((value / total) * 100) + '%';
    },
    
    date(date, format = 'YYYY/MM/DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute);
    }
};

// キャンバスユーティリティ
const Canvas = {
    getContext(canvas) {
        return canvas.getContext('2d');
    },
    
    clear(ctx, color = '#000') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },
    
    resize(canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    },
    
    drawCircle(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    },
    
    drawLine(ctx, x1, y1, x2, y2, color, width = 1) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    },
    
    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    },
    
    drawText(ctx, text, x, y, options = {}) {
        ctx.fillStyle = options.color || '#fff';
        ctx.font = options.font || '16px sans-serif';
        ctx.textAlign = options.align || 'left';
        ctx.textBaseline = options.baseline || 'top';
        ctx.fillText(text, x, y);
    }
};

// 初期化
DOM.onReady(() => {
    Keyboard.init();
});

// エクスポート（モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Storage, Toast, Modal, Animate, MathUtils, ColorUtils, 
        DOM, Events, Keyboard, Sound, Format, Canvas
    };
}
