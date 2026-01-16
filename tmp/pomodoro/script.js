const circumference=2*Math.PI*125;
const progress=document.getElementById('progress');
const timeDisplay=document.getElementById('time');
const labelDisplay=document.getElementById('label');
progress.style.strokeDasharray=circumference;

const modes={
    work:{duration:25*60,label:'作業時間',class:'work'},
    short:{duration:5*60,label:'小休憩',class:'short'},
    long:{duration:15*60,label:'長休憩',class:'long'}
};

let currentMode='work',remaining=modes.work.duration,total=modes.work.duration;
let running=false,interval;
let pomodoroCount=0,totalMinutes=0;
let soundEnabled=true,autoStart=false;
let tasks=JSON.parse(localStorage.getItem('pomodoroTasks')||'[]');

function updateDisplay(){
    const m=Math.floor(remaining/60);
    const s=remaining%60;
    timeDisplay.textContent=`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    const offset=circumference*(1-remaining/total);
    progress.style.strokeDashoffset=offset;
    document.title=`${timeDisplay.textContent} - ポモドーロ`;
}

function setMode(mode){
    currentMode=mode;
    total=modes[mode].duration;
    remaining=total;
    labelDisplay.textContent=modes[mode].label;
    progress.className='progress '+modes[mode].class;
    document.querySelectorAll('.mode-tabs button').forEach(b=>{
        b.classList.toggle('active',b.dataset.mode===mode);
    });
    updateDisplay();
}

function tick(){
    remaining--;
    if(remaining<=0){
        stop();
        playSound();
        if(currentMode==='work'){
            pomodoroCount++;
            totalMinutes+=modes.work.duration/60;
            updateStats();
            localStorage.setItem('pomodoroStats',JSON.stringify({count:pomodoroCount,minutes:totalMinutes}));
        }
        const next=currentMode==='work'?(pomodoroCount%4===0?'long':'short'):'work';
        setMode(next);
        if(autoStart)start();
    }
    updateDisplay();
}

function start(){
    if(running)return;
    running=true;
    interval=setInterval(tick,1000);
    document.getElementById('startBtn').textContent='⏸';
}

function stop(){
    running=false;
    clearInterval(interval);
    document.getElementById('startBtn').textContent='▶';
}

function toggle(){
    running?stop():start();
}

function reset(){
    stop();
    remaining=total;
    updateDisplay();
}

function skip(){
    stop();
    const next=currentMode==='work'?(pomodoroCount%4===0?'long':'short'):'work';
    setMode(next);
}

function playSound(){
    if(!soundEnabled)return;
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [0,150,300].forEach(delay=>{
        setTimeout(()=>{
            const osc=ctx.createOscillator();
            const gain=ctx.createGain();
            osc.connect(gain);gain.connect(ctx.destination);
            osc.frequency.value=currentMode==='work'?523:784;
            gain.gain.setValueAtTime(0.3,ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.2);
            osc.start();osc.stop(ctx.currentTime+0.2);
        },delay);
    });
}

function updateStats(){
    document.getElementById('pomodoroCount').textContent=pomodoroCount;
    document.getElementById('totalTime').textContent=totalMinutes+'分';
}

function saveTasks(){
    localStorage.setItem('pomodoroTasks',JSON.stringify(tasks));
}

function renderTasks(){
    document.getElementById('taskList').innerHTML=tasks.map((t,i)=>`
        <div class="task-item${t.done?' done':''}">
            <input type="checkbox" ${t.done?'checked':''} onchange="toggleTask(${i})">
            <span>${t.text}</span>
            <button onclick="deleteTask(${i})">×</button>
        </div>
    `).join('');
}

window.toggleTask=function(i){
    tasks[i].done=!tasks[i].done;
    saveTasks();renderTasks();
};

window.deleteTask=function(i){
    tasks.splice(i,1);
    saveTasks();renderTasks();
};

function addTask(){
    const input=document.getElementById('taskInput');
    if(!input.value.trim())return;
    tasks.push({text:input.value.trim(),done:false});
    input.value='';
    saveTasks();renderTasks();
}

document.getElementById('startBtn').onclick=toggle;
document.getElementById('resetBtn').onclick=reset;
document.getElementById('skipBtn').onclick=skip;

document.querySelectorAll('.mode-tabs button').forEach(btn=>{
    btn.onclick=()=>setMode(btn.dataset.mode);
});

document.getElementById('workDuration').onchange=e=>{
    modes.work.duration=+e.target.value*60;
    if(currentMode==='work')setMode('work');
};
document.getElementById('shortBreak').onchange=e=>{
    modes.short.duration=+e.target.value*60;
    if(currentMode==='short')setMode('short');
};
document.getElementById('longBreak').onchange=e=>{
    modes.long.duration=+e.target.value*60;
    if(currentMode==='long')setMode('long');
};

document.getElementById('soundToggle').onclick=function(){
    soundEnabled=!soundEnabled;
    this.classList.toggle('active',soundEnabled);
};

document.getElementById('autoStartToggle').onclick=function(){
    autoStart=!autoStart;
    this.classList.toggle('active',autoStart);
};

document.getElementById('addTaskBtn').onclick=addTask;
document.getElementById('taskInput').onkeydown=e=>{if(e.key==='Enter')addTask()};

// 復元
const savedStats=JSON.parse(localStorage.getItem('pomodoroStats')||'{}');
if(savedStats.count){pomodoroCount=savedStats.count;totalMinutes=savedStats.minutes||0;updateStats()}

setMode('work');
renderTasks();
