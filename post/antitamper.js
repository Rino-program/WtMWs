/*
  Simple anti-tamper watcher for displayed text content.
  - Takes a snapshot (textContent) of protected nodes after DOMContentLoaded.
  - Uses MutationObserver to detect changes to text nodes or attributes that affect text rendering.
  - If a change is detected, revert to the original, and notify the user.

  Limitations:
  - Only protects textContent/attributes; injected CSS/JS can't be fully blocked on the client.
  - Advanced devtools users can still disable scripts; server-side integrity is required for real security.
*/
(function(){
  'use strict';

  // Configuration: what to protect and notification behavior
  const config = {
    // CSS selectors to include. Broaden to cover typical content inside sections.
    includeSelectors: [
      'header', 'footer',
      'main h1', 'main h2', 'main h3', 'main h4', 'main h5', 'main h6',
      'main section p', 'main section span', 'main section ul', 'main section ol', 'main section li',
      'main section pre', 'main section code', 'main section blockquote',
      'main .post-content',
      // also standalone paragraphs/spans in main (outside section) just in case
      'main p', 'main span', 'main ul', 'main ol', 'main li', 'main pre', 'main code', 'main blockquote', 'main a'
    ],
    // Selectors to exclude from protection (dynamic/interactive UI)
    excludeSelectors: [
      '#search-input', '#jump-input', '#search-form', '#jump-form',
      '#nav-inline', '#tag-list', '#tag-list-flex', '#theme-switcher',
      'button'
    ],
    // Attributes that, if changed, should be reverted
    protectedAttributes: ['title', 'aria-label', 'href'],
    // Show a toast notification
    showToast: true,
    // Also show an alert (use sparingly)
    showAlert: false,
  };

  // Toast utility
  function showToast(msg){
    if(!config.showToast) return;
    let el = document.getElementById('antiTamperToast');
    if(!el){
      el = document.createElement('div');
      el.id = 'antiTamperToast';
      el.style.position = 'fixed';
      el.style.left = '50%';
      el.style.bottom = '24px';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(220, 53, 69, 0.95)';
      el.style.color = '#fff';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '8px';
      el.style.fontSize = '14px';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,.25)';
      el.style.zIndex = '2147483647';
      el.style.maxWidth = '90%';
      el.style.wordBreak = 'break-word';
      el.style.pointerEvents = 'none';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>{ el.style.opacity = '0'; }, 2400);
  }

  // Snapshot store: WeakMap node -> {html, attrs}
  const SNAP = new WeakMap();

  function shouldExclude(node){
    if(!(node instanceof Element)) return false;
    return config.excludeSelectors.some(sel => node.matches(sel));
  }

  function shouldInclude(node){
    if(!(node instanceof Element)) return false;
    return config.includeSelectors.some(sel => node.matches(sel));
  }

  function takeSnapshot(node){
    if(!(node instanceof Element)) return;
    if(!shouldInclude(node) || shouldExclude(node)) return;
    const entry = {
      html: node.innerHTML,
      attrs: {}
    };
    for(const a of config.protectedAttributes){
      entry.attrs[a] = node.getAttribute(a);
    }
    SNAP.set(node, entry);
  }

  function snapshotAll(){
    const candidates = new Set();
    for(const sel of config.includeSelectors){
      document.querySelectorAll(sel).forEach(el => candidates.add(el));
    }
    candidates.forEach(takeSnapshot);
  }

  function restoreNode(node, reason){
    const snap = SNAP.get(node);
    if(!snap) return;
    let changed = false;
    if(node.innerHTML !== snap.html){
      node.innerHTML = snap.html;
      changed = true;
    }
    for(const a of config.protectedAttributes){
      const cur = node.getAttribute(a);
      if(cur !== snap.attrs[a]){
        if(snap.attrs[a] == null){ node.removeAttribute(a); }
        else { node.setAttribute(a, snap.attrs[a]); }
        changed = true;
      }
    }
    if(changed){
      const id = node.id ? `#${node.id}` : node.tagName.toLowerCase();
      const msg = `改変を検知して元に戻しました: ${id}${reason ? ' ('+reason+')' : ''}`;
      if(config.showAlert) alert(msg);
      showToast(msg);
      // Also log to console for diagnostics
      try { console.warn('[AntiTamper]', msg, { node }); } catch(_) {}
    }
  }

  function handleMutations(mutations){
    // Batch unique affected elements
    const affected = new Set();
    for(const m of mutations){
      if(m.type === 'characterData'){
        const el = m.target.parentElement;
        if(el && SNAP.has(el)) affected.add(el);
      } else if(m.type === 'attributes'){
        const el = m.target;
        if(SNAP.has(el) && config.protectedAttributes.includes(m.attributeName)){
          affected.add(el);
        }
      } else if(m.type === 'childList'){
        // Added nodes: if they match protection, snapshot them
        m.addedNodes.forEach(n => {
          if(n instanceof Element){
            if(shouldInclude(n) && !shouldExclude(n)) takeSnapshot(n);
            if(n.querySelectorAll){
              const list = config.includeSelectors.join(',');
              if(list) n.querySelectorAll(list).forEach(takeSnapshot);
            }
          }
        });
        // Removed nodes: if a protected element was removed, try to put it back
        m.removedNodes.forEach(n => {
          if(n instanceof Element && SNAP.has(n)){
            try{
              // Reinsert at recorded position if possible
              const ref = m.nextSibling || null;
              m.target.insertBefore(n, ref);
              affected.add(n);
            } catch(_) { /* ignore reinsertion failure */ }
          }
        });
      }
    }
    affected.forEach(el => restoreNode(el));
  }

  function init(){
    snapshotAll();
    const obs = new MutationObserver(handleMutations);
    obs.observe(document.documentElement, {
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeOldValue: true,
      childList: true
    });
    // Expose minimal API for debugging
    window.__antiTamper = {
      resnapshot(){ snapshotAll(); showToast('保護対象のスナップショットを更新しました'); },
      config
    };
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();
