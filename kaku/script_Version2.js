/**
 * 核兵器と未来兵器論 - インタラクティブWebサイト
 * 高校生プログラマー Rino-program と AI Claude の対話記録
 * 
 * 機能:
 * - レスポンシブナビゲーション
 * - スムーズスクロール
 * - アニメーション効果
 * - インタラクティブ要素
 * - パフォーマンス最適化
 * - アクセシビリティ対応
 */

// メイン初期化クラス
class DialogueSite {
    constructor() {
        this.isLoaded = false;
        this.lastScrollTop = 0;
        this.animationQueue = [];
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        // パフォーマンス向上のためのスロットリング
        this.scrollHandler = this.throttle(this.handleScroll.bind(this), 16);
        this.resizeHandler = this.throttle(this.handleResize.bind(this), 250);
        
        this.init();
    }
    
    // 初期化メソッド
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
        
        window.addEventListener('load', () => this.handlePageLoad());
    }
    
    // コンポーネントの初期化
    initializeComponents() {
        console.log('🚀 サイト初期化開始 - 高校生とAIの深い対話を表示します');
        
        this.initializeLoading();
        this.initializeNavigation();
        this.initializeScrollEffects();
        this.initializeAnimations();
        this.initializeInteractiveElements();
        this.initializeAccessibility();
        this.initializePerformanceOptimizations();
        
        console.log('✅ 全コンポーネントの初期化完了');
    }
    
    // ローディング画面の管理
    initializeLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) return;
        
        const minLoadingTime = 1500; // UX向上のための最小表示時間
        const startTime = performance.now();
        
        // ローディングアニメーションのカスタマイズ
        this.animateLoadingText();
        
        const hideLoading = () => {
            const elapsedTime = performance.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                document.body.style.overflow = 'auto';
                this.isLoaded = true;
                this.triggerRevealAnimations();
                console.log('🎉 ローディング完了 - 対話サイトを表示');
            }, remainingTime);
        };
        
        if (document.readyState === 'complete') {
            hideLoading();
        } else {
            window.addEventListener('load', hideLoading);
        }
    }
    
    // ローディングテキストのアニメーション
    animateLoadingText() {
        const messages = [
            '対話を読み込み中...',
            '核兵器の議論を準備中...',
            '未来兵器の分析中...',
            '技術倫理を考察中...',
            'AIと高校生の対話を展開中...'
        ];
        
        const loadingContent = document.querySelector('.loading-content h2');
        if (!loadingContent) return;
        
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (this.isLoaded) {
                clearInterval(interval);
                return;
            }
            
            currentIndex = (currentIndex + 1) % messages.length;
            loadingContent.textContent = messages[currentIndex];
        }, 500);
    }
    
    // ナビゲーションシステム
    initializeNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');
        const header = document.querySelector('.header');
        
        if (!navToggle || !navMenu) return;
        
        // モバイルメニューの制御
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMobileMenu(navToggle, navMenu);
        });
        
        // ナビゲーションリンクの処理
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavLinkClick(link, navToggle, navMenu);
            });
        });
        
        // スクロール時のヘッダー制御
        window.addEventListener('scroll', this.scrollHandler);
        window.addEventListener('resize', this.resizeHandler);
        
        // 初期アクティブセクションの設定
        this.updateActiveSectionInNav();
        
        console.log('📱 ナビゲーションシステム初期化完了');
    }
    
    // モバイルメニューの切り替え
    toggleMobileMenu(navToggle, navMenu) {
        const isActive = navToggle.classList.contains('active');
        
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // アクセシビリティ属性の更新
        navToggle.setAttribute('aria-expanded', !isActive);
        navMenu.setAttribute('aria-hidden', isActive);
        
        // アニメーション効果
        if (!isActive) {
            navMenu.style.maxHeight = navMenu.scrollHeight + 'px';
        } else {
            navMenu.style.maxHeight = '0px';
        }
    }
    
    // ナビゲーションリンククリック処理
    handleNavLinkClick(link, navToggle, navMenu) {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (!targetSection) return;
        
        // スムーズスクロール実行
        this.smoothScrollTo(targetSection, 80); // ヘッダーの高さを考慮
        
        // モバイルメニューを閉じる
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('aria-hidden', 'true');
        
        // アクティブリンクの更新
        this.updateActiveNavLink(link);
        
        // Google Analytics風のイベント追跡（実装例）
        this.trackNavigation(targetId);
        
        console.log(`🔗 ナビゲーション: ${targetId} へ移動`);
    }
    
    // カスタムスムーズスクロール
    smoothScrollTo(target, offset = 0) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) / 2, 1000); // 最大1秒
        
        let start = null;
        
        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // イージング関数（easeInOutCubic）
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, startPosition + distance * easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    }
    
    // スクロールイベント処理
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const header = document.querySelector('.header');
        
        // ヘッダーの自動隠し/表示
        if (scrollTop > this.lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        // ヘッダー背景の透明度調整
        const opacity = Math.min(scrollTop / 100, 0.98);
        header.style.background = `rgba(255, 255, 255, ${0.95 + opacity * 0.03})`;
        
        // スクロールトップボタンの表示制御
        this.updateScrollToTopButton(scrollTop);
        
        // アクティブセクションの更新
        this.updateActiveSectionInNav();
        
        // パララックス効果
        this.updateParallaxEffects(scrollTop);
        
        this.lastScrollTop = scrollTop;
    }
    
    // リサイズイベント処理
    handleResize() {
        // モバイルメニューのリセット
        const navMenu = document.getElementById('navMenu');
        const navToggle = document.getElementById('navToggle');
        
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            navMenu.style.maxHeight = '';
        }
        
        console.log(`📱 画面サイズ変更: ${window.innerWidth}x${window.innerHeight}`);
    }
    
    // アクティブなナビゲーションリンクの更新
    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            link.setAttribute('aria-current', 'false');
        });
        
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }
    
    // アクティブセクションの検出
    updateActiveSectionInNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentActiveSection = null;
        let maxVisibility = 0;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // セクションの可視性を計算
            const visibilityTop = Math.max(0, Math.min(viewportHeight, viewportHeight - rect.top));
            const visibilityBottom = Math.max(0, Math.min(viewportHeight, rect.bottom));
            const visibility = Math.max(0, visibilityBottom - Math.max(0, viewportHeight - rect.top));
            
            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                currentActiveSection = section.id;
            }
        });
        
        if (currentActiveSection) {
            navLinks.forEach(link => {
                const isActive = link.getAttribute('href') === `#${currentActiveSection}`;
                link.classList.toggle('active', isActive);
                link.setAttribute('aria-current', isActive ? 'page' : 'false');
            });
        }
    }
    
    // スクロールトップボタンの制御
    updateScrollToTopButton(scrollTop) {
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (!scrollToTopBtn) return;
        
        if (scrollTop > 300) {
            scrollToTopBtn.classList.add('visible');
            scrollToTopBtn.setAttribute('aria-hidden', 'false');
        } else {
            scrollToTopBtn.classList.remove('visible');
            scrollToTopBtn.setAttribute('aria-hidden', 'true');
        }
    }
    
    // パララックス効果
    updateParallaxEffects(scrollTop) {
        const floatingIcons = document.querySelectorAll('.floating-icons i');
        
        floatingIcons.forEach((icon, index) => {
            const speed = 0.5 * (index + 1) * 0.3;
            const offset = scrollTop * speed;
            icon.style.transform = `translateY(${offset}px)`;
        });
    }
    
    // スクロール効果の初期化
    initializeScrollEffects() {
        const scrollToTopBtn = document.getElementById('scrollToTop');
        
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                this.smoothScrollTo(document.body, 0);
                console.log('⬆️ トップへスクロール');
            });
        }
        
        // Intersection Observer for scroll animations
        this.initializeScrollRevealAnimations();
        
        console.log('🎭 スクロール効果初期化完了');
    }
    
    // スクロール時の要素表示アニメーション
    initializeScrollRevealAnimations() {
        const animatedElements = document.querySelectorAll('[data-aos]');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const delay = entry.target.getAttribute('data-aos-delay') || 0;
                        setTimeout(() => {
                            entry.target.classList.add('aos-animate');
                        }, parseInt(delay));
                        observer.unobserve(entry.target); // パフォーマンス向上
                    }
                });
            }, this.observerOptions);
            
            animatedElements.forEach(element => {
                observer.observe(element);
            });
        } else {
            // フォールバック: Intersection Observerが使えない場合
            animatedElements.forEach(element => {
                element.classList.add('aos-animate');
            });
        }
    }
    
    // アニメーション効果の初期化
    initializeAnimations() {
        // CSS アニメーションの動的制御
        this.initializeHeroAnimations();
        this.initializeTimelineAnimations();
        this.initializeCounterAnimations();
        
        console.log('✨ アニメーション効果初期化完了');
    }
    
    // ヒーローセクションのアニメーション
    initializeHeroAnimations() {
        const heroElements = [
            { selector: '.hero-title', delay: 0 },
            { selector: '.hero-subtitle', delay: 200 },
            { selector: '.hero-stats', delay: 400 },
            { selector: '.cta-button', delay: 600 }
        ];
        
        heroElements.forEach(({ selector, delay }) => {
            const element = document.querySelector(selector);
            if (element) {
                setTimeout(() => {
                    element.classList.add('animated');
                }, delay);
            }
        });
    }
    
    // タイムライン要素のアニメーション
    initializeTimelineAnimations() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.animateTimelineContent(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });
    }
    
    // タイムラインコンテンツのアニメーション
    animateTimelineContent(timelineItem) {
        const content = timelineItem.querySelector('.timeline-content');
        const messageContent = timelineItem.querySelector('.message-content');
        
        if (content && messageContent) {
            // タイピング効果風のアニメーション
            const textElements = messageContent.querySelectorAll('p, li');
            textElements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('fade-in-text');
                }, index * 100);
            });
        }
    }
    
    // カウンターアニメーション
    initializeCounterAnimations() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });
        
        statNumbers.forEach(stat => {
            counterObserver.observe(stat);
        });
    }
    
    // カウンターアニメーション実行
    animateCounter(element) {
        const text = element.textContent;
        const isInfinity = text.includes('∞');
        
        if (isInfinity) {
            // 無限記号の特殊アニメーション
            element.classList.add('infinity-pulse');
            return;
        }
        
        const number = parseInt(text.replace(/\D/g, ''));
        if (isNaN(number)) return;
        
        const duration = 2000;
        const step = number / (duration / 16);
        let current = 0;
        
        const counter = setInterval(() => {
            current += step;
            if (current >= number) {
                current = number;
                clearInterval(counter);
            }
            element.textContent = text.replace(number, Math.floor(current));
        }, 16);
    }
    
    // インタラクティブ要素の初期化
    initializeInteractiveElements() {
        this.initializeCardHoverEffects();
        this.initializeQuoteInteractions();
        this.initializeExpandableContent();
        this.initializeToolTips();
        
        console.log('🖱️ インタラクティブ要素初期化完了');
    }
    
    // カードホバー効果
    initializeCardHoverEffects() {
        const cards = document.querySelectorAll(
            '.participant, .paradox-card, .weapon-card, .insight-card, .perspective-card'
        );
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover-effect');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover-effect');
            });
            
            // タッチデバイス対応
            card.addEventListener('touchstart', () => {
                card.classList.add('touch-active');
            });
            
            card.addEventListener('touchend', () => {
                setTimeout(() => {
                    card.classList.remove('touch-active');
                }, 300);
            });
        });
    }
    
    // 引用文のインタラクション
    initializeQuoteInteractions() {
        const quotes = document.querySelectorAll('.quote-box, .final-quote');
        
        quotes.forEach(quote => {
            quote.addEventListener('click', () => {
                // 引用文の強調効果
                quote.classList.add('quote-emphasized');
                setTimeout(() => {
                    quote.classList.remove('quote-emphasized');
                }, 1000);
                
                // 読み上げ機能（Web Speech API）
                this.speakText(quote.textContent);
            });
        });
    }
    
    // 展開可能コンテンツ
    initializeExpandableContent() {
        const expandableItems = document.querySelectorAll('.weapon-card, .question-card');
        
        expandableItems.forEach(item => {
            const header = item.querySelector('.weapon-header, .question-card h4');
            if (!header) return;
            
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                item.classList.toggle('expanded');
                
                // アクセシビリティ属性の更新
                const isExpanded = item.classList.contains('expanded');
                header.setAttribute('aria-expanded', isExpanded);
                
                console.log(`${isExpanded ? '📖' : '📕'} コンテンツ展開切り替え`);
            });
        });
    }
    
    // ツールチップ
    initializeToolTips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = element.getAttribute('data-tooltip');
            
            element.addEventListener('mouseenter', (e) => {
                document.body.appendChild(tooltip);
                this.positionTooltip(tooltip, e.target);
                tooltip.classList.add('visible');
            });
            
            element.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 200);
            });
        });
    }
    
    // ツールチップの位置調整
    positionTooltip(tooltip, target) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        const top = rect.top - tooltipRect.height - 10;
        
        tooltip.style.left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10)) + 'px';
        tooltip.style.top = top + 'px';
    }
    
    // アクセシビリティ対応
    initializeAccessibility() {
        // キーボードナビゲーション
        this.initializeKeyboardNavigation();
        
        // フォーカス管理
        this.initializeFocusManagement();
        
        // ARIA属性の動的更新
        this.initializeAriaUpdates();
        
        // 色覚支援
        this.initializeColorAccessibility();
        
        console.log('♿ アクセシビリティ機能初期化完了');
    }
    
    // キーボードナビゲーション
    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escキーでモバイルメニューを閉じる
            if (e.key === 'Escape') {
                const navMenu = document.getElementById('navMenu');
                const navToggle = document.getElementById('navToggle');
                
                if (navMenu && navMenu.classList.contains('active')) {
                    this.toggleMobileMenu(navToggle, navMenu);
                }
            }
            
            // 矢印キーでセクション間移動
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.navigateSection(e.key === 'ArrowDown' ? 'next' : 'prev');
                }
            }
        });
    }
    
    // セクション間移動
    navigateSection(direction) {
        const sections = document.querySelectorAll('section[id]');
        const currentSection = Array.from(sections).find(section => {
            const rect = section.getBoundingClientRect();
            return rect.top <= 100 && rect.bottom >= 100;
        });
        
        if (!currentSection) return;
        
        const currentIndex = Array.from(sections).indexOf(currentSection);
        let targetIndex;
        
        if (direction === 'next') {
            targetIndex = Math.min(currentIndex + 1, sections.length - 1);
        } else {
            targetIndex = Math.max(currentIndex - 1, 0);
        }
        
        const targetSection = sections[targetIndex];
        if (targetSection) {
            this.smoothScrollTo(targetSection, 80);
            console.log(`⌨️ キーボードナビゲーション: ${targetSection.id}`);
        }
    }
    
    // フォーカス管理
    initializeFocusManagement() {
        // フォーカス可能要素の管理
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        
        document.addEventListener('focusin', (e) => {
            // フォーカスされた要素が画面外の場合、スクロール
            const element = e.target;
            const rect = element.getBoundingClientRect();
            
            if (rect.bottom > window.innerHeight || rect.top < 0) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
    
    // ARIA属性の動的更新
    initializeAriaUpdates() {
        // セクションのARIA属性を動的に更新
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            section.setAttribute('role', 'region');
            const heading = section.querySelector('h2, h3');
            if (heading) {
                section.setAttribute('aria-labelledby', heading.id || section.id + '-heading');
            }
        });
    }
    
    // 色覚支援
    initializeColorAccessibility() {
        // ハイコントラストモードの検出
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // 動きの軽減設定の検出
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }
    
    // パフォーマンス最適化
    initializePerformanceOptimizations() {
        // 画像の遅延読み込み
        this.initializeLazyLoading();
        
        // リソースのプリロード
        this.initializeResourcePreloading();
        
        // メモリ使用量の監視
        this.initializeMemoryMonitoring();
        
        console.log('⚡ パフォーマンス最適化完了');
    }
    
    // 遅延読み込み
    initializeLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // フォールバック
            images.forEach(img => {
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
            });
        }
    }
    
    // リソースプリロード
    initializeResourcePreloading() {
        // 重要なフォントのプリロード
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
    }
    
    // メモリ監視
    initializeMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                
                if (usagePercent > 80) {
                    console.warn('🔥 メモリ使用量が高くなっています:', usagePercent.toFixed(2) + '%');
                    this.optimizeMemoryUsage();
                }
            }, 30000); // 30秒ごとにチェック
        }
    }
    
    // メモリ使用量最適化
    optimizeMemoryUsage() {
        // 不要なイベントリスナーを削除
        const inactiveElements = document.querySelectorAll('.aos-animate[data-aos]');
        inactiveElements.forEach(element => {
            element.removeAttribute('data-aos');
        });
        
        // ガベージコレクションを促進
        if (window.gc) {
            window.gc();
        }
        
        console.log('🧹 メモリ最適化実行');
    }
    
    // 初期表示アニメーション
    triggerRevealAnimations() {
        const elements = document.querySelectorAll('.hero-content > *');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('reveal-animate');
            }, index * 100);
        });
    }
    
    // ページ読み込み完了処理
    handlePageLoad() {
        // パフォーマンス測定
        const loadTime = performance.now();
        console.log(`📊 ページ読み込み時間: ${loadTime.toFixed(2)}ms`);
        
        // 読み込み完了の通知
        this.showLoadCompleteNotification();
        
        // 分析データの送信（実装例）
        this.sendAnalytics({
            event: 'page_loaded',
            loadTime: loadTime,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
    }
    
    // 読み込み完了通知
    showLoadCompleteNotification() {
        const notification = document.createElement('div');
        notification.className = 'load-notification';
        notification.innerHTML = '🎉 高校生とAIの深い対話をお楽しみください';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // アニメーション表示
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 3秒後に自動削除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // テキスト読み上げ（Web Speech API）
    speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
            console.log('🔊 テキスト読み上げ開始');
        }
    }
    
    // イベント追跡
    trackNavigation(targetId) {
        // Google Analytics や他の分析ツール向けのイベント送信
        if (typeof gtag !== 'undefined') {
            gtag('event', 'navigation', {
                event_category: 'User Interaction',
                event_label: targetId,
                value: 1
            });
        }
    }
    
    // 分析データ送信
    sendAnalytics(data) {
        // 実際のプロジェクトでは、ここで分析サービスにデータを送信
        console.log('📈 分析データ:', data);
    }
    
    // スロットリング関数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    // デバウンス関数
    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
}

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('❌ JavaScript エラー:', e.error);
    // エラーレポートを送信（実装例）
    if (typeof fetch !== 'undefined') {
        fetch('/api/error-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error ? e.error.stack : null,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error('Error report failed:', err));
    }
});

