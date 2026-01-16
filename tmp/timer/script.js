// ストップウォッチ
let swRunning=false,swStart=0,swElapsed=0,swInterval,laps=[];
const swDisplay=document.getElementById('swDisplay');
const lapsEl=document.getElementById('laps');

function formatTime(ms,showMs=true){
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    const msec=ms%1000;
    let str=`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    if(showMs)str+=`<span class="ms">.${msec.toString().padStart(3,'0')}</span>`;
    return str;
}

function formatTimeSimple(ms){
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    if(h>0)return`${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function updateStopwatch(){
    const current=Date.now()-swStart+swElapsed;
    swDisplay.innerHTML=formatTime(current);
}

document.getElementById('swStart').onclick=function(){
    if(swRunning){
        swRunning=false;
        swElapsed+=Date.now()-swStart;
        clearInterval(swInterval);
        this.textContent='▶';
        this.className='btn-start controls button';
        document.getElementById('swLap').disabled=true;
    }else{
        swRunning=true;
        swStart=Date.now();
        swInterval=setInterval(updateStopwatch,10);
        this.textContent='⏸';
        this.className='btn-stop controls button';
        document.getElementById('swLap').disabled=false;
    }
};

document.getElementById('swLap').onclick=function(){
    if(!swRunning)return;
    const current=Date.now()-swStart+swElapsed;
    const diff=laps.length>0?current-laps[laps.length-1].time:current;
    laps.push({time:current,diff});
    renderLaps();
};

document.getElementById('swReset').onclick=function(){
    swRunning=false;
    swElapsed=0;
    clearInterval(swInterval);
    swDisplay.innerHTML=formatTime(0);
    document.getElementById('swStart').textContent='▶';
    document.getElementById('swStart').className='btn-start controls button';
    document.getElementById('swLap').disabled=true;
    laps=[];
    lapsEl.innerHTML='';
};

function renderLaps(){
    lapsEl.innerHTML=laps.map((lap,i)=>`
        <div class="lap">
            <span class="lap-num">ラップ ${i+1}</span>
            <span class="lap-diff">+${formatTimeSimple(lap.diff)}</span>
            <span class="lap-time">${formatTimeSimple(lap.time)}</span>
        </div>
    `).reverse().join('');
}

// タイマー
let timerRunning=false,timerTotal=300000,timerRemaining=300000,timerInterval;
const timerDisplay=document.getElementById('timerDisplay');
const timerProgress=document.getElementById('timerProgress');
const circumference=2*Math.PI*110;
timerProgress.style.strokeDasharray=circumference;

function updateTimer(){
    timerRemaining-=100;
    if(timerRemaining<=0){
        timerRemaining=0;
        stopTimer();
        playAlarm();
    }
    timerDisplay.textContent=formatTimeSimple(timerRemaining);
    const progress=(timerTotal-timerRemaining)/timerTotal;
    timerProgress.style.strokeDashoffset=circumference*(1-progress);
    timerDisplay.parentElement.querySelector('.progress').style.stroke=
        timerRemaining<10000?'#f5576c':'url(#gradient)';
    if(timerRemaining<10000)timerDisplay.classList.add('warning');
}

function stopTimer(){
    timerRunning=false;
    clearInterval(timerInterval);
    document.getElementById('timerStart').textContent='▶';
    document.getElementById('timerStart').className='btn-start controls button';
}

function playAlarm(){
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [0,200,400].forEach(delay=>{
        setTimeout(()=>{
            const osc=ctx.createOscillator();
            const gain=ctx.createGain();
            osc.connect(gain);gain.connect(ctx.destination);
            osc.frequency.value=880;
            gain.gain.setValueAtTime(0.3,ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.3);
            osc.start();osc.stop(ctx.currentTime+0.3);
        },delay);
    });
}

function setTimerFromInputs(){
    const h=+document.getElementById('timerH').value||0;
    const m=+document.getElementById('timerM').value||0;
    const s=+document.getElementById('timerS').value||0;
    timerTotal=timerRemaining=(h*3600+m*60+s)*1000;
    timerDisplay.textContent=formatTimeSimple(timerRemaining);
    timerProgress.style.strokeDashoffset=0;
    timerDisplay.classList.remove('warning');
}

document.getElementById('timerStart').onclick=function(){
    if(timerRunning){
        stopTimer();
    }else{
        if(timerRemaining<=0)setTimerFromInputs();
        if(timerRemaining<=0)return;
        timerRunning=true;
        timerInterval=setInterval(updateTimer,100);
        this.textContent='⏸';
        this.className='btn-stop controls button';
    }
};

document.getElementById('timerReset').onclick=function(){
    stopTimer();
    setTimerFromInputs();
};

document.querySelectorAll('.timer-presets button').forEach(btn=>{
    btn.onclick=function(){
        const secs=+this.dataset.time;
        const h=Math.floor(secs/3600);
        const m=Math.floor((secs%3600)/60);
        const s=secs%60;
        document.getElementById('timerH').value=h;
        document.getElementById('timerM').value=m;
        document.getElementById('timerS').value=s;
        setTimerFromInputs();
    };
});

['timerH','timerM','timerS'].forEach(id=>{
    document.getElementById(id).onchange=setTimerFromInputs;
});

document.querySelectorAll('.tabs button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.tabs .active').classList.remove('active');
        document.querySelector('.panel.active').classList.remove('active');
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');
    };
});

setTimerFromInputs();
