// blog0.js — 目次生成、FAQ、ダークモード
(function(){
  // 目次生成
  const toc = document.querySelector('#toc ul');
  if(toc){
    const headings = Array.from(document.querySelectorAll('main h2'));
    headings.forEach(h=>{
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
    });
  }

  // FAQ トグル
  document.querySelectorAll('.faq-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const body = btn.nextElementSibling;
      if(body){
        body.style.display = expanded ? 'none' : 'block';
      }
    });
  });

  // ダークモード永続化
  const themeToggle = document.getElementById('toggle-theme');
  const root = document.documentElement;
  const stored = localStorage.getItem('blog0-theme');
  if(stored) root.setAttribute('data-theme', stored);
  if(themeToggle){
    const setTheme = (t)=>{
      root.setAttribute('data-theme', t);
      themeToggle.setAttribute('aria-pressed', String(t==='dark'));
      localStorage.setItem('blog0-theme', t);
    }
    themeToggle.addEventListener('click', ()=>{
      const current = root.getAttribute('data-theme') || 'light';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }
})();
