let duration=5,taps=0,state='idle',startTime,timer,countdownTimer;
let records=JSON.parse(localStorage.getItem('tapSpeedRecords')||'[]');

document.querySelectorAll('.modes button').forEach(btn=>{
    btn.onclick=function(){
        if(state!=='idle')return;
        document.querySelector('.modes .active').classList.remove('active');
        this.classList.add('active');
        duration=parseInt(this.dataset.time);
        updateBest();
    };
});

function updateBest(){
    const modeRecords=records.filter(r=>r.duration===duration);
    const best=modeRecords.length?Math.max(...modeRecords.map(r=>r.taps)):0;
    document.getElementById('best').textContent=best;
    if(modeRecords.length){
        const avgCps=(modeRecords.reduce((a,r)=>a+r.cps,0)/modeRecords.length).toFixed(1);
        document.getElementById('avgCps').textContent=avgCps;
    }
}

function startCountdown(){
    state='countdown';
    let count=3;
    document.getElementById('tapCount').textContent=count;
    document.getElementById('tapMessage').textContent='準備...';
    document.getElementById('tapArea').classList.add('active');
    
    countdownTimer=setInterval(()=>{
        count--;
        if(count>0){
            document.getElementById('tapCount').textContent=count;
        }else{
            clearInterval(countdownTimer);
            startGame();
        }
    },1000);
}

function startGame(){
    state='playing';
    taps=0;
    startTime=Date.now();
    document.getElementById('tapCount').textContent='0';
    document.getElementById('tapMessage').textContent=`${duration}秒間タップ！`;
    
    timer=setInterval(()=>{
        const elapsed=(Date.now()-startTime)/1000;
        const remaining=Math.max(0,duration-elapsed);
        document.getElementById('tapMessage').textContent=`残り ${remaining.toFixed(1)}秒`;
        document.getElementById('cps').textContent=(taps/elapsed).toFixed(1);
        
        if(remaining<=0){
            endGame();
        }
    },100);
}

function endGame(){
    clearInterval(timer);
    state='result';
    document.getElementById('tapArea').classList.remove('active');
    const cps=parseFloat((taps/duration).toFixed(2));
    
    records.push({taps,cps,duration,date:Date.now()});
    records=records.slice(-50);
    localStorage.setItem('tapSpeedRecords',JSON.stringify(records));
    
    document.getElementById('tapMessage').textContent=`${taps}回！ (${cps} CPS)`;
    updateBest();
    renderHistory();
    renderLeaderboard();
    
    setTimeout(()=>{
        state='idle';
        document.getElementById('tapMessage').textContent='タップして再挑戦';
    },2000);
}

const tapArea=document.getElementById('tapArea');
tapArea.addEventListener('click',()=>{
    if(state==='idle'){
        startCountdown();
    }else if(state==='playing'){
        taps++;
        document.getElementById('tapCount').textContent=taps;
    }else if(state==='result'){
        // wait for timeout
    }
});

tapArea.addEventListener('touchstart',e=>{
    if(state==='playing'){
        e.preventDefault();
        taps++;
        document.getElementById('tapCount').textContent=taps;
    }
},{passive:false});

function renderHistory(){
    const modeRecords=records.filter(r=>r.duration===duration).slice(-8);
    const best=modeRecords.length?Math.max(...modeRecords.map(r=>r.taps)):0;
    document.getElementById('historyGrid').innerHTML=modeRecords.map(r=>`
        <div class="history-item${r.taps===best?' best':''}">
            <div class="history-taps">${r.taps}</div>
            <div class="history-cps">${r.cps} CPS</div>
        </div>
    `).join('')||'<div style="color:#666;grid-column:1/-1;text-align:center">まだ記録がありません</div>';
}

function renderLeaderboard(){
    const modeRecords=records.filter(r=>r.duration===duration);
    modeRecords.sort((a,b)=>b.taps-a.taps);
    document.getElementById('leaderboardList').innerHTML=modeRecords.slice(0,5).map((r,i)=>`
        <div class="rank-item">
            <span style="color:#ff416c;font-weight:bold">#${i+1}</span>
            <span>${r.taps}回</span>
            <span style="color:#888">${r.cps} CPS</span>
        </div>
    `).join('')||'<div style="color:#666;text-align:center">まだ記録がありません</div>';
}

updateBest();
renderHistory();
renderLeaderboard();
