const themes={
    emoji:['🍎','🍊','🍋','🍇','🍓','🍒','🥝','🍑','🌸','🌻','🌈','⭐','🌙','❄️','🔥','💎','🎀','🎈'],
    animals:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦'],
    food:['🍕','🍔','🍟','🌭','🍿','🧀','🥚','🍳','🥓','🥞','🧇','🍞','🥐','🥨','🥯','🍩','🍪','🎂'],
    symbols:['♠️','♥️','♦️','♣️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⬜','🔶','🔷','🔺','🔻','💠','🔘'],
    flags:['🇯🇵','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇨🇳','🇰🇷','🇧🇷','🇦🇺','🇨🇦','🇷🇺','🇮🇳','🇲🇽','🇳🇱','🇸🇪','🇨🇭']
};

let size=4,theme='emoji',mode='classic';
let cards=[],flipped=[],matched=0,moves=0,combo=1,maxCombo=1;
let timer=null,seconds=0,timeLimit=0,hints=3;
let canFlip=true,gameStarted=false;
let leaderboard=JSON.parse(localStorage.getItem('memoryLeaderboard')||'[]');
let soundEnabled=true;

const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
function playSound(freq,dur=0.1,type='sine'){
    if(!soundEnabled)return;
    try{
        const osc=audioCtx.createOscillator();
        const gain=audioCtx.createGain();
        osc.type=type;
        osc.frequency.value=freq;
        osc.connect(gain);gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.15,audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+dur);
        osc.start();osc.stop(audioCtx.currentTime+dur);
    }catch{}
}

function playFlipSound(){playSound(400+Math.random()*100,0.08,'triangle')}
function playMatchSound(){
    playSound(523,0.1);
    setTimeout(()=>playSound(659,0.1),80);
    setTimeout(()=>playSound(784,0.15),160);
}
function playMismatchSound(){playSound(200,0.15,'sawtooth')}
function playComboSound(c){
    for(let i=0;i<Math.min(c,5);i++){
        setTimeout(()=>playSound(523+i*100,0.08),i*50);
    }
}
function playVictorySound(){
    const melody=[523,587,659,784,880,784,880,1047];
    melody.forEach((f,i)=>setTimeout(()=>playSound(f,0.15),i*100));
}

document.getElementById('sizeSelect').onchange=e=>{size=+e.target.value;restart()};
document.getElementById('themeSelect').onchange=e=>{theme=e.target.value;restart()};
document.getElementById('modeSelect').onchange=e=>{
    mode=e.target.value;
    document.getElementById('timeLabel').textContent=mode==='timeattack'?'残り時間':'時間';
    restart();
};

function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
        const j=Math.random()*(i+1)|0;
        [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
}

