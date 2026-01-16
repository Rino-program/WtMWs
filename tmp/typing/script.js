const wordSets={
    japanese:[
        {w:'桜',r:'sakura'},{w:'富士山',r:'fujisan'},{w:'東京',r:'toukyou'},{w:'日本',r:'nihon'},
        {w:'猫',r:'neko'},{w:'犬',r:'inu'},{w:'本',r:'hon'},{w:'水',r:'mizu'},{w:'火',r:'hi'},
        {w:'空',r:'sora'},{w:'海',r:'umi'},{w:'山',r:'yama'},{w:'川',r:'kawa'},{w:'森',r:'mori'},
        {w:'花',r:'hana'},{w:'鳥',r:'tori'},{w:'魚',r:'sakana'},{w:'月',r:'tsuki'},{w:'星',r:'hoshi'},
        {w:'春',r:'haru'},{w:'夏',r:'natsu'},{w:'秋',r:'aki'},{w:'冬',r:'fuyu'},
        {w:'朝',r:'asa'},{w:'昼',r:'hiru'},{w:'夜',r:'yoru'},{w:'今日',r:'kyou'},{w:'明日',r:'ashita'},
        {w:'学校',r:'gakkou'},{w:'先生',r:'sensei'},{w:'友達',r:'tomodachi'},{w:'家族',r:'kazoku'},
        {w:'電車',r:'densha'},{w:'飛行機',r:'hikouki'},{w:'自転車',r:'jitensha'},{w:'車',r:'kuruma'},
        {w:'食べる',r:'taberu'},{w:'飲む',r:'nomu'},{w:'見る',r:'miru'},{w:'聞く',r:'kiku'},
        {w:'話す',r:'hanasu'},{w:'書く',r:'kaku'},{w:'読む',r:'yomu'},{w:'走る',r:'hashiru'},
        {w:'プログラム',r:'puroguramu'},{w:'コンピュータ',r:'konpyuuta'},{w:'インターネット',r:'intaanetto'},
        {w:'ありがとう',r:'arigatou'},{w:'こんにちは',r:'konnichiha'},{w:'さようなら',r:'sayounara'}
    ],
    english:['hello','world','typing','keyboard','computer','programming','javascript','function','algorithm',
        'development','application','interface','database','network','browser','server','client','variable',
        'constant','object','array','string','number','boolean','module','package','library','framework',
        'design','pattern','security','performance','optimization','animation','responsive','dynamic'],
    code:['const','let','var','function','return','if','else','for','while','class','import','export',
        'async','await','try','catch','console.log','document.querySelector','addEventListener',
        'setTimeout','setInterval','Promise','Array.map','Object.keys','String.split','JSON.parse',
        'fetch','async function','arrow =>','spread ...','template `${}`','destructure {}'],
    proverbs:[
        {w:'七転び八起き',r:'nanakorobiyaoki'},{w:'一石二鳥',r:'issekinichou'},
        {w:'花より団子',r:'hanayoridango'},{w:'猿も木から落ちる',r:'sarumokikaraochiru'},
        {w:'継続は力なり',r:'keizokuhachikanari'},{w:'急がば回れ',r:'isogabamaware'},
        {w:'塵も積もれば山となる',r:'chiromotsumorebayamatonaru'},
        {w:'百聞は一見にしかず',r:'hyakubunhaikkenishikazu'},
        {w:'早起きは三文の徳',r:'hayaokihasanmonnotoku'},
        {w:'石の上にも三年',r:'ishinouenimosannen'}
    ],
    time:['the','and','for','are','but','not','you','all','can','was','one','our','out','day','get',
        'has','him','his','how','its','may','new','now','see','two','way','who','boy','did','own'],
    // 新しいプリセット
    programming:['variable','function','algorithm','parameter','iteration','recursion','inheritance',
        'polymorphism','encapsulation','abstraction','interface','constructor','destructor','method',
        'property','attribute','instance','static','dynamic','compile','runtime','debugging','refactor',
        'repository','version','branch','merge','commit','deploy','container','microservice','api',
        'endpoint','request','response','authentication','authorization','encryption','database'],
    business:['meeting','deadline','proposal','strategy','marketing','revenue','budget','quarterly',
        'stakeholder','collaboration','initiative','milestone','deliverable','objective','performance',
        'evaluation','presentation','negotiation','agreement','contract','compliance','regulation',
        'efficiency','productivity','innovation','leadership','management','communication','teamwork'],
    hiragana:[
        {w:'あいうえお',r:'aiueo'},{w:'かきくけこ',r:'kakikukeko'},{w:'さしすせそ',r:'sashisuseso'},
        {w:'たちつてと',r:'tachitsuteto'},{w:'なにぬねの',r:'naninuneno'},{w:'はひふへほ',r:'hahifuheho'},
        {w:'まみむめも',r:'mamimumemo'},{w:'やゆよ',r:'yayuyo'},{w:'らりるれろ',r:'rarirurero'},
        {w:'わをん',r:'wawon'},{w:'きょう',r:'kyou'},{w:'しゃしゅしょ',r:'shashusho'},
        {w:'ちゃちゅちょ',r:'chachucho'},{w:'にゃにゅにょ',r:'nyanyunyo'},{w:'ひゃひゅひょ',r:'hyahyuhyo'},
        {w:'みゃみゅみょ',r:'myamyumyo'},{w:'りゃりゅりょ',r:'ryaryuryo'},{w:'ぎゃぎゅぎょ',r:'gyagyugyo'},
        {w:'じゃじゅじょ',r:'jajujo'},{w:'びゃびゅびょ',r:'byabyubyo'},{w:'ぴゃぴゅぴょ',r:'pyapyupyo'}
    ],
    speech:[
        'I have a dream that one day this nation will rise up',
        'Ask not what your country can do for you',
        'The only thing we have to fear is fear itself',
        'We shall fight on the beaches',
        'That government of the people by the people',
        'One small step for man one giant leap for mankind',
        'I have nothing to offer but blood toil tears and sweat',
        'The greatest glory in living lies not in never falling',
        'In the end it is not the years in your life that count',
        'Success is not final failure is not fatal'
    ],
    custom:[] // カスタムテキスト用
};