// Promise rejection のハンドリング
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ 未処理のPromise拒否:', e.reason);
    e.preventDefault(); // デフォルトの処理を防ぐ
});

// パフォーマンス監視
if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP) の測定
    const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('📊 LCP:', lastEntry.startTime.toFixed(2) + 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID) の測定
    const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
            console.log('📊 FID:', entry.processingStart - entry.startTime);
        });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
}

// サイト初期化
const dialogueSite = new DialogueSite();

// 開発者向けのデバッグ機能
if (process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    window.dialogueSite = dialogueSite; // グローバルアクセス用
    console.log('🔧 開発モード: window.dialogueSite でアクセス可能');
    
    // デバッグ用のキーボードショートカット
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            console.log('🐛 デバッグ情報:', {
                scrollPosition: window.pageYOffset,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                activeSection: document.querySelector('.nav-link.active')?.getAttribute('href'),
                memoryUsage: performance.memory ? {
                    used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
                    total: `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`
                } : 'N/A'
            });
        }
    });
}

// Service Worker の登録（PWA対応）
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker登録成功:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker登録失敗:', error);
            });
    });
}

// 追加のCSS動的スタイル
const additionalStyles = `
    .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        font-size: 0.8rem;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
        z-index: 10000;
        pointer-events: none;
    }
    
    .tooltip.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border: 5px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.9);
    }
    
    .reveal-animate {
        animation: revealUp 0.8s ease forwards;
    }
    
    @keyframes revealUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .infinity-pulse {
        animation: infinityPulse 2s ease-in-out infinite;
    }
    
    @keyframes infinityPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .fade-in-text {
        animation: fadeInText 0.6s ease forwards;
    }
    
    @keyframes fadeInText {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .hover-effect {
        transform: translateY(-8px) !important;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    }
    
    .touch-active {
        transform: scale(0.98);
    }
    
    .quote-emphasized {
        animation: quoteEmphasize 1s ease;
    }
    
    @keyframes quoteEmphasize {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2); }
    }
    
    .expanded {
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15) !important;
    }
    
    .animate-in {
        animation: slideInFromSide 0.8s ease forwards;
    }
    
    @keyframes slideInFromSide {
        from {
            opacity: 0;
            transform: translateX(-50px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .high-contrast {
        filter: contrast(150%);
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .load-notification {
        font-family: 'Noto Sans JP', sans-serif;
        font-weight: 500;
        backdrop-filter: blur(10px);
    }
    
    @media (prefers-reduced-motion: reduce) {
        .floating-icons i {
            animation: none !important;
        }
        
        .loading-spinner {
            animation: none !important;
        }
    }
    
    @media (max-width: 768px) {
        .tooltip {
            display: none;
        }
    }
`;

// 動的スタイル追加
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

console.log('🎯 高校生とAIの核兵器論対話サイト - JavaScript初期化完了');
console.log('👨‍💻 Rino-program (高校生プログラマー) × 🤖 Claude (AI) の深い議論をお楽しみください');