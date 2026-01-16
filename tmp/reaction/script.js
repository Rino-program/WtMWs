const gameArea=document.getElementById('gameArea');
const message=document.getElementById('message');
let mode='simple',state='idle',startTime,timeout,results=[],leaderboard=JSON.parse(localStorage.getItem('reactionLeaderboard')||'[]');
let sequenceTarget=[],sequenceInput=[],colorTarget='';

const colors={red:'#e74c3c',blue:'#3498db',green:'#27ae60',yellow:'#f1c40f'};

document.querySelectorAll('.modes button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.modes .active').classList.remove('active');
        this.classList.add('active');
        mode=this.dataset.mode;
        reset();
    };
});

function reset(){
    clearTimeout(timeout);
    state='idle';
    gameArea.className='game-area';
    if(mode==='simple'){
        message.innerHTML='タップしてスタート<small>画面が緑になったらすぐタップ！</small>';
    }else if(mode==='sequence'){
        message.innerHTML='タップしてスタート<small>表示された数字を順番にタップ！</small>';
    }else if(mode==='color'){
        message.innerHTML='タップしてスタート<small>指定された色のボタンを押す！</small>';
    }
}

function startSimple(){
    state='waiting';
    gameArea.className='game-area waiting';
    message.innerHTML='待って...<small>緑になるまで待ってください</small>';
    const delay=Math.random()*3000+2000;
    timeout=setTimeout(()=>{
        state='ready';
        gameArea.className='game-area ready';
        message.textContent='今すぐタップ！';
        startTime=performance.now();
    },delay);
}

function startSequence(){
    state='showing';
    const len=Math.min(3+Math.floor(results.length/3),7);
    sequenceTarget=Array(len).fill().map(()=>Math.floor(Math.random()*9)+1);
    sequenceInput=[];
    showSequence();
}

function showSequence(){
    gameArea.innerHTML='<div class="sequence-display" id="seqDisplay"></div>';
    const display=document.getElementById('seqDisplay');
    sequenceTarget.forEach((n,i)=>{
        const item=document.createElement('div');
        item.className='seq-item';
        item.style.background='rgba(255,255,255,0.1)';
        item.textContent=n;
        display.appendChild(item);
    });
    let idx=0;
    const showNext=()=>{
        if(idx>0)display.children[idx-1].classList.remove('active');
        if(idx<sequenceTarget.length){
            display.children[idx].classList.add('active');
            display.children[idx].style.background='#f093fb';
            idx++;
            setTimeout(showNext,800);
        }else{
            setTimeout(()=>{
                state='input';
                startTime=performance.now();
                display.innerHTML='';
                for(let i=1;i<=9;i++){
                    const btn=document.createElement('div');
                    btn.className='seq-item';
                    btn.style.background='rgba(255,255,255,0.1)';
                    btn.style.cursor='pointer';
                    btn.textContent=i;
                    btn.onclick=()=>inputSequence(i);
                    display.appendChild(btn);
                }
            },500);
        }
    };
    showNext();
}

function inputSequence(n){
    if(state!=='input')return;
    sequenceInput.push(n);
    const idx=sequenceInput.length-1;
    if(sequenceInput[idx]!==sequenceTarget[idx]){
        state='result';
        showSequenceResult(false);
        return;
    }
    if(sequenceInput.length===sequenceTarget.length){
        state='result';
        const time=performance.now()-startTime;
        showSequenceResult(true,time);
    }
}

function showSequenceResult(success,time){
    gameArea.className='game-area result';
    if(success){
        const avgTime=Math.round(time/sequenceTarget.length);
        gameArea.innerHTML=`<div class="message"><div class="result-time">${avgTime}<small>ms/数字</small></div><small>正解！${sequenceTarget.length}個の数字を記憶</small></div>`;
        addResult(avgTime);
    }else{
        gameArea.innerHTML='<div class="message">❌ 不正解<small>タップして再挑戦</small></div>';
    }
}

function startColor(){
    state='waiting';
    gameArea.innerHTML='<div class="message">待って...</div>';
    const delay=Math.random()*2000+1000;
    timeout=setTimeout(()=>{
        state='ready';
        const colorNames=Object.keys(colors);
        colorTarget=colorNames[Math.floor(Math.random()*colorNames.length)];
        const colorJa={red:'赤',blue:'青',green:'緑',yellow:'黄'};
        gameArea.innerHTML=`
            <div style="text-align:center">
                <div class="color-target" style="background:${colors[colorTarget]}">${colorJa[colorTarget]}</div>
                <div class="color-buttons">
                    ${colorNames.map(c=>`<button class="color-btn" style="background:${colors[c]}" data-color="${c}"></button>`).join('')}
                </div>
            </div>
        `;
        startTime=performance.now();
        gameArea.querySelectorAll('.color-btn').forEach(btn=>{
            btn.onclick=()=>checkColor(btn.dataset.color);
        });
    },delay);
}

function checkColor(c){
    if(state!=='ready')return;
    state='result';
    const time=performance.now()-startTime;
    gameArea.className='game-area result';
    if(c===colorTarget){
        gameArea.innerHTML=`<div class="message"><div class="result-time">${Math.round(time)}<small>ms</small></div><small>正解！</small></div>`;
        addResult(Math.round(time));
    }else{
        gameArea.innerHTML='<div class="message">❌ 間違った色！<small>タップして再挑戦</small></div>';
    }
}

function addResult(time){
    results.push(time);
    if(results.length>10)results.shift();
    const best=Math.min(...results);
    const avg=Math.round(results.reduce((a,b)=>a+b,0)/results.length);
    document.getElementById('best').textContent=best+'ms';
    document.getElementById('avg').textContent=avg+'ms';
    document.getElementById('tries').textContent=results.length;
    updateHistory();
    updateLeaderboard(time);
}

function updateHistory(){
    const best=Math.min(...results);
    document.getElementById('historyList').innerHTML=results.map(t=>
        `<div class="history-item${t===best?' best':''}">${t}ms</div>`
    ).join('');
}

function updateLeaderboard(time){
    leaderboard.push({time,date:Date.now(),mode});
    leaderboard.sort((a,b)=>a.time-b.time);
    leaderboard=leaderboard.slice(0,10);
    localStorage.setItem('reactionLeaderboard',JSON.stringify(leaderboard));
    renderLeaderboard(time);
}

function renderLeaderboard(highlight){
    document.getElementById('leaderboardList').innerHTML=leaderboard.slice(0,5).map((r,i)=>`
        <div class="rank-item${r.time===highlight?' highlight':''}">
            <span class="rank-num">#${i+1}</span>
            <span class="rank-time">${r.time}ms</span>
            <span class="rank-date">${new Date(r.date).toLocaleDateString()}</span>
        </div>
    `).join('');
}

gameArea.onclick=function(){
    if(state==='idle'){
        if(mode==='simple')startSimple();
        else if(mode==='sequence')startSequence();
        else if(mode==='color')startColor();
    }else if(state==='waiting'){
        clearTimeout(timeout);
        state='result';
        gameArea.className='game-area too-early';
        message.innerHTML='早すぎ！<small>緑になるまで待ってください</small>';
        setTimeout(reset,1500);
    }else if(state==='ready'&&mode==='simple'){
        state='result';
        const time=Math.round(performance.now()-startTime);
        gameArea.className='game-area result';
        message.innerHTML=`<div class="result-time">${time}<small>ms</small></div><small>タップして再挑戦</small>`;
        addResult(time);
    }else if(state==='result'){
        reset();
    }
};

renderLeaderboard();