// プリセットテキスト集
const presetTexts={
    programming:[
        {name:'JavaScript基礎',text:'const function return async await promise array object string number boolean'},
        {name:'Python基礎',text:'def class import from return print list dict tuple set lambda'},
        {name:'HTML/CSS',text:'div span class id style margin padding border display flex grid'},
        {name:'Git コマンド',text:'git add commit push pull merge branch checkout status log diff'},
        {name:'データ構造',text:'array stack queue tree graph hash table linked list binary search'}
    ],
    business:[
        {name:'ビジネスメール',text:'Please find attached the requested documents for your review'},
        {name:'会議用語',text:'agenda minutes action items follow up deadline stakeholder'},
        {name:'プレゼン表現',text:'Let me begin by introducing our key findings and recommendations'},
        {name:'報告書',text:'quarterly report revenue growth market analysis performance metrics'}
    ],
    hiragana:[
        {name:'あ行〜な行',text:'あいうえお かきくけこ さしすせそ たちつてと なにぬねの'},
        {name:'は行〜ん',text:'はひふへほ まみむめも やゆよ らりるれろ わをん'},
        {name:'拗音',text:'きゃきゅきょ しゃしゅしょ ちゃちゅちょ にゃにゅにょ ひゃひゅひょ'},
        {name:'濁音・半濁音',text:'がぎぐげご ざじずぜぞ だぢづでど ばびぶべぼ ぱぴぷぺぽ'}
    ],
    speech:[
        {name:'キング牧師',text:'I have a dream that one day this nation will rise up and live out the true meaning of its creed'},
        {name:'ケネディ大統領',text:'Ask not what your country can do for you ask what you can do for your country'},
        {name:'チャーチル首相',text:'We shall fight on the beaches we shall fight on the landing grounds we shall never surrender'},
        {name:'リンカーン大統領',text:'Government of the people by the people for the people shall not perish from the earth'}
    ]
};

const kbRows=[
    ['1','2','3','4','5','6','7','8','9','0','-'],
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.']
];