function createBoard(){
    const board=document.getElementById('board');
    board.innerHTML='';
    board.style.gridTemplateColumns=`repeat(${size},1fr)`;
    
    const totalCards=size*size;
    const pairs=Math.floor(totalCards/2);
    const selected=shuffle([...themes[theme]]).slice(0,pairs);
    
    // For odd number of cards, add one extra card
    cards=shuffle([...selected,...selected,...(totalCards%2?[selected[0]]:[]));
    
    cards.forEach((emoji,i)=>{
        const card=document.createElement('div');
        card.className='card';
        card.dataset.idx=i;
        card.innerHTML=`
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${emoji}</div>
        `;
        card.onclick=()=>flipCard(i);
        board.appendChild(card);
    });
}

function flipCard(idx){
    if(!canFlip||flipped.includes(idx))return;
    const cardEls=[...document.querySelectorAll('.card')];
    if(cardEls[idx].classList.contains('matched'))return;
    
    if(!gameStarted){
        gameStarted=true;
        if(mode==='timeattack'){
            timeLimit={3:30,4:60,5:120,6:180}[size];
            seconds=timeLimit;
            timer=setInterval(()=>{
                seconds--;
                updateTime();
                if(seconds<=0)timeUp();
            },1000);
        }else if(mode!=='zen'){
            timer=setInterval(()=>{
                seconds++;
                updateTime();
            },1000);
        }
    }
    
    cardEls[idx].classList.add('flipped');
    flipped.push(idx);
    playFlipSound();
    
    if(flipped.length===2){
        moves++;
        document.getElementById('moves').textContent=moves;
        canFlip=false;
        
        const[a,b]=flipped;
        if(cards[a]===cards[b]){
            setTimeout(()=>{
                cardEls[a].classList.add('matched');
                cardEls[b].classList.add('matched');
                matched++;
                combo++;
                if(combo>maxCombo)maxCombo=combo;
                
                document.getElementById('pairs').textContent=matched;
                document.getElementById('combo').textContent='x'+combo;
                
                if(combo>=3){showComboEffect(combo);playComboSound(combo);}
                playMatchSound();
                
                flipped=[];
                canFlip=true;
                
                const totalPairs=Math.floor(size*size/2);
                if(matched>=totalPairs)endGame();
            },300);
        }else{
            combo=1;
            document.getElementById('combo').textContent='x1';
            playMismatchSound();
            setTimeout(()=>{
                cardEls[a].classList.remove('flipped');
                cardEls[b].classList.remove('flipped');
                flipped=[];
                canFlip=true;
            },800);
        }
    }
}

function showComboEffect(c){
    const el=document.getElementById('comboDisplay');
    el.textContent=`🔥 ${c}x COMBO!`;
    el.style.animation='none';
    void el.offsetWidth;
    el.style.animation='pulse 0.5s ease';
    setTimeout(()=>el.textContent='',1500);
}

function useHint(){
    if(hints<=0||!canFlip)return;
    hints--;
    document.getElementById('hintCount').textContent=hints;
    if(hints<=0)document.getElementById('hintBtn').disabled=true;
    
    const cardEls=[...document.querySelectorAll('.card')];
    const unmatched=cardEls.filter(c=>!c.classList.contains('matched')&&!c.classList.contains('flipped'));
    if(unmatched.length<2)return;
    
    // Find a matching pair
    for(let i=0;i<unmatched.length;i++){
        for(let j=i+1;j<unmatched.length;j++){
            const idx1=+unmatched[i].dataset.idx;
            const idx2=+unmatched[j].dataset.idx;
            if(cards[idx1]===cards[idx2]){
                unmatched[i].classList.add('flipped');
                unmatched[j].classList.add('flipped');
                setTimeout(()=>{
                    unmatched[i].classList.remove('flipped');
                    unmatched[j].classList.remove('flipped');
                },1000);
                return;
            }
        }
    }
}

function updateTime(){
    const m=Math.floor(Math.abs(seconds)/60);
    const s=Math.abs(seconds)%60;
    document.getElementById('time').textContent=`${m}:${s.toString().padStart(2,'0')}`;
    if(mode==='timeattack'&&seconds<=10){
        document.getElementById('time').style.color='#f5576c';
    }
}

function timeUp(){
    clearInterval(timer);
    document.getElementById('result').querySelector('h2').textContent='⏰ 時間切れ!';
    showResult(false);
}

function endGame(){
    clearInterval(timer);
    createStars();
    playVictorySound();
    
    const score=calculateScore();
    saveToLeaderboard(score);
    showResult(true,score);
}

function calculateScore(){
    const baseScore=1000;
    const movesPenalty=moves*10;
    const timePenalty=mode==='zen'?0:seconds*(mode==='timeattack'?-10:5);
    const comboBonus=maxCombo*50;
    const sizeBonus=size*size*20;
    return Math.max(0,baseScore-movesPenalty-timePenalty+comboBonus+sizeBonus);
}

function saveToLeaderboard(score){
    const entry={
        score,
        moves,
        time:seconds,
        size:`${size}x${size}`,
        date:Date.now()
    };
    leaderboard.push(entry);
    leaderboard.sort((a,b)=>b.score-a.score);
    leaderboard=leaderboard.slice(0,20);
    localStorage.setItem('memoryLeaderboard',JSON.stringify(leaderboard));
}

function showResult(won,score=0){
    const m=Math.floor(seconds/60);
    const s=seconds%60;
    const efficiency=Math.round((matched/(moves||1))*100);
    
    document.getElementById('resultStats').innerHTML=`
        <div class="result-stat"><div class="val">${moves}</div><div class="label">手数</div></div>
        <div class="result-stat"><div class="val">${m}:${s.toString().padStart(2,'0')}</div><div class="label">時間</div></div>
        <div class="result-stat"><div class="val">x${maxCombo}</div><div class="label">最大コンボ</div></div>
        <div class="result-stat${score>0?' best':''}"><div class="val">${score}</div><div class="label">スコア</div></div>
    `;
    
    document.getElementById('leaderboard').innerHTML=leaderboard.slice(0,5).map((e,i)=>`
        <div class="leaderboard-item${e.score===score?' highlight':''}">
            <span class="rank">#${i+1}</span>
            <span class="size">${e.size}</span>
            <span class="score">${e.score}pt</span>
        </div>
    `).join('');
    
    document.getElementById('result').classList.add('show');
}

function createStars(){
    const container=document.getElementById('stars');
    for(let i=0;i<10;i++){
        const star=document.createElement('div');
        star.className='star';
        star.textContent='⭐';
        star.style.left=Math.random()*100+'%';
        star.style.top=Math.random()*50+'%';
        star.style.animationDelay=Math.random()*0.5+'s';
        container.appendChild(star);
        setTimeout(()=>star.remove(),1500);
    }
}

function restart(){
    document.getElementById('result').classList.remove('show');
    clearInterval(timer);
    timer=null;
    seconds=0;
    moves=0;
    matched=0;
    combo=1;
    maxCombo=1;
    hints=3;
    flipped=[];
    canFlip=true;
    gameStarted=false;
    
    document.getElementById('moves').textContent='0';
    document.getElementById('pairs').textContent='0';
    document.getElementById('time').textContent='0:00';
    document.getElementById('time').style.color='#4facfe';
    document.getElementById('combo').textContent='x1';
    document.getElementById('hintCount').textContent='3';
    document.getElementById('hintBtn').disabled=false;
    document.getElementById('comboDisplay').textContent='';
    
    createBoard();
}

function changeDifficulty(){
    document.getElementById('result').classList.remove('show');
}

restart();
