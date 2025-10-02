/**
 * Plan 1 - Storytelling Design JavaScript
 * Nuclear Weapons Dialogue Website
 * 
 * Features:
 * - Reading progress bar
 * - Chapter navigation with smooth scrolling
 * - Theme switcher (Light/Dark/Sepia)
 * - Font size controls
 * - Settings panel management
 * - Bookmark functionality
 * - Expandable analysis cards
 * - Scroll animations
 * - Auto-scroll feature
 * - Keyboard shortcuts
 * - Mobile menu handling
 * - Performance optimizations
 * - Local storage persistence
 * 
 * @author Copilot & Rino-program
 * @date 2025-10-02
 */

'use strict';

// ============================================================================
// 1. Configuration & Constants
// ============================================================================

const CONFIG = {
    // Local Storage Keys
    STORAGE_KEYS: {
        THEME: 'nuclear-dialogue-theme',
        FONT_SIZE: 'nuclear-dialogue-font-size',
        BOOKMARK: 'nuclear-dialogue-bookmark',
        AUTO_SCROLL: 'nuclear-dialogue-auto-scroll'
    },
    
    // Default Values
    DEFAULTS: {
        THEME: 'light',
        FONT_SIZE: 'medium',
        AUTO_SCROLL: false
    },
    
    // Animation Settings
    ANIMATION: {
        SCROLL_DURATION: 800,
        SCROLL_OFFSET: 80,
        PROGRESS_UPDATE_DELAY: 10,
        REVEAL_THRESHOLD: 0.15
    },
    
    // Throttle/Debounce Delays
    DELAYS: {
        SCROLL: 16,
        RESIZE: 250,
        AUTO_SCROLL: 100
    }
};

// ============================================================================
// 2. Utility Functions
// ============================================================================

/**
 * Throttle function execution
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce function execution
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Get stored value from localStorage
 */