let mode='japanese',difficulty='normal',currentWord=null,romanji='',charIndex=0;
let score=0,level=1,combo=0,maxCombo=0,totalChars=0,correctChars=0,wordsTyped=0;
let startTime=0,timeLeft=60,timer=null,isPlaying=false;
let missedChars={},achievements=JSON.parse(localStorage.getItem('typingAchievements')||'{}');
let customTexts=JSON.parse(localStorage.getItem('typingCustomTexts')||'[]');
let sessionHistory=JSON.parse(localStorage.getItem('typingSessionHistory')||'[]');
let keyStats=JSON.parse(localStorage.getItem('typingKeyStats')||'{}');
let allMissedChars=JSON.parse(localStorage.getItem('typingAllMissedChars')||'{}');
let missedWords=[];
let wpmHistory=[];
let currentCustomText='';
let customWordIndex=0;
const input=document.getElementById('typingInput');

// Create keyboard
function createKeyboard(){
    const kb=document.getElementById('keyboard');
    kb.innerHTML=kbRows.map(row=>`<div class="kb-row">${row.map(k=>`<div class="kb-key" data-key="${k}">${k}</div>`).join('')}</div>`).join('');
    kb.innerHTML+=`<div class="kb-row"><div class="kb-key space" data-key=" ">space</div></div>`;
}

function highlightKey(key,error=false){
    const keyEl=document.querySelector(`.kb-key[data-key="${key.toLowerCase()}"]`);
    if(keyEl){
        keyEl.classList.add(error?'error':'active');
        setTimeout(()=>keyEl.classList.remove('active','error'),100);
    }
}

document.querySelectorAll('.modes button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.modes .active').classList.remove('active');
        this.classList.add('active');
        mode=this.dataset.mode;
        if(mode==='custom'){
            openModal('customModal');
        }else{
            restart();
        }
    };
});

document.getElementById('difficultySelect').onchange=e=>{
    difficulty=e.target.value;
    restart();
};

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.onclick=function(){
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('tab-'+this.dataset.tab).classList.add('active');
    };
});

// Modal functions
function openModal(id){
    document.getElementById(id).classList.add('show');
    if(id==='customModal'){
        renderSavedTexts();
        renderPresets();
    }else if(id==='statsModal'){
        renderDetailedStats();
    }else if(id==='practiceModal'){
        renderPracticeOptions();
    }
}

function closeModal(id){
    document.getElementById(id).classList.remove('show');
}

// Event listeners for buttons
document.getElementById('customTextBtn').onclick=()=>openModal('customModal');
document.getElementById('statsBtn').onclick=()=>openModal('statsModal');
document.getElementById('practiceBtn').onclick=()=>openModal('practiceModal');

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal=>{
    modal.onclick=e=>{
        if(e.target===modal)closeModal(modal.id);
    };
});

function getWord(){
    // カスタムモードの場合
    if(mode==='custom'&&wordSets.custom.length>0){
        const w=wordSets.custom[customWordIndex%wordSets.custom.length];
        customWordIndex++;
        return{display:w,reading:w};
    }
    // スピーチモードの場合（長い文章をそのまま表示）
    if(mode==='speech'){
        const sentences=wordSets.speech;
        const s=sentences[Math.random()*sentences.length|0];
        return{display:s,reading:s.toLowerCase()};
    }
    const words=wordSets[mode];
    if(!words||words.length===0){
        return{display:'typing',reading:'typing'};
    }
    const w=words[Math.random()*words.length|0];
    if(typeof w==='string')return{display:w,reading:w};
    return{display:w.w,reading:w.r};
}

// ローマ字入力の代替パターン対応
const romajiAlternatives={
    'shi':'si','si':'shi',
    'chi':'ti','ti':'chi',
    'tsu':'tu','tu':'tsu',
    'fu':'hu','hu':'fu',
    'ji':'zi','zi':'ji',
    'sha':'sya','sya':'sha',
    'shu':'syu','syu':'shu',
    'sho':'syo','syo':'sho',
    'cha':'tya','tya':'cha',
    'chu':'tyu','tyu':'chu',
    'cho':'tyo','tyo':'cho',
    'ja':'zya','zya':'ja','jya':'ja',
    'ju':'zyu','zyu':'ju','jyu':'ju',
    'jo':'zyo','zyo':'jo','jyo':'jo',
    'nn':'n\'','n\'':'nn'
};

// 入力がターゲットと一致するか、代替パターンでも許容されるかチェック
function matchesWithAlternatives(input,target){
    if(input===target)return true;
    // 代替パターンをチェック
    for(const[pattern,alt] of Object.entries(romajiAlternatives)){
        const modifiedTarget=target.replace(pattern,alt);
        if(input===modifiedTarget)return true;
        const modifiedInput=input.replace(pattern,alt);
        if(modifiedInput===target)return true;
    }
    return false;
}

