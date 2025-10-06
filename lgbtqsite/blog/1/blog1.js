// blog1.js — 目次生成とダークモード
(function(){
  'use strict';

  // 目次の自動生成
  const toc = document.querySelector('#toc ul');
  if(toc){
    const headings = Array.from(document.querySelectorAll('main h2'));
    headings.forEach(h => {
      if(h.id){
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.textContent = h.textContent;
        li.appendChild(a);
        toc.appendChild(li);
      }
    });
  }

  // ダークモードの切り替え
  const themeToggle = document.getElementById('toggle-theme');
  const root = document.documentElement;
  
  // 保存されたテーマを読み込む
  const storedTheme = localStorage.getItem('blog1-theme');
  if(storedTheme){
    root.setAttribute('data-theme', storedTheme);
    if(themeToggle){
      themeToggle.setAttribute('aria-pressed', String(storedTheme === 'dark'));
      themeToggle.textContent = storedTheme === 'dark' ? 'ライトモード' : 'ダークモード';
    }
  }

  // テーマ切り替えボタンのイベント
  if(themeToggle){
    themeToggle.addEventListener('click', () => {
      const currentTheme = root.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('blog1-theme', newTheme);
      themeToggle.setAttribute('aria-pressed', String(newTheme === 'dark'));
      themeToggle.textContent = newTheme === 'dark' ? 'ライトモード' : 'ダークモード';
    });
  }

  // スムーズスクロール
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e){
      const targetId = this.getAttribute('href');
      if(targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if(target){
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // URLを更新
        history.pushState(null, null, targetId);
      }
    });
  });

  // 目次のハイライト（現在位置を表示）
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -75% 0px',
    threshold: 0
  };

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.getAttribute('id');
        document.querySelectorAll('.toc a').forEach(link => {
          link.style.fontWeight = 'normal';
          link.style.color = 'var(--fg)';
        });
        const activeLink = document.querySelector(`.toc a[href="#${id}"]`);
        if(activeLink){
          activeLink.style.fontWeight = 'bold';
          activeLink.style.color = 'var(--accent)';
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  document.querySelectorAll('main h2[id]').forEach(heading => {
    observer.observe(heading);
  });

  // ページ読み込み時のアニメーション
  const sections = document.querySelectorAll('section');
  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(20px)';
        setTimeout(() => {
          entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, 100);
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.1});

  sections.forEach(section => {
    fadeInObserver.observe(section);
  });

})();