function getStoredValue(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.warn(`Failed to get stored value for ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Set value in localStorage
 */
function setStoredValue(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`Failed to set stored value for ${key}:`, error);
        return false;
    }
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(target, offset = CONFIG.ANIMATION.SCROLL_OFFSET) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Get current chapter based on scroll position
 */
function getCurrentChapter() {
    const chapters = document.querySelectorAll('.chapter');
    let current = 0;
    
    chapters.forEach((chapter, index) => {
        const rect = chapter.getBoundingClientRect();
        if (rect.top <= 150) {
            current = index;
        }
    });
    
    return current;
}

// ============================================================================
// 3. Reading Progress Bar
// ============================================================================

class ProgressBar {
    constructor() {
        this.bar = document.getElementById('progressBar');
        this.init();
    }
    
    init() {
        if (!this.bar) return;
        
        // Update on scroll (throttled)
        window.addEventListener('scroll', throttle(() => {
            this.update();
        }, CONFIG.DELAYS.SCROLL));
        
        // Initial update
        this.update();
    }
    
    update() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        const scrollableHeight = documentHeight - windowHeight;
        const progress = (scrollTop / scrollableHeight) * 100;
        
        this.bar.style.width = `${Math.min(progress, 100)}%`;
    }
}

// ============================================================================
// 4. Chapter Navigation
// ============================================================================

class ChapterNavigation {
    constructor() {
        this.chapterBtns = document.querySelectorAll('.chapter-btn');
        this.chapters = document.querySelectorAll('.chapter');
        this.init();
    }
    
    init() {
        if (!this.chapterBtns.length) return;
        
        // Button click handlers
        this.chapterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chapterIndex = btn.dataset.chapter;
                this.navigateToChapter(chapterIndex);
            });
        });
        
        // Update active chapter on scroll
        window.addEventListener('scroll', throttle(() => {
            this.updateActiveChapter();
        }, CONFIG.DELAYS.SCROLL));
        
        // Next chapter buttons
        document.querySelectorAll('.next-chapter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextChapter = btn.dataset.next;
                this.navigateToChapter(nextChapter);
            });
        });
    }
    
    navigateToChapter(chapterIndex) {
        const chapter = document.querySelector(`[data-chapter="${chapterIndex}"]`);
        if (chapter) {
            smoothScrollTo(chapter);
            this.setActiveButton(chapterIndex);
        }
    }
    
    updateActiveChapter() {
        const currentChapter = getCurrentChapter();
        this.setActiveButton(currentChapter);
    }
    
    setActiveButton(chapterIndex) {
        this.chapterBtns.forEach(btn => {
            if (btn.dataset.chapter === String(chapterIndex)) {
                btn.classList.add('active');
                btn.setAttribute('aria-current', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-current', 'false');
            }
        });
    }
}

// ============================================================================
// 5. Settings Panel
// ============================================================================

class SettingsPanel {
    constructor() {
        this.panel = document.getElementById('settingsPanel');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeBtn = document.getElementById('closeSettingsBtn');
        this.overlay = document.getElementById('settingsOverlay');
        this.init();
    }
    
    init() {
        if (!this.panel) return;
        
        // Open settings
        this.settingsBtn?.addEventListener('click', () => this.open());
        
        // Close settings
        this.closeBtn?.addEventListener('click', () => this.close());
        this.overlay?.addEventListener('click', () => this.close());
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }
    
    open() {
        this.panel.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.panel.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    
    isOpen() {
        return this.panel.getAttribute('aria-hidden') === 'false';
    }
}

// ============================================================================
// 6. Theme Switcher
// ============================================================================

class ThemeSwitcher {
    constructor() {
        this.themeBtns = document.querySelectorAll('.theme-btn');
        this.currentTheme = getStoredValue(
            CONFIG.STORAGE_KEYS.THEME,
            CONFIG.DEFAULTS.THEME
        );
        this.init();
    }
    
    init() {
        // Apply stored theme
        this.applyTheme(this.currentTheme);
        
        // Theme button handlers
        this.themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        setStoredValue(CONFIG.STORAGE_KEYS.THEME, theme);
    }
    
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        // Update active button
        this.themeBtns.forEach(btn => {
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// ============================================================================
// 7. Font Size Controller
// ============================================================================

class FontSizeController {
    constructor() {
        this.sizeBtns = document.querySelectorAll('.size-btn');
        this.currentSize = getStoredValue(
            CONFIG.STORAGE_KEYS.FONT_SIZE,
            CONFIG.DEFAULTS.FONT_SIZE
        );
        this.init();
    }
    
    init() {
        // Apply stored size
        this.applySize(this.currentSize);
        
        // Size button handlers
        this.sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size;
                this.setSize(size);
            });
        });
    }
    
    setSize(size) {
        this.currentSize = size;
        this.applySize(size);
        setStoredValue(CONFIG.STORAGE_KEYS.FONT_SIZE, size);
    }
    
    applySize(size) {
        document.body.setAttribute('data-font-size', size);
        
        // Update active button
        this.sizeBtns.forEach(btn => {
            if (btn.dataset.size === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// ============================================================================
// 8. Bookmark Functionality
// ============================================================================

class BookmarkManager {
    constructor() {
        this.bookmarkBtn = document.getElementById('bookmarkBtn');
        this.init();
    }
    
    init() {
        if (!this.bookmarkBtn) return;
        
        // Load bookmark on page load
        this.loadBookmark();
        
        // Save bookmark button
        this.bookmarkBtn.addEventListener('click', () => {
            this.saveBookmark();
        });
    }
    
    saveBookmark() {
        const currentChapter = getCurrentChapter();
        const scrollPosition = window.pageYOffset;
        
        const bookmark = {
            chapter: currentChapter,
            position: scrollPosition,
            timestamp: Date.now()
        };
        
        setStoredValue(CONFIG.STORAGE_KEYS.BOOKMARK, JSON.stringify(bookmark));
        
        // Visual feedback
        this.showBookmarkFeedback('saved');
    }
    
    loadBookmark() {
        try {
            const bookmarkData = getStoredValue(CONFIG.STORAGE_KEYS.BOOKMARK, null);
            if (!bookmarkData) return;
            
            const bookmark = JSON.parse(bookmarkData);
            
            // Show prompt to restore bookmark
            if (bookmark && bookmark.position) {
                this.showBookmarkPrompt(bookmark);
            }
        } catch (error) {
            console.warn('Failed to load bookmark:', error);
        }
    }
    
    showBookmarkPrompt(bookmark) {
        // Only show if not at the beginning of the page
        if (window.pageYOffset < 100) {
            const prompt = document.createElement('div');
            prompt.className = 'bookmark-prompt';
            prompt.innerHTML = `
                <div class="bookmark-content">
                    <p><i class="fas fa-bookmark"></i> 前回の続きから読みますか？</p>
                    <div class="bookmark-actions">
                        <button class="bookmark-yes">はい</button>
                        <button class="bookmark-no">いいえ</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(prompt);
            
            // Restore bookmark
            prompt.querySelector('.bookmark-yes').addEventListener('click', () => {
                window.scrollTo({ top: bookmark.position, behavior: 'smooth' });
                prompt.remove();
            });
            
            // Dismiss
            prompt.querySelector('.bookmark-no').addEventListener('click', () => {
                prompt.remove();
            });
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (prompt.parentNode) {
                    prompt.remove();
                }
            }, 5000);
        }
    }
    
    showBookmarkFeedback(type) {
        const icon = this.bookmarkBtn.querySelector('i');
        
        if (type === 'saved') {
            icon.classList.remove('far');
            icon.classList.add('fas');
            
            // Revert after 2 seconds
            setTimeout(() => {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }, 2000);
        }
    }
}