// 入力中の部分一致をチェック
function partialMatchWithAlternatives(input,target){
    if(target.startsWith(input))return true;
    // 代替パターンで部分一致をチェック
    for(const[pattern,alt] of Object.entries(romajiAlternatives)){
        const modifiedTarget=target.replace(pattern,alt);
        if(modifiedTarget.startsWith(input))return true;
    }
    return false;
}

function renderWord(){
    document.getElementById('wordMain').textContent=currentWord.display;
    document.getElementById('wordReading').innerHTML=romanji.split('').map((c,i)=>{
        let cls='char';
        if(i<charIndex)cls+=' correct';
        if(i===charIndex)cls+=' current';
        return`<span class="${cls}">${c}</span>`;
    }).join('');
}

function newWord(){
    currentWord=getWord();
    romanji=currentWord.reading;
    charIndex=0;
    input.value='';
    renderWord();
}

function updateStats(){
    const elapsed=(Date.now()-startTime)/1000/60;
    const wpm=elapsed>0?Math.round(wordsTyped/elapsed):0;
    const acc=totalChars>0?Math.round(correctChars/totalChars*100):100;
    document.getElementById('wpm').textContent=wpm;
    document.getElementById('accuracy').textContent=acc+'%';
    document.getElementById('score').textContent=score;
    document.getElementById('level').textContent=level;
    document.getElementById('levelBadge').textContent='Lv.'+level;
}

function showCombo(){
    const el=document.getElementById('combo');
    document.getElementById('comboNum').textContent=combo;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),800);
}

function levelUp(){
    level++;
    timeLeft+=10;
    showAchievement(`🎯 レベル${level}達成!`);
    playSound(880,0.15);
}

function showAchievement(text){
    const el=document.createElement('div');
    el.className='achievement-popup';
    el.textContent=text;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),3000);
}

function playSound(freq,dur=0.1){
    try{
        const ctx=new(window.AudioContext||window.webkitAudioContext)();
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.frequency.value=freq;
        osc.connect(gain);gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.1,ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+dur);
        osc.start();osc.stop(ctx.currentTime+dur);
    }catch{}
}

function endGame(){
    isPlaying=false;
    clearInterval(timer);
    const elapsed=(Date.now()-startTime)/1000/60;
    const wpm=elapsed>0?Math.round(wordsTyped/elapsed):0;
    const acc=totalChars>0?Math.round(correctChars/totalChars*100):100;
    
    const isNewBest=score>(+localStorage.getItem('typingBest')||0);
    if(isNewBest)localStorage.setItem('typingBest',score);
    
    // セッション履歴を保存
    const session={
        date:new Date().toISOString(),
        wpm,acc,score,mode,
        wordsTyped,maxCombo,level
    };
    sessionHistory.unshift(session);
    if(sessionHistory.length>50)sessionHistory.pop();
    localStorage.setItem('typingSessionHistory',JSON.stringify(sessionHistory));
    
    // 全体のミス統計を更新
    for(const[char,count] of Object.entries(missedChars)){
        allMissedChars[char]=(allMissedChars[char]||0)+count;
    }
    localStorage.setItem('typingAllMissedChars',JSON.stringify(allMissedChars));
    localStorage.setItem('typingKeyStats',JSON.stringify(keyStats));
    
    document.getElementById('resultStats').innerHTML=`
        <div class="result-stat${isNewBest?' highlight':''}"><div class="val">${wpm}</div><div class="label">WPM</div></div>
        <div class="result-stat"><div class="val">${acc}%</div><div class="label">正確率</div></div>
        <div class="result-stat"><div class="val">${score}</div><div class="label">スコア</div></div>
        <div class="result-stat"><div class="val">${maxCombo}x</div><div class="label">最大コンボ</div></div>
        <div class="result-stat"><div class="val">${wordsTyped}</div><div class="label">単語数</div></div>
        <div class="result-stat"><div class="val">Lv.${level}</div><div class="label">到達レベル</div></div>
    `;
    
    // Miss analysis
    const missArr=Object.entries(missedChars).sort((a,b)=>b[1]-a[1]).slice(0,8);
    document.getElementById('missAnalysis').innerHTML=missArr.length?`
        <h3>📊 ミスタイプ分析</h3>
        <div class="miss-list">${missArr.map(([c,n])=>`<div class="miss-char">${c}<span>×${n}</span></div>`).join('')}</div>
    `:'';
    
    // WPM Chart
    renderWpmChart();
    
    // Key accuracy display
    renderKeyAccuracy();
    
    document.getElementById('result').classList.add('show');
    checkAchievements(wpm,acc);
}

