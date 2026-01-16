let mode='classic';
let level=1,streak=0,currentNumber='',state='idle';
let displayTime,timer;
let records=JSON.parse(localStorage.getItem('numMemoryRecords')||'[]');
let bestLevel=Math.max(0,...records.filter(r=>r.mode===mode).map(r=>r.level));

document.querySelectorAll('.modes button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.modes .active').classList.remove('active');
        this.classList.add('active');
        mode=this.dataset.mode;
        level=1;streak=0;
        bestLevel=Math.max(0,...records.filter(r=>r.mode===mode).map(r=>r.level));
        updateStats();
        resetUI();
    };
});

function getDigitsForLevel(lv){return Math.min(2+lv,15);}
function getTimeForLevel(lv){
    const digits=getDigitsForLevel(lv);
    if(mode==='speed')return 500+digits*200;
    return 1000+digits*500;
}

function generateNumber(digits){
    let num='';
    for(let i=0;i<digits;i++){
        num+=Math.floor(Math.random()*10);
    }
    if(num[0]==='0'&&digits>1)num='1'+num.slice(1);
    return num;
}

function startGame(){
    const digits=getDigitsForLevel(level);
    currentNumber=generateNumber(digits);
    state='showing';
    displayTime=getTimeForLevel(level);
    
    document.getElementById('numberDisplay').textContent=currentNumber;
    document.getElementById('message').textContent='この数字を覚えてください';
    document.getElementById('levelDisplay').textContent=level;
    document.getElementById('digitsCount').textContent=digits;
    document.getElementById('progressBar').classList.remove('hidden');
    document.getElementById('inputArea').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('startBtn').classList.add('hidden');
    
    let elapsed=0;
    const interval=50;
    timer=setInterval(()=>{
        elapsed+=interval;
        document.getElementById('progressFill').style.width=((displayTime-elapsed)/displayTime*100)+'%';
        if(elapsed>=displayTime){
            clearInterval(timer);
            showInput();
        }
    },interval);
}

function showInput(){
    state='input';
    document.getElementById('numberDisplay').textContent='?'.repeat(currentNumber.length);
    document.getElementById('message').textContent=mode==='reverse'?'逆順で入力':'数字を入力してください';
    document.getElementById('progressBar').classList.add('hidden');
    document.getElementById('inputArea').classList.remove('hidden');
    document.getElementById('numberInput').value='';
    document.getElementById('numberInput').focus();
}

function inputDigit(d){
    if(state!=='input')return;
    const input=document.getElementById('numberInput');
    if(input.value.length<currentNumber.length){
        input.value+=d;
    }
}

function backspace(){
    const input=document.getElementById('numberInput');
    input.value=input.value.slice(0,-1);
}

function submitAnswer(){
    if(state!=='input')return;
    const answer=document.getElementById('numberInput').value;
    if(answer.length!==currentNumber.length){
        document.getElementById('message').textContent=`${currentNumber.length}桁入力してください`;
        return;
    }
    checkAnswer(answer);
}

function checkAnswer(answer){
    state='result';
    let target=mode==='reverse'?currentNumber.split('').reverse().join(''):currentNumber;
    const correct=answer===target;
    
    document.getElementById('inputArea').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('result').className='result '+(correct?'correct':'wrong');
    document.getElementById('resultIcon').textContent=correct?'✓':'✗';
    
    let diffHtml='<div class="diff">';
    for(let i=0;i<target.length;i++){
        const match=answer[i]===target[i];
        diffHtml+=`<span class="${match?'match':'wrong'}">${answer[i]||'_'}</span>`;
    }
    diffHtml+='</div>';
    
    document.getElementById('comparison').innerHTML=`
        <div class="comparison-row">
            <span class="comparison-label">あなたの回答</span>
            ${diffHtml}
        </div>
        <div class="comparison-row">
            <span class="comparison-label">${mode==='reverse'?'正解（逆順）':'正解'}</span>
            <span class="comparison-value">${target}</span>
        </div>
    `;
    
    if(correct){
        streak++;
        document.getElementById('resultText').textContent='正解！次のレベルへ';
        records.push({level,mode,date:Date.now()});
        localStorage.setItem('numMemoryRecords',JSON.stringify(records.slice(-50)));
        if(level>bestLevel)bestLevel=level;
        level++;
        setTimeout(startGame,1500);
    }else{
        document.getElementById('resultText').textContent=`ゲームオーバー - レベル${level}`;
        streak=0;
        level=1;
        document.getElementById('startBtn').textContent='もう一度';
        document.getElementById('startBtn').classList.remove('hidden');
    }
    updateStats();
    renderHistory();
}

function updateStats(){
    document.getElementById('level').textContent=level;
    document.getElementById('best').textContent=bestLevel;
    document.getElementById('streak').textContent=streak;
}

function resetUI(){
    clearInterval(timer);
    state='idle';
    document.getElementById('numberDisplay').textContent='-';
    document.getElementById('message').textContent='スタートを押して開始';
    document.getElementById('progressBar').classList.add('hidden');
    document.getElementById('inputArea').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('startBtn').textContent='スタート';
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('levelDisplay').textContent='1';
    document.getElementById('digitsCount').textContent='3';
    updateStats();
}

function renderHistory(){
    const modeRecords=records.filter(r=>r.mode===mode).slice(-12);
    const best=Math.max(0,...modeRecords.map(r=>r.level));
    document.getElementById('historyGrid').innerHTML=modeRecords.map(r=>`
        <div class="history-item${r.level===best?' best':''}">
            <div class="history-level">${r.level}</div>
            <div class="history-digits">${getDigitsForLevel(r.level)}桁</div>
        </div>
    `).join('')||'<div style="color:#666;grid-column:1/-1">まだ記録がありません</div>';
}

document.addEventListener('keydown',e=>{
    if(state==='input'){
        if(e.key>='0'&&e.key<='9')inputDigit(e.key);
        else if(e.key==='Backspace')backspace();
        else if(e.key==='Enter')submitAnswer();
    }else if(state==='idle'&&e.key==='Enter'){
        startGame();
    }
});

updateStats();
renderHistory();