// ============================================================================
// 9. Expandable Cards
// ============================================================================

class ExpandableCards {
    constructor() {
        this.cards = document.querySelectorAll('.analysis-card');
        this.init();
    }
    
    init() {
        // Make toggleCard function global for onclick in HTML
        window.toggleCard = (header) => {
            const card = header.closest('.analysis-card');
            const content = card.querySelector('.card-content');
            
            // Toggle expanded class
            card.classList.toggle('expanded');
            
            // Update aria-expanded
            const isExpanded = card.classList.contains('expanded');
            header.setAttribute('aria-expanded', isExpanded);
            
            // Animate content
            if (isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0px';
            }
        };
    }
}

// ============================================================================
// 10. Scroll Animations
// ============================================================================

class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: CONFIG.ANIMATION.REVEAL_THRESHOLD,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // Fallback for older browsers
            this.revealAllElements();
        }
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal', 'active');
                    observer.unobserve(entry.target); // Stop observing after reveal
                }
            });
        }, this.observerOptions);
        
        // Observe elements
        const elements = document.querySelectorAll(`
            .character-card,
            .message-group,
            .analysis-card,
            .paradox-item,
            .weapon-showcase-card,
            .chain-step,
            .dilemma-card,
            .insight-card
        `);
        
        elements.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }
    
    revealAllElements() {
        const elements = document.querySelectorAll('.reveal');
        elements.forEach(el => el.classList.add('active'));
    }
}

// ============================================================================
// 11. Auto-Scroll Feature
// ============================================================================

class AutoScroller {
    constructor() {
        this.checkbox = document.getElementById('autoScrollCheck');
        this.isEnabled = JSON.parse(
            getStoredValue(CONFIG.STORAGE_KEYS.AUTO_SCROLL, CONFIG.DEFAULTS.AUTO_SCROLL)
        );
        this.scrollSpeed = 1; // pixels per interval
        this.intervalId = null;
        this.init();
    }
    
    init() {
        if (!this.checkbox) return;
        
        // Apply stored state
        this.checkbox.checked = this.isEnabled;
        if (this.isEnabled) {
            this.start();
        }
        
        // Checkbox handler
        this.checkbox.addEventListener('change', (e) => {
            this.toggle(e.target.checked);
        });
        
        // Pause on user scroll
        let userScrollTimeout;
        window.addEventListener('wheel', () => {
            if (this.isEnabled) {
                this.pause();
                clearTimeout(userScrollTimeout);
                userScrollTimeout = setTimeout(() => {
                    if (this.isEnabled) {
                        this.start();
                    }
                }, 3000);
            }
        }, { passive: true });
    }
    
    toggle(enable) {
        this.isEnabled = enable;
        setStoredValue(CONFIG.STORAGE_KEYS.AUTO_SCROLL, enable);
        
        if (enable) {
            this.start();
        } else {
            this.stop();
        }
    }
    
    start() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(() => {
            window.scrollBy(0, this.scrollSpeed);
            
            // Stop at bottom
            if ((window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight) {
                this.stop();
            }
        }, CONFIG.DELAYS.AUTO_SCROLL);
    }
    
    pause() {
        this.stop();
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// ============================================================================
// 12. Scroll to Top Button
// ============================================================================

class ScrollToTopButton {
    constructor() {
        this.button = document.getElementById('scrollToTop');
        this.init();
    }
    
    init() {
        if (!this.button) return;
        
        // Show/hide on scroll
        window.addEventListener('scroll', throttle(() => {
            this.updateVisibility();
        }, CONFIG.DELAYS.SCROLL));
        
        // Click handler
        this.button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    updateVisibility() {
        if (window.pageYOffset > 300) {
            this.button.classList.add('visible');
            this.button.setAttribute('aria-hidden', 'false');
        } else {
            this.button.classList.remove('visible');
            this.button.setAttribute('aria-hidden', 'true');
        }
    }
}

// ============================================================================
// 13. Mobile Menu
// ============================================================================

class MobileMenu {
    constructor() {
        this.menuBtn = document.getElementById('mobileMenuBtn');
        this.nav = document.querySelector('.chapter-nav');
        this.init();
    }
    
    init() {
        if (!this.menuBtn || !this.nav) return;
        
        this.menuBtn.addEventListener('click', () => {
            this.toggle();
        });
        
        // Close when clicking chapter button
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.close();
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.nav.contains(e.target) && !this.menuBtn.contains(e.target)) {
                this.close();
            }
        });
    }
    