function renderWpmChart(){
    const canvas=document.getElementById('wpmChart');
    const ctx=canvas.getContext('2d');
    const width=canvas.width;
    const height=canvas.height;
    
    ctx.clearRect(0,0,width,height);
    
    if(wpmHistory.length<2){
        ctx.fillStyle='#666';
        ctx.font='14px sans-serif';
        ctx.textAlign='center';
        ctx.fillText('データが不足しています',width/2,height/2);
        return;
    }
    
    const maxWpm=Math.max(...wpmHistory,1);
    const padding=30;
    const graphWidth=width-padding*2;
    const graphHeight=height-padding*2;
    
    // Draw axes
    ctx.strokeStyle='#444';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(padding,padding);
    ctx.lineTo(padding,height-padding);
    ctx.lineTo(width-padding,height-padding);
    ctx.stroke();
    
    // Draw WPM line
    ctx.strokeStyle='#4facfe';
    ctx.lineWidth=2;
    ctx.beginPath();
    wpmHistory.forEach((wpm,i)=>{
        const x=padding+i*(graphWidth/(wpmHistory.length-1));
        const y=height-padding-(wpm/maxWpm)*graphHeight;
        if(i===0)ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle='#4facfe';
    wpmHistory.forEach((wpm,i)=>{
        const x=padding+i*(graphWidth/(wpmHistory.length-1));
        const y=height-padding-(wpm/maxWpm)*graphHeight;
        ctx.beginPath();
        ctx.arc(x,y,3,0,Math.PI*2);
        ctx.fill();
    });
    
    // Labels
    ctx.fillStyle='#888';
    ctx.font='10px sans-serif';
    ctx.textAlign='left';
    ctx.fillText(maxWpm+' WPM',padding+5,padding+10);
    ctx.fillText('0',padding+5,height-padding-5);
}

function renderKeyAccuracy(){
    const container=document.getElementById('keyAccuracy');
    const keys='abcdefghijklmnopqrstuvwxyz'.split('');
    
    let html='<h3>⌨️ キー別正確率</h3><div class="key-grid" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">';
    
    keys.forEach(key=>{
        const stats=keyStats[key]||{correct:0,total:0};
        const rate=stats.total>0?Math.round(stats.correct/stats.total*100):100;
        let cls='excellent';
        if(rate<95)cls='good';
        if(rate<85)cls='average';
        if(rate<70)cls='poor';
        
        html+=`<div class="key-stat ${cls}" style="width:30px;height:35px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:5px;">
            <span class="key-char">${key}</span>
            <span class="key-rate">${stats.total>0?rate+'%':'-'}</span>
        </div>`;
    });
    
    html+='</div>';
    container.innerHTML=html;
}

function checkAchievements(wpm,acc){
    if(wpm>=50&&!achievements.wpm50){achievements.wpm50=true;showAchievement('🏆 50WPM達成!')}
    if(wpm>=80&&!achievements.wpm80){achievements.wpm80=true;showAchievement('🏆 80WPM達成!')}
    if(acc===100&&wordsTyped>=10&&!achievements.perfect){achievements.perfect=true;showAchievement('🏆 パーフェクト!')}
    if(maxCombo>=10&&!achievements.combo10){achievements.combo10=true;showAchievement('🔥 10コンボ!')}
    localStorage.setItem('typingAchievements',JSON.stringify(achievements));
}

function restart(){
    document.getElementById('result').classList.remove('show');
    score=0;level=1;combo=0;maxCombo=0;totalChars=0;correctChars=0;wordsTyped=0;
    missedChars={};
    missedWords=[];
    wpmHistory=[];
    customWordIndex=0;
    timeLeft=mode==='time'?30:60;
    document.getElementById('timeLeft').textContent=timeLeft;
    document.getElementById('progressBar').style.width='0%';
    clearInterval(timer);
    isPlaying=false;
    newWord();
    input.focus();
    updateStats();
}

function shareResult(){
    const wpm=document.querySelector('#resultStats .val').textContent;
    const text=`タイピングゲームで${wpm}WPMを記録しました！ #タイピング`;
    if(navigator.share){
        navigator.share({text});
    }else{
        navigator.clipboard.writeText(text);
        alert('結果をコピーしました!');
    }
}

// カスタムテキスト関連の関数
function saveCustomText(){
    const text=document.getElementById('customTextArea').value.trim();
    const name=document.getElementById('customTextName').value.trim()||`テキスト${customTexts.length+1}`;
    
    if(!text){
        alert('テキストを入力してください');
        return;
    }
    
    customTexts.push({name,text,date:new Date().toISOString()});
    localStorage.setItem('typingCustomTexts',JSON.stringify(customTexts));
    
    document.getElementById('customTextArea').value='';
    document.getElementById('customTextName').value='';
    renderSavedTexts();
    showAchievement('💾 テキストを保存しました');
}

function useCustomText(){
    const text=document.getElementById('customTextArea').value.trim();
    if(!text){
        alert('テキストを入力してください');
        return;
    }
    
    // テキストを単語に分割
    const words=text.split(/\s+/).filter(w=>w.length>0);
    wordSets.custom=words;
    currentCustomText=text;
    customWordIndex=0;
    
    // カスタムモードをアクティブに
    document.querySelector('.modes .active').classList.remove('active');
    document.querySelector('.modes button[data-mode="custom"]').classList.add('active');
    mode='custom';
    
    closeModal('customModal');
    restart();
}

function loadSavedText(index){
    const item=customTexts[index];
    if(item){
        const words=item.text.split(/\s+/).filter(w=>w.length>0);
        wordSets.custom=words;
        currentCustomText=item.text;
        customWordIndex=0;
        
        document.querySelector('.modes .active').classList.remove('active');
        document.querySelector('.modes button[data-mode="custom"]').classList.add('active');
        mode='custom';
        
        closeModal('customModal');
        restart();
    }
}

function editSavedText(index){
    const item=customTexts[index];
    if(item){
        document.getElementById('customTextArea').value=item.text;
        document.getElementById('customTextName').value=item.name;
        document.querySelector('.tab-btn[data-tab="input"]').click();
    }
}

function deleteSavedText(index){
    if(confirm('このテキストを削除しますか？')){
        customTexts.splice(index,1);
        localStorage.setItem('typingCustomTexts',JSON.stringify(customTexts));
        renderSavedTexts();
    }
}

function renderSavedTexts(){
    const container=document.getElementById('savedTextList');
    
    if(customTexts.length===0){
        container.innerHTML=`<div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <p>保存されたテキストはありません</p>
        </div>`;
        return;
    }
    
    container.innerHTML=customTexts.map((item,i)=>`
        <div class="saved-item">
            <div class="saved-item-info">
                <div class="saved-item-name">${item.name}</div>
                <div class="saved-item-preview">${item.text.substring(0,50)}${item.text.length>50?'...':''}</div>
            </div>
            <div class="saved-item-actions">
                <button onclick="loadSavedText(${i})">▶️</button>
                <button onclick="editSavedText(${i})">✏️</button>
                <button class="delete" onclick="deleteSavedText(${i})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderPresets(){
    // Programming
    document.getElementById('presetProgramming').innerHTML=presetTexts.programming.map((p,i)=>
        `<div class="preset-item" onclick="loadPreset('programming',${i})">${p.name}</div>`
    ).join('');
    
    // Business
    document.getElementById('presetBusiness').innerHTML=presetTexts.business.map((p,i)=>
        `<div class="preset-item" onclick="loadPreset('business',${i})">${p.name}</div>`
    ).join('');
    
    // Hiragana
    document.getElementById('presetHiragana').innerHTML=presetTexts.hiragana.map((p,i)=>
        `<div class="preset-item" onclick="loadPreset('hiragana',${i})">${p.name}</div>`
    ).join('');
    
    // Speech
    document.getElementById('presetSpeech').innerHTML=presetTexts.speech.map((p,i)=>
        `<div class="preset-item" onclick="loadPreset('speech',${i})">${p.name}</div>`
    ).join('');
}

function loadPreset(category,index){
    const preset=presetTexts[category][index];
    if(preset){
        document.getElementById('customTextArea').value=preset.text;
        document.getElementById('customTextName').value=preset.name;
        document.querySelector('.tab-btn[data-tab="input"]').click();
    }
}

// 詳細統計関連
function renderDetailedStats(){
    // 総合統計
    const totalSessions=sessionHistory.length;
    const avgWpm=totalSessions>0?Math.round(sessionHistory.reduce((a,s)=>a+s.wpm,0)/totalSessions):0;
    const avgAcc=totalSessions>0?Math.round(sessionHistory.reduce((a,s)=>a+s.acc,0)/totalSessions):0;
    const bestWpm=totalSessions>0?Math.max(...sessionHistory.map(s=>s.wpm)):0;
    const totalWords=sessionHistory.reduce((a,s)=>a+s.wordsTyped,0);
    
    document.getElementById('overallStats').innerHTML=`
        <div class="stats-row"><span class="label">総セッション数</span><span class="value">${totalSessions}</span></div>
        <div class="stats-row"><span class="label">平均WPM</span><span class="value">${avgWpm}</span></div>
        <div class="stats-row"><span class="label">平均正確率</span><span class="value">${avgAcc}%</span></div>
        <div class="stats-row"><span class="label">最高WPM</span><span class="value">${bestWpm}</span></div>
        <div class="stats-row"><span class="label">総タイプ単語数</span><span class="value">${totalWords}</span></div>
    `;
    
    // キー別統計
    const keys='abcdefghijklmnopqrstuvwxyz'.split('');
    document.getElementById('keyStatsGrid').innerHTML=keys.map(key=>{
        const stats=keyStats[key]||{correct:0,total:0};
        const rate=stats.total>0?Math.round(stats.correct/stats.total*100):100;
        let cls='excellent';
        if(rate<95)cls='good';
        if(rate<85)cls='average';
        if(rate<70)cls='poor';
        return`<div class="key-stat ${cls}"><span class="key-char">${key}</span><span class="key-rate">${stats.total>0?rate+'%':'-'}</span></div>`;
    }).join('');
    
    // ミスした文字
    const missArr=Object.entries(allMissedChars).sort((a,b)=>b[1]-a[1]).slice(0,15);
    document.getElementById('missedCharsDetail').innerHTML=missArr.length?
        missArr.map(([c,n])=>`<span class="miss-item">${c} ×${n}</span>`).join(''):
        '<p style="color:#888;">ミスデータはまだありません</p>';
    
    // セッション履歴
    document.getElementById('sessionHistory').innerHTML=sessionHistory.slice(0,10).map(s=>{
        const date=new Date(s.date).toLocaleDateString('ja-JP',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        return`<div class="session-item"><span class="date">${date}</span><span class="wpm">${s.wpm} WPM</span><span class="acc">${s.acc}%</span></div>`;
    }).join('')||'<p style="color:#888;">履歴はまだありません</p>';
}

function clearAllStats(){
    if(confirm('全ての統計データをリセットしますか？')){
        sessionHistory=[];
        keyStats={};
        allMissedChars={};
        localStorage.removeItem('typingSessionHistory');
        localStorage.removeItem('typingKeyStats');
        localStorage.removeItem('typingAllMissedChars');
        localStorage.removeItem('typingBest');
        localStorage.removeItem('typingAchievements');
        achievements={};
        renderDetailedStats();
        showAchievement('🗑️ 統計をリセットしました');
    }
}

// 苦手練習関連
function renderPracticeOptions(){
    // ミスの多い文字
    const weakCharsArr=Object.entries(allMissedChars).sort((a,b)=>b[1]-a[1]).slice(0,10);
    document.getElementById('weakChars').innerHTML=weakCharsArr.length?
        weakCharsArr.map(([c,n])=>`<div class="weak-char" data-char="${c}">${c}<span>×${n}</span></div>`).join(''):
        '<p style="color:#888;">ミスデータはまだありません</p>';
    
    // クリックで選択
    document.querySelectorAll('.weak-char').forEach(el=>{
        el.onclick=()=>el.classList.toggle('selected');
    });
    
    // ミスした単語
    document.getElementById('missedWordsList').innerHTML=missedWords.length?
        missedWords.map(w=>`<div class="missed-word">${w}</div>`).join(''):
        '<p style="color:#888;">ミスした単語はまだありません</p>';
}

function startWeakCharPractice(){
    const selected=Array.from(document.querySelectorAll('.weak-char.selected')).map(el=>el.dataset.char);
    if(selected.length===0){
        alert('練習する文字を選択してください');
        return;
    }
    
    // 選択された文字を使った練習ワードを生成
    const practiceWords=[];
    selected.forEach(char=>{
        for(let i=0;i<5;i++){
            const prefix=['pre','re','un','dis',''].random();
            const suffix=['ing','ed','er','ly',''].random();
            practiceWords.push(prefix+char+char+suffix);
            practiceWords.push(char+'a'+char+'e');
        }
    });
    
    wordSets.custom=practiceWords;
    customWordIndex=0;
    
    document.querySelector('.modes .active').classList.remove('active');
    document.querySelector('.modes button[data-mode="custom"]').classList.add('active');
    mode='custom';
    
    closeModal('practiceModal');
    restart();
    showAchievement('🎯 苦手文字練習開始！');
}

function startMissedWordPractice(){
    if(missedWords.length===0){
        alert('ミスした単語がありません');
        return;
    }
    
    wordSets.custom=[...missedWords];
    customWordIndex=0;
    
    document.querySelector('.modes .active').classList.remove('active');
    document.querySelector('.modes button[data-mode="custom"]').classList.add('active');
    mode='custom';
    
    closeModal('practiceModal');
    restart();
    showAchievement('🔄 ミス単語再練習開始！');
}

function practiceMissedWords(){
    if(missedWords.length===0){
        alert('ミスした単語がありません');
        return;
    }
    startMissedWordPractice();
}

// Array helper
Array.prototype.random=function(){return this[Math.random()*this.length|0];}

input.oninput=function(){
    if(!isPlaying){
        isPlaying=true;
        startTime=Date.now();
        timer=setInterval(()=>{
            timeLeft--;
            document.getElementById('timeLeft').textContent=timeLeft;
            
            // WPM履歴を記録（5秒ごと）
            if(timeLeft%5===0&&wordsTyped>0){
                const elapsed=(Date.now()-startTime)/1000/60;
                const currentWpm=Math.round(wordsTyped/elapsed);
                wpmHistory.push(currentWpm);
            }
            
            if(timeLeft<=0)endGame();
        },1000);
    }
    const val=this.value.toLowerCase();
    totalChars++;
    
    const lastChar=val[val.length-1];
    highlightKey(lastChar||'');
    
    // キー統計を更新
    if(lastChar&&/[a-z]/.test(lastChar)){
        if(!keyStats[lastChar])keyStats[lastChar]={correct:0,total:0};
        keyStats[lastChar].total++;
    }
    
    // 代替パターンを含めてチェック
    const isPartialMatch=partialMatchWithAlternatives(val,romanji);
    const isFullMatch=matchesWithAlternatives(val,romanji);
    
    if(isPartialMatch||isFullMatch){
        correctChars++;
        charIndex=val.length;
        
        // キー統計を正解として記録
        if(lastChar&&/[a-z]/.test(lastChar)){
            keyStats[lastChar].correct++;
        }
        
        playSound(440+combo*20,0.05);
        
        if(isFullMatch){
            wordsTyped++;
            combo++;
            if(combo>maxCombo)maxCombo=combo;
            const basePoints=romanji.length*10;
            const comboBonus=combo*5;
            const diffMultiplier={easy:1,normal:1.5,hard:2}[difficulty];
            score+=Math.round((basePoints+comboBonus)*diffMultiplier);
            showCombo();
            playSound(660,0.1);
            
            if(wordsTyped%10===0)levelUp();
            
            newWord();
            const targetWords=mode==='time'?20:15;
            const progress=Math.min(wordsTyped/targetWords*100,100);
            document.getElementById('progressBar').style.width=progress+'%';
            if(mode!=='time'&&wordsTyped>=targetWords*level)endGame();
        }
        renderWord();
    }else{
        combo=1;
        missedChars[lastChar]=(missedChars[lastChar]||0)+1;
        
        // ミスした単語を記録
        if(currentWord&&!missedWords.includes(currentWord.display)){
            missedWords.push(currentWord.display);
        }
        
        highlightKey(lastChar,true);
        playSound(220,0.1);
        const chars=document.getElementById('wordReading').querySelectorAll('.char');
        if(chars[charIndex])chars[charIndex].classList.add('wrong');
    }
    updateStats();
};

input.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();restart()}};

createKeyboard();
restart();
