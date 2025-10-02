/**
 * 核兵器と未来兵器論 新デザイン v1
 * 機能概要:
 * - ナビゲーション: モバイル開閉 / active更新 / 目次自動生成
 * - 読書進捗バー / BackToTop
 * - ダーク & ライトテーマ切替 / ハイコントラスト / フォントサイズ調整 (localStorage永続)
 * - タイムライン: 動的生成 / 話者 & カテゴリフィルタ / 展開折畳 / 検索ハイライト
 * - 未来兵器: カード表示 / タグフィルタ / モーダル詳細 / リスクレーダー
 * - 倫理モデル: モーダル(エスカレーション連鎖) / グラフ描画
 * - 検索: 全発言テキスト簡易インデクシング / ハイライト
 * - アクセシビリティ: Esc / フォーカストラップ / ARIA属性
 * - グラフ: Canvas API (Chart.js不使用で軽量実装)
 *
 * 注意: 兵器に関する記述は分析と倫理的考察を目的とし、推奨や助長を意図しません。
 */
(() => {
  'use strict';

  const q = sel => document.querySelector(sel);
  const qa = sel => [...document.querySelectorAll(sel)];

  document.body.classList.remove('no-js');

  /* =========================================================
     データ定義
     ========================================================= */
  const dialogueEntries = [
    {
      id: 'd1',
      speaker: 'rino',
      category: '正当性',
      title: '極限状況での核使用は正当化されるか？',
      summary: '兵力が尽き国家存続が脅かされる状況での「最後の手段」使用は正当と言えるのか問題提起。',
      body: `仮想シナリオ: 敵軍の侵攻により通常戦力は壊滅寸前。指導者は残存市民の生存と国家全域の占領回避のため核使用を検討する。これは自己防衛とみなせるか、それとも無差別損害を優先する不当な判断なのか。`,
      tags: ['抑止','倫理','極限状況'],
      time: '00:01',
      depth: 3
    },
    {
      id: 'd2',
      speaker: 'ai',
      category: '多面的分析',
      title: '国際法 / 倫理 / 戦略の三分岐',
      summary: '自衛権と比例原則、結果主義と義務論、抑止構造の視点を分けて整理。',
      body: `国際法的には自衛権(UN憲章51条)下で必要性と比例性の二要件が問われる。倫理的には結果主義(より多く救う)と義務論(手段の性質)が緊張する。戦略的には完全禁止で抑止が崩れるパラドックスが存在。`,
      tags: ['国際法','倫理','抑止'],
      time: '00:03',
      depth: 4
    },
    {
      id: 'd3',
      speaker: 'rino',
      category: '現実主義',
      title: '理想論と実際の戦場判断の乖離',
      summary: '戦闘状況下で高尚な倫理判断が保持されるかへの懐疑。',
      body: `戦場の極限環境では恐怖・生存本能・即応圧力が理性的配慮を上回る傾向。形式的倫理規範が実行可能性を失うなら、現実的条件を包含した新たな「最低限倫理枠組」が必要ではないかという視点。`,
      tags: ['現実主義','心理'],
      time: '00:06',
      depth: 2
    },
    {
      id: 'd4',
      speaker: 'ai',
      category: '抑止の自己矛盾',
      title: '使えない兵器は抑止力を失う',
      summary: '使用不能なレベルで非難される兵器は実効抑止を維持できない問題。',
      body: `抑止の機能には「信じられる使用可能性」が必要。道徳的全面忌避と抑止力要素はしばしばトレードオフ。信頼度は相手の計算モデル内での行動予測に依存し、それが揺らぐと誤算リスクが増幅する。`,
      tags: ['抑止','戦略'],
      time: '00:10',
      depth: 3
    },
    {
      id: 'd5',
      speaker: 'rino',
      category: '未来相対化',
      title: '核より危険な兵器出現で相対化される懸念',
      summary: '技術発展により核が“中規模”扱いになる未来を仮定。',
      body: `AI群知能・自律ドローン・軌道インフラ撹乱・遺伝子指向性兵器などが実用化されると、核の破壊力と運用コストの比という位置づけが変わり、核使用の心理的閾値が相対的に低下する恐れ。`,
      tags: ['未来兵器','AI','相対化'],
      time: '00:14',
      depth: 4
    },
    {
      id: 'd6',
      speaker: 'ai',
      category: '技術進化',
      title: '小型化と自律性が閾値を下げるメカニズム',
      summary: 'ハードウェアコスト構造と量的飽和が道徳的制御を鈍らせる。',
      body: `高性能SoCや軽量化素材の進化で、個別兵器ユニットが低コスト化。多数展開(スウォーム)による「分散致死性」が都市やインフラを段階的麻痺。核の一発的破局に対し“継続的狩猟”型被害モデルが出現。`,
      tags: ['ハードウェア','スウォーム','小型化'],
      time: '00:18',
      depth: 5
    },
    {
      id: 'd7',
      speaker: 'rino',
      category: 'サイバー脆弱性',
      title: '衛星ネットワーク破壊の懸念',
      summary: '宇宙インフラ依存度増大による脆弱性フォーカス。',
      body: `攻撃手段が物理破壊だけでなくハイジャック・姿勢制御撹乱・デブリ誘発を利用した二次崩壊化。宇宙層のシステム安全性は旧式プロトコル・遅延したパッチなど未整備領域が残る。`,
      tags: ['宇宙','インフラ','サイバー'],
      time: '00:22',
      depth: 4
    },
    {
      id: 'd8',
      speaker: 'ai',
      category: '倫理的限界',
      title: '「仕方ない」論理の連鎖構造',
      summary: '一見合理的な単独判断が集団的破滅確率を上げる構造説明。',
      body: `各国が“他に手段なし”と判断する閾値 > 観察された先例により閾値が徐々に引き下げられる > 模倣と非対称応答 > 累積確率上昇。これを緩和するには、事前コミットメントと透明性プロトコルの設計が不可欠。`,
      tags: ['連鎖','閾値','透明性'],
      time: '00:28',
      depth: 5
    }
  ];

  // 未来兵器データ
  const futureWeapons = [
    {
      id: 'w1',
      name: 'AIスウォーム自律群',
      risk: 'high',
      summary: '多数協調による継続的追尾・選択的抑制。',
      detail: {
        capability: [
          '個々が軽量AI搭載で部分的自律',
          '損耗耐性：一部喪失でも群体知性維持',
          '広域監視と即応攻撃の融合'
        ],
        escalation: '段階的かつ持続的攻撃が「宣戦布告なき漸増」を引き起こし判断の曖昧化。',
        mitigation: [
          '実行ログ署名の標準化',
            '国際的スウォーム閾値協定案',
            '識別ビーコン義務化'
        ]
      },
      tags: ['AI','自律','スウォーム']
    },
    {
      id: 'w2',
      name: '衛星インフラ撹乱兵器',
      risk: 'mid',
      summary: '測位・通信・監視の同時劣化。',
      detail: {
        capability: [
          'ソフトウェア介入による姿勢/出力異常誘導',
          'デブリ誘発リスク',
          '周波数妨害重複攻撃'
        ],
        escalation: '初期段階では「事故」判定が可能でエスカレーション遅延→蓄積的混乱。',
        mitigation: [
          'リアルタイム異常監査チェーン',
          '多層冗長軌道配置',
          '国際事故/攻撃判定フレーム'
        ]
      },
      tags: ['宇宙','通信','サイバー']
    },
    {
      id: 'w3',
      name: '指向性遺伝子標的兵器',
      risk: 'extreme',
      summary: '特定集団を選別的に弱体化する潜在的危険。',
      detail: {
        capability: [
          '遺伝子発現差異利用',
          '潜伏潜行型発症タイマー',
          '治療回避性カスタム'
        ],
        escalation: '発覚遅延により対応が後手化し、報復基準を混乱。',
        mitigation: [
          '国際ゲノム監査/異常検知連携',
          '研究段階の多層倫理審査',
          '救済用ワクチン共有枠組'
        ]
      },
      tags: ['生物','倫理','選択性']
    },
    {
      id: 'w4',
      name: '量子暗号解読基盤',
      risk: 'high',
      summary: '既存通信秘匿性の非対称崩壊。',
      detail: {
        capability: [
          '旧式暗号方式の集中的終端化',
          '隠密的傍受と改ざん',
          '経済基盤信頼性毀損'
        ],
        escalation: '戦争閾値前の「見えない戦争」期間延長により誤判定増大。',
        mitigation: [
          'ポスト量子暗号移行',
          '鍵再配布自動化',
          '異常転送レイテンシ検知'
        ]
      },
      tags: ['量子','暗号','通信']
    },
    {
      id: 'w5',
      name: 'ナノマシン自己複製群',
      risk: 'extreme',
      summary: '制御逸脱時の不可逆連鎖汚染。',
      detail: {
        capability: [
          '分子レベル修飾/侵食',
          '指数的増殖速度',
          '境界条件超過時の不可逆性'
        ],
        escalation: '初期微細段階で検知困難→閾値突破後急激損害。',
        mitigation: [
          '自己停止コールバック内在化',
          '封じ込めシミュ規格',
          '国際事故時即時共有ネット'
        ]
      },
      tags: ['ナノ','自己複製','制御リスク']
    }
  ];

  const coreViewDetails = {
    ethics: {
      title: '倫理的観点の詳細',
      sections: [
        {
          heading: '無差別性と対象選別',
          text: '核兵器は攻撃対象の選別精度が低く、軍事目標から民間領域まで広域損害を与える可能性が高い。結果的に被害が非戦闘員に偏在する倫理的問題。'
        },
        {
          heading: '結果主義 vs 義務論',
          text: '結果主義では「多数救済のため少数犠牲」が容認され得る一方、義務論では「手段としての無差別破壊」自体が不許可と解釈される緊張が生じる。'
        },
        {
          heading: '世代間倫理',
          text: '放射性降下物や環境影響により未出生世代へ外部不利益を押し付ける構造は、世代間正義の観点で問題が指摘される。'
        }
      ]
    },
    deterrence: {
      title: '戦略・抑止力観点',
      sections: [
        {
          heading: '信頼可能性(credibility)',
          text: '抑止は相手が「相応の反撃が来る」と信じる心理計算に依存。政治体制・意思決定構造透明性が信頼度に影響。'
        },
        {
          heading: '二重パラドックス',
          text: '使えば破局、使えねば抑止崩壊。両者を両立する政策メッセージの調整が常に不安定。'
        },
        {
          heading: '閾値滑落',
          text: '「より破局的な兵器」が登場すると核使用の心理的閾値が相対低下し、中規模兵器化するリスク。'
        }
      ]
    },
    technology: {
      title: '技術進化観点',
      sections: [
        {
          heading: '小型化と分散化',
          text: '半導体密度向上/エネルギー密度改善で高度兵器を粒度細かく配備可能。単一巨大兵器から多数協調型への移行。'
        },
        {
          heading: '自律システム',
          text: '人的意思決定ループを外れる自律判断は責任追跡と倫理的審査基準を複雑化。'
        },
        {
          heading: 'インフラ依存指数増加',
          text: '衛星・光ファイバー・ルーティング基盤が基幹的脆弱性として攻撃面を拡大。'
        }
      ]
    },
    time: {
      title: '長期時間軸観点',
      sections: [
        {
          heading: '割引率の衝突',
          text: '短期安全保障獲得と長期的崩壊リスク低減のトレードオフ。政治サイクル短期化が構造的遅延を生む。'
        },
        {
          heading: '累積確率の見誤り',
          text: '単年発生確率が低くても長期積算で現実化可能性が上昇。リスクの“積分”を過小評価。'
        },
        {
          heading: '技術進化の不連続点',
          text: '特定技術の臨界突破で安全保障モデル自体が再定式化される跳躍的転換。'
        }
      ]
    }
  };

  /* =========================================================
     状態管理
     ========================================================= */
  const state = {
    theme: localStorage.getItem('theme') || 'dark',
    highContrast: localStorage.getItem('highContrast') === 'true',
    font: localStorage.getItem('font') || 'base',
    searchQuery: '',
    speakerFilter: 'all',
    categoryFilter: 'all',
    timelineExpanded: new Set(),
    weaponTagFilter: new Set(), // 空集合 = 全表示
  };

  /* =========================================================
     初期化シーケンス
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    applyFontScale();
    if (state.highContrast) document.documentElement.classList.add('high-contrast');

    buildTOC();
    initNav();
    initReadingProgress();
    initBackToTop();
    initSettingsControls();

    buildTimeline();
    buildCategoryFilter();
    buildWeapons();
    buildWeaponTagFilter();
    drawMiniConceptChart();
    drawRiskRadar();
    drawEscalationChart();

    initSearch();
    initCoreViewModals();
    initModalGeneric();
    attachGlobalEvents();
  });

  /* =========================================================
     ナビゲーション / TOC
     ========================================================= */
  function initNav() {
    const mobileToggle = q('#mobileNavToggle');
    const drawer = q('#mobileDrawer');
    mobileToggle?.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        drawer.hidden = true;
      } else {
        drawer.hidden = false;
        drawer.querySelector('a')?.focus();
      }
    });

    // スクロールでactive更新
    const navLinks = qa('.main-nav a, #mobileDrawer a');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      }
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    qa('main section[id]').forEach(sec => observer.observe(sec));

    // 目次ダイアログ
    q('#openToc')?.addEventListener('click', () => openDialog(q('#tocDialog')));
  }

  function buildTOC() {
    const tocList = q('#tocList');
    const sections = qa('main section[id]');
    sections.forEach(sec => {
      const h2 = sec.querySelector('h2');
      if (!h2) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${sec.id}`;
      a.textContent = h2.textContent?.trim() || sec.id;
      a.addEventListener('click', () => {
        closeDialog(q('#tocDialog'));
      });
      li.appendChild(a);
      tocList.appendChild(li);
    });
  }

  /* =========================================================
     読書進捗バー / BackToTop
     ========================================================= */
  function initReadingProgress() {
    const bar = q('.reading-progress__bar');
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = p + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initBackToTop() {
    const btn = q('#backToTop');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 800) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });
    btn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     テーマ / 設定
     ========================================================= */
  function initSettingsControls() {
    q('#themeToggle')?.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
      applyTheme();
    });
    q('#contrastToggle')?.addEventListener('click', () => {
      state.highContrast = !state.highContrast;
      localStorage.setItem('highContrast', String(state.highContrast));
      document.documentElement.classList.toggle('high-contrast', state.highContrast);
    });
    q('#fontInc')?.addEventListener('click', () => adjustFont(1));
    q('#fontDec')?.addEventListener('click', () => adjustFont(-1));

    // スクロールボタン
    qa('[data-scroll-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-scroll-to');
        if (target) {
          const el = q(target);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    q('#themeToggle')?.setAttribute('aria-pressed', state.theme === 'light' ? 'true' : 'false');
  }

  function adjustFont(delta) {
    const order = ['small','base','large','xlarge'];
    let idx = order.indexOf(state.font);
    idx = Math.min(order.length - 1, Math.max(0, idx + delta));
    state.font = order[idx];
    localStorage.setItem('font', state.font);
    applyFontScale();
  }

  function applyFontScale() {
    if (state.font === 'base') {
      document.documentElement.removeAttribute('data-font');
    } else {
      document.documentElement.setAttribute('data-font', state.font);
    }
  }

  /* =========================================================
     タイムライン構築
     ========================================================= */
  function buildTimeline() {
    const list = q('#timelineList');
    list.textContent = '';

    const filtered = dialogueEntries.filter(entry => {
      let ok = true;
      if (state.speakerFilter !== 'all' && entry.speaker !== state.speakerFilter) ok = false;
      if (state.categoryFilter !== 'all' && entry.category !== state.categoryFilter) ok = false;
      if (state.searchQuery) {
        const text = (entry.title + entry.summary + entry.body).toLowerCase();
        if (!text.includes(state.searchQuery.toLowerCase())) ok = false;
      }
      return ok;
    });

    if (!filtered.length) {
      q('#timelineEmpty')?.removeAttribute('hidden');
    } else {
      q('#timelineEmpty')?.setAttribute('hidden','true');
    }

    filtered.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.dataset.speaker = entry.speaker;
      li.dataset.id = entry.id;

      const head = document.createElement('div');
      head.className = 'timeline-head';

      const title = document.createElement('h3');
      title.className = 'timeline-title';
      title.textContent = entry.title;

      const meta = document.createElement('div');
      meta.className = 'timeline-meta';

      const speaker = document.createElement('span');
      speaker.className = 'speaker-badge';
      speaker.dataset.speaker = entry.speaker;
      speaker.textContent = entry.speaker === 'rino' ? 'Rino-program' : 'Claude';

      const category = document.createElement('span');
      category.className = 'category-tag';
      category.textContent = entry.category;

      meta.append(speaker, category);

      head.append(title, meta);

      const body = document.createElement('div');
      body.className = 'timeline-body';
      body.innerHTML = escapeHTML(entry.summary) + ' ' + escapeHTML(entry.body);

      const footer = document.createElement('div');
      footer.className = 'timeline-footer';

      const left = document.createElement('div');
      left.textContent = `時刻 ${entry.time}`;

      const toggle = document.createElement('button');
      toggle.className = 'timeline-toggle';
      toggle.type = 'button';
      toggle.textContent = '展開';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        const expanded = li.classList.toggle('expanded');
        toggle.textContent = expanded ? '折畳' : '展開';
        toggle.setAttribute('aria-expanded', String(expanded));
        if (expanded) {
          state.timelineExpanded.add(entry.id);
        } else {
          state.timelineExpanded.delete(entry.id);
        }
      });

      footer.append(left, toggle);

      li.append(head, body, footer);
      if (state.timelineExpanded.has(entry.id)) {
        li.classList.add('expanded');
        toggle.textContent = '折畳';
        toggle.setAttribute('aria-expanded','true');
      }

      list.appendChild(li);
    });

    if (state.searchQuery) {
      highlightSearch(state.searchQuery, list);
    }
  }

  function buildCategoryFilter() {
    const uniqueCats = [...new Set(dialogueEntries.map(d => d.category))].sort();
    const select = q('#categoryFilter');
    uniqueCats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    q('#speakerFilter')?.addEventListener('change', e => {
      state.speakerFilter = e.target.value;
      buildTimeline();
    });

    select?.addEventListener('change', e => {
      state.categoryFilter = e.target.value;
      buildTimeline();
    });

    q('#expandAll')?.addEventListener('click', () => {
      dialogueEntries.forEach(d => state.timelineExpanded.add(d.id));
      buildTimeline();
    });
    q('#collapseAll')?.addEventListener('click', () => {
      state.timelineExpanded.clear();
      buildTimeline();
    });
  }

  /* =========================================================
     検索機能
     ========================================================= */
  function initSearch() {
    const input = q('#siteSearch');
    const clearBtn = q('#clearSearch');

    input?.addEventListener('input', () => {
      state.searchQuery = input.value.trim();
      clearBtn.hidden = state.searchQuery.length === 0;
      buildTimeline();
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      state.searchQuery = '';
      clearBtn.hidden = true;
      buildTimeline();
      input.focus();
    });
  }

  function highlightSearch(query, container) {
    if (!query) return;
    const regex = new RegExp(`(${escapeRegExp(query)})`,'ig');
    qa('.timeline-body', container).forEach(b => {
      b.innerHTML = b.innerHTML.replace(/<span class="highlight">(.*?)<\/span>/g,'$1'); // reset
      b.innerHTML = b.innerHTML.replace(regex,'<span class="highlight">$1</span>');
    });
  }

  /* =========================================================
     未来兵器
     ========================================================= */
  function buildWeapons() {
    const grid = q('#weaponGrid');
    grid.textContent = '';

    const filtered = futureWeapons.filter(w => {
      if (state.weaponTagFilter.size === 0) return true;
      return w.tags.some(t => state.weaponTagFilter.has(t));
    });

    filtered.forEach(w => {
      const card = document.createElement('div');
      card.className = 'weapon-card';
      card.dataset.risk = w.risk;
      card.tabIndex = 0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label',`${w.name} 詳細を開く`);

      const risk = document.createElement('span');
      risk.className = 'weapon-risk';
      risk.textContent = riskLabel(w.risk);
      card.appendChild(risk);

      const h3 = document.createElement('h3');
      h3.textContent = w.name;
      card.appendChild(h3);

      const meta = document.createElement('div');
      meta.className = 'weapon-meta';
      meta.innerHTML = `<span>${w.tags.join(' / ')}</span>`;
      card.appendChild(meta);

      const summary = document.createElement('p');
      summary.className = 'weapon-summary';
      summary.textContent = w.summary;
      card.appendChild(summary);

      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'weapon-tags';
      w.tags.forEach(t => {
        const span = document.createElement('span');
        span.textContent = t;
        tagsDiv.appendChild(span);
      });
      card.appendChild(tagsDiv);

      card.addEventListener('click', () => openWeaponModal(w));
      card.addEventListener('keypress', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openWeaponModal(w);
        }
      });

      grid.appendChild(card);
    });
  }

  function buildWeaponTagFilter() {
    const allTags = new Set();
    futureWeapons.forEach(w => w.tags.forEach(t => allTags.add(t)));
    const container = q('#weaponTags');
    container.textContent = '';

    // “全て”ボタン
    const allBtn = document.createElement('button');
    allBtn.textContent = 'ALL';
    allBtn.setAttribute('aria-pressed', state.weaponTagFilter.size === 0 ? 'true' : 'false');
    allBtn.addEventListener('click', () => {
      state.weaponTagFilter.clear();
      buildWeapons();
      qa('#weaponTags button').forEach(b => b.setAttribute('aria-pressed','false'));
      allBtn.setAttribute('aria-pressed','true');
    });
    container.appendChild(allBtn);

    [...allTags].sort().forEach(tag => {
      const btn = document.createElement('button');
      btn.textContent = tag;
      btn.setAttribute('aria-pressed', state.weaponTagFilter.has(tag) ? 'true' : 'false');
      btn.addEventListener('click', () => {
        if (state.weaponTagFilter.has(tag)) {
          state.weaponTagFilter.delete(tag);
        } else {
          state.weaponTagFilter.add(tag);
        }
        // もし全て外れたらALLをtrue
        buildWeapons();
        updateWeaponTagButtons();
      });
      container.appendChild(btn);
    });

    function updateWeaponTagButtons() {
      const buttons = qa('#weaponTags button');
      const allSelected = state.weaponTagFilter.size === 0;
      buttons.forEach(btn => {
        if (btn.textContent === 'ALL') {
          btn.setAttribute('aria-pressed', allSelected ? 'true' : 'false');
        } else {
          const t = btn.textContent;
            btn.setAttribute('aria-pressed', state.weaponTagFilter.has(t) ? 'true' : 'false');
        }
      });
    }
  }

  function riskLabel(risk) {
    switch (risk) {
      case 'low': return '低';
      case 'mid': return '中';
      case 'high': return '高';
      case 'extreme': return '極';
      default: return risk;
    }
  }

  function openWeaponModal(w) {
    const modal = q('#modal');
    const content = q('#modalContent');
    q('#modalTitle').textContent = w.name;
    content.innerHTML = `
      <div class="modal-section">
        <h4>概要</h4>
        <p>${escapeHTML(w.summary)}</p>
        <p><strong>リスク指標:</strong> ${riskLabel(w.risk)}</p>
      </div>
      <div class="modal-section">
        <h4>能力/特徴</h4>
        <ul>${w.detail.capability.map(c => `<li>${escapeHTML(c)}</li>`).join('')}</ul>
      </div>
      <div class="modal-section">
        <h4>エスカレーション様式</h4>
        <p>${escapeHTML(w.detail.escalation)}</p>
      </div>
      <div class="modal-section">
        <h4>緩和策 / 対策案</h4>
        <ul>${w.detail.mitigation.map(m => `<li>${escapeHTML(m)}</li>`).join('')}</ul>
      </div>
      <p style="font-size:.7rem;color:var(--color-text-faint);margin-top:.5rem;">本説明は倫理的・学術的考察を目的とする抽象化であり、具体的運用や実装を推奨しません。</p>
    `;
    openDialog(modal);
  }

  /* =========================================================
     コア視座モーダル
     ========================================================= */
  function initCoreViewModals() {
    qa('[data-view-detail]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-view-detail');
        const data = coreViewDetails[key];
        if (!data) return;
        const modal = q('#modal');
        q('#modalTitle').textContent = data.title;
        const content = q('#modalContent');
        content.innerHTML = data.sections.map(sec => `
          <div class="modal-section">
            <h4>${escapeHTML(sec.heading)}</h4>
            <p>${escapeHTML(sec.text)}</p>
          </div>
        `).join('');
        openDialog(modal);
      });
    });
  }

  /* =========================================================
     汎用モーダルイベント（エスカレーションチェーン / 利用法）
     ========================================================= */
  function initModalGeneric() {
    qa('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-open-modal');
        openGenericModal(key);
      });
    });
  }

  function openGenericModal(key) {
    const modal = q('#modal');
    const titleEl = q('#modalTitle');
    const content = q('#modalContent');
    switch (key) {
      case 'escalationChain':
        titleEl.textContent = '「仕方ない」連鎖モデル';
        content.innerHTML = `
          <div class="modal-section">
            <h4>段階的エスカレーション</h4>
            <p>各アクターが“他に打つ手がない”と判断する閾値が先行事例により調整され、総体閾値が徐々に低下する自己強化スパイラル。</p>
          </div>
          <div class="modal-section">
            <h4>典型パターン</h4>
            <ul>
              <li>A国: 生存確保のため限定的使用 → 先例化</li>
              <li>B国: 報復正当性主張 → 閾値再定義</li>
              <li>C国: 抑止不全認識 → 新兵器投入</li>
              <li>拡散: ルールセット不信 → 規範希薄化</li>
            </ul>
          </div>
          <div class="modal-section">
            <h4>緩和要素</h4>
            <ul>
              <li>透明性 / 事前宣言プロトコル</li>
              <li>多国間リアルタイム監査</li>
              <li>閾値定義の共有言語化</li>
              <li>シナリオ別応答シミュレーション常設</li>
            </ul>
          </div>
        `;
        break;
      case 'howToUse':
        titleEl.textContent = 'アーカイブ活用ガイド';
        content.innerHTML = `
          <div class="modal-section">
            <h4>研究 / 学習</h4>
            <p>対話断片を倫理・戦略・技術の3軸で再分類し、議論構造の俯瞰を支援。</p>
          </div>
          <div class="modal-section">
            <h4>議論演習</h4>
            <p>1. 問題設定 → 2. 観点マッピング → 3. 時間軸シナリオ → 4. リスク緩和策提示 の流れでディスカッション練習。</p>
          </div>
          <div class="modal-section">
            <h4>注意</h4>
            <p>本アーカイブ内容は抽象的分析であり、実運用・現実的戦略行動の助言ではありません。</p>
          </div>
        `;
        break;
      default:
        return;
    }
    openDialog(modal);
  }

  /* =========================================================
     Dialog / Modal 共通
     ========================================================= */
  function openDialog(dialog) {
    if (!dialog) return;
    dialog.showModal();
    trapFocus(dialog);
    dialog.addEventListener('click', outsideClose);
    // Escapeキーはデフォルトで閉じる
    qa('.dialog-close', dialog).forEach(btn => {
      btn.addEventListener('click', () => closeDialog(dialog), { once: true });
    });
  }

  function closeDialog(dialog) {
    dialog.close();
    releaseFocusTrap();
    dialog.removeEventListener('click', outsideClose);
  }

  function outsideClose(e) {
    const dialog = e.currentTarget;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom) {
      closeDialog(dialog);
    }
  }

  /* =========================================================
     フォーカストラップ
     ========================================================= */
  let focusTrapStack = [];
  function trapFocus(container) {
    const focusable = qa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(el => !el.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function keyHandler(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        const dlg = container.nodeName === 'DIALOG' ? container : container.closest('dialog');
        if (dlg) closeDialog(dlg);
      }
    }
    focusTrapStack.push(keyHandler);
    container.addEventListener('keydown', keyHandler);
    first.focus();
  }

  function releaseFocusTrap() {
    const handler = focusTrapStack.pop();
    if (!handler) return;
    document.removeEventListener('keydown', handler);
  }

  /* =========================================================
     ミニ概念チャート (Canvas API 単純図)
     ========================================================= */
  function drawMiniConceptChart() {
    const canvas = q('#miniChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = 120;
    ctx.clearRect(0,0,w,h);

    const points = [
      { label: '倫理', x: w*0.18, y: h*0.75, color: '#ffb347' },
      { label: '戦略', x: w*0.38, y: h*0.35, color: '#5d8bff' },
      { label: '技術', x: w*0.62, y: h*0.55, color: '#7f53ff' },
      { label: '不確実性', x: w*0.82, y: h*0.4, color: '#ff5d73' }
    ];

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    for (let i=0; i<points.length; i++) {
      for (let j=i+1; j<points.length; j++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
    }

    points.forEach(p => {
      const grd = ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,18);
      grd.addColorStop(0,p.color);
      grd.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x,p.y,18,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '11px "Inter","Noto Sans JP"';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x, p.y+4);
    });
  }

  /* =========================================================
     リスクレーダー (Canvas)
     ========================================================= */
  function drawRiskRadar() {
    const canvas = q('#riskRadar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height;
    const cx = w/2;
    const cy = h/2 + 10;
    const radius = Math.min(w,h)/2 - 25;

    const factors = ['拡散性','検知困難','制御喪失','倫理懸念','エスカレ','再現性'];
    // 仮スコア(0-10)
    const scores = [7,8,9,10,8,7];

    // レベルリング
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let level=2; level<=10; level+=2) {
      ctx.beginPath();
      factors.forEach((_, idx) => {
        const angle = (Math.PI*2 / factors.length)*idx - Math.PI/2;
        const r = radius * (level/10);
        const x = cx + Math.cos(angle)*r;
        const y = cy + Math.sin(angle)*r;
        if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    // 領域
    ctx.beginPath();
    scores.forEach((s, idx) => {
      const angle = (Math.PI*2 / factors.length)*idx - Math.PI/2;
      const r = radius * (s/10);
      const x = cx + Math.cos(angle)*r;
      const y = cy + Math.sin(angle)*r;
      if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,99,132,0.25)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,99,132,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ラベル
    ctx.fillStyle = '#fff';
    ctx.font = '11px "Inter","Noto Sans JP"';
    factors.forEach((f, idx) => {
      const angle = (Math.PI*2 / factors.length)*idx - Math.PI/2;
      const x = cx + Math.cos(angle)*(radius+12);
      const y = cy + Math.sin(angle)*(radius+12);
      ctx.textAlign = 'center';
      ctx.fillText(f, x, y);
    });
  }

  /* =========================================================
     エスカレーション グラフ (Canvas)
     ========================================================= */
  function drawEscalationChart() {
    const canvas = q('#escalationChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height;

    // データ（概念）
    const points = [
      { t:0, v: 2 },
      { t:1, v: 3 },
      { t:2, v: 4.5 },
      { t:3, v: 6.5 },
      { t:4, v: 8.2 },
      { t:5, v: 9.3 },
      { t:6, v: 9.8 }
    ];
    const maxV = 10;

    // 背景
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0,0,w,h);

    // 軸
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, h-30);
    ctx.lineTo(w-10, h-30);
    ctx.stroke();

    // y軸ラベル
    ctx.fillStyle = '#fff';
    ctx.font = '11px "Inter","Noto Sans JP"';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i=2; i<=10; i+=2) {
      const y = mapValue(i,0,maxV,h-30,10);
      ctx.fillText(i.toString(), 35, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(40,y);
      ctx.lineTo(w-10,y);
      ctx.stroke();
    }

    // 線
    ctx.beginPath();
    points.forEach((p,i) => {
      const x = mapValue(p.t,0,6,40,w-20);
      const y = mapValue(p.v,0,maxV,h-30,10);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    const gradient = ctx.createLinearGradient(0,0,w,0);
    gradient.addColorStop(0,'#ffa95d');
    gradient.addColorStop(1,'#ff5d73');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 点
    points.forEach(p => {
      const x = mapValue(p.t,0,6,40,w-20);
      const y = mapValue(p.v,0,maxV,h-30,10);
      ctx.beginPath();
      ctx.fillStyle = '#ffb347';
      ctx.arc(x,y,5,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 説明
    ctx.font = '10px "Inter","Noto Sans JP"';
    ctx.fillStyle = '#ffb347';
    ctx.textAlign = 'left';
    ctx.fillText('時間的ステップ (t)', w/2, h-10);
  }

  function mapValue(v,min,max,minPx,maxPx){
    return minPx + ( (v-min)/(max-min) )*(maxPx - minPx);
  }

  /* =========================================================
     ユーティリティ
     ========================================================= */
  function escapeHTML(str='') {
    return str.replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }

  /* =========================================================
     グローバルイベント
     ========================================================= */
  function attachGlobalEvents() {
    // Resizeで再描画
    window.addEventListener('resize', debounce(() => {
      drawMiniConceptChart();
      drawRiskRadar();
      drawEscalationChart();
    }, 300));

    // キーボードショートカット例
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        q('#siteSearch')?.focus();
      }
    });
  }

  /* =========================================================
     Debounce
     ========================================================= */
  function debounce(fn, wait=250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

})();