    toggle() {
        this.nav.classList.toggle('mobile-open');
    }
    
    close() {
        this.nav.classList.remove('mobile-open');
    }
}

// ============================================================================
// 14. Keyboard Shortcuts
// ============================================================================

class KeyboardShortcuts {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Arrow Down: Next section
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSection('next');
            }
            
            // Ctrl/Cmd + Arrow Up: Previous section
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSection('prev');
            }
            
            // Ctrl/Cmd + Home: Scroll to top
            if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // Ctrl/Cmd + End: Scroll to bottom
            if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
                e.preventDefault();
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
            }
        });
    }
    
    navigateSection(direction) {
        const currentChapter = getCurrentChapter();
        const chapters = document.querySelectorAll('.chapter');
        
        let targetIndex;
        if (direction === 'next') {
            targetIndex = Math.min(currentChapter + 1, chapters.length - 1);
        } else {
            targetIndex = Math.max(currentChapter - 1, 0);
        }
        
        const targetChapter = chapters[targetIndex];
        if (targetChapter) {
            smoothScrollTo(targetChapter);
        }
    }
}

// ============================================================================
// 15. Performance Monitor
// ============================================================================

class PerformanceMonitor {
    constructor() {
        this.init();
    }
    
    init() {
        // Log page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`✅ Page loaded in ${loadTime.toFixed(2)}ms`);
            
            // Performance metrics
            if ('performance' in window && 'getEntriesByType' in performance) {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    console.log('📊 Performance Metrics:', {
                        'DNS': `${navigation.domainLookupEnd - navigation.domainLookupStart}ms`,
                        'TCP': `${navigation.connectEnd - navigation.connectStart}ms`,
                        'Response': `${navigation.responseEnd - navigation.responseStart}ms`,
                        'DOM Processing': `${navigation.domComplete - navigation.domLoading}ms`,
                        'Total': `${navigation.loadEventEnd - navigation.fetchStart}ms`
                    });
                }
            }
        });
        
        // Monitor memory (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                
                if (usagePercent > 80) {
                    console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(2)}%`);
                }
            }, 30000); // Check every 30 seconds
        }
    }
}

// ============================================================================
// 16. Main Application Initialization
// ============================================================================

class NuclearDialogueApp {
    constructor() {
        this.components = [];
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }
    
    initializeComponents() {
        console.log('🚀 Initializing Nuclear Dialogue App...');
        
        try {
            // Initialize all components
            this.components.push(new ProgressBar());
            this.components.push(new ChapterNavigation());
            this.components.push(new SettingsPanel());
            this.components.push(new ThemeSwitcher());
            this.components.push(new FontSizeController());
            this.components.push(new BookmarkManager());
            this.components.push(new ExpandableCards());
            this.components.push(new ScrollAnimations());
            this.components.push(new AutoScroller());
            this.components.push(new ScrollToTopButton());
            this.components.push(new MobileMenu());
            this.components.push(new KeyboardShortcuts());
            this.components.push(new PerformanceMonitor());
            
            console.log('✅ All components initialized successfully');
            
            // Show welcome message (only on first visit)
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Error initializing components:', error);
        }
    }
    
    showWelcomeMessage() {
        const hasVisited = getStoredValue('nuclear-dialogue-visited', false);
        
        if (!hasVisited) {
            setTimeout(() => {
                console.log('👋 Welcome to Nuclear Dialogue - A Storytelling Experience');
                console.log('💡 Tip: Use Ctrl+↑/↓ to navigate between chapters');
                setStoredValue('nuclear-dialogue-visited', 'true');
            }, 1000);
        }
    }
}

// ============================================================================
// 17. Error Handling
// ============================================================================

// Global error handler
window.addEventListener('error', (event) => {
    console.error('❌ JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
});

// ============================================================================
// 18. Initialize Application
// ============================================================================

// Create and initialize the application
const app = new NuclearDialogueApp();

// Export for debugging (development only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.nuclearDialogueApp = app;
    console.log('🔧 Development Mode: window.nuclearDialogueApp available for debugging');
}

// ============================================================================
// End of Script
// ============================================================================
