const piano=document.getElementById('piano');
const visualizer=document.getElementById('visualizer');
const vCtx=visualizer.getContext('2d');
let audioCtx,analyser,gainNode;
let waveType='sine',octave=4,volume=0.5;
let recording=false,recordedNotes=[],recordStart=0,playbackTimeout=null;
const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const keyMap={a:'C',w:'C#',s:'D',e:'D#',d:'E',f:'F',t:'F#',g:'G',y:'G#',h:'A',u:'A#',j:'B',k:'C+'};
const frequencies={};
notes.forEach((note,i)=>{
    for(let o=0;o<9;o++){
        frequencies[note+o]=440*Math.pow(2,(o-4)+(i-9)/12);
    }
});

function initAudio(){
    if(audioCtx)return;
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    analyser=audioCtx.createAnalyser();
    analyser.fftSize=256;
    gainNode=audioCtx.createGain();
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    drawVisualizer();
}

function playNote(note,oct=octave){
    initAudio();
    const freq=frequencies[note+oct];
    if(!freq)return;
    const osc=audioCtx.createOscillator();
    const env=audioCtx.createGain();
    osc.type=waveType;
    osc.frequency.value=freq;
    osc.connect(env);
    env.connect(gainNode);
    gainNode.gain.value=volume;
    env.gain.setValueAtTime(volume,audioCtx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+1.5);
    osc.start();
    osc.stop(audioCtx.currentTime+1.5);
    if(recording){
        recordedNotes.push({note,oct,time:Date.now()-recordStart});
    }
}

function createPiano(){
    piano.innerHTML='';
    const keys=[
        {note:'C',black:false},{note:'C#',black:true},
        {note:'D',black:false},{note:'D#',black:true},
        {note:'E',black:false},
        {note:'F',black:false},{note:'F#',black:true},
        {note:'G',black:false},{note:'G#',black:true},
        {note:'A',black:false},{note:'A#',black:true},
        {note:'B',black:false},
        {note:'C',black:false,nextOct:true}
    ];
    keys.forEach((k,i)=>{
        const key=document.createElement('div');
        key.className=`key ${k.black?'black':'white'}`;
        key.dataset.note=k.note;
        key.dataset.nextOct=k.nextOct||false;
        key.innerHTML=k.black?'':'<span>'+(Object.keys(keyMap).find(x=>keyMap[x]===(k.nextOct?'C+':k.note))||'')+'</span>';
        key.onmousedown=key.ontouchstart=(e)=>{
            e.preventDefault();
            const oct=k.nextOct?octave+1:octave;
            playNote(k.note,oct);
            key.classList.add('active');
        };
        key.onmouseup=key.ontouchend=key.onmouseleave=()=>key.classList.remove('active');
        piano.appendChild(key);
    });
}

function drawVisualizer(){
    if(!analyser)return requestAnimationFrame(drawVisualizer);
    const bufferLength=analyser.frequencyBinCount;
    const dataArray=new Uint8Array(bufferLength);
    function draw(){
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        vCtx.fillStyle='rgba(26,26,46,0.3)';
        vCtx.fillRect(0,0,visualizer.width,visualizer.height);
        const barWidth=(visualizer.width/bufferLength)*2.5;
        let x=0;
        for(let i=0;i<bufferLength;i++){
            const barHeight=(dataArray[i]/255)*visualizer.height;
            const hue=i/bufferLength*360;
            vCtx.fillStyle=`hsl(${hue},70%,60%)`;
            vCtx.fillRect(x,visualizer.height-barHeight,barWidth-1,barHeight);
            x+=barWidth;
        }
    }
    draw();
}

function resizeVisualizer(){
    visualizer.width=visualizer.parentElement.clientWidth;
    visualizer.height=60;
}

document.getElementById('waveType').onchange=e=>waveType=e.target.value;
document.getElementById('octave').onchange=e=>{octave=+e.target.value;createPiano()};
document.getElementById('volume').oninput=e=>volume=+e.target.value;

document.getElementById('recordBtn').onclick=function(){
    if(recording){
        recording=false;
        this.textContent='🔴 録音';
        this.classList.remove('active','recording');
        document.getElementById('playBtn').disabled=recordedNotes.length===0;
        document.getElementById('clearBtn').disabled=recordedNotes.length===0;
    }else{
        recording=true;
        recordedNotes=[];
        recordStart=Date.now();
        this.textContent='⏹ 停止';
        this.classList.add('active','recording');
        document.getElementById('playBtn').disabled=true;
        document.getElementById('clearBtn').disabled=true;
    }
};

document.getElementById('playBtn').onclick=function(){
    if(recordedNotes.length===0)return;
    this.disabled=true;
    recordedNotes.forEach(n=>{
        setTimeout(()=>{
            playNote(n.note,n.oct);
            const key=[...document.querySelectorAll('.key')].find(k=>
                k.dataset.note===n.note&&((n.oct>octave)===(k.dataset.nextOct==='true'))
            );
            if(key){
                key.classList.add('active');
                setTimeout(()=>key.classList.remove('active'),200);
            }
        },n.time);
    });
    const totalTime=Math.max(...recordedNotes.map(n=>n.time))+500;
    setTimeout(()=>this.disabled=false,totalTime);
};

document.getElementById('clearBtn').onclick=function(){
    recordedNotes=[];
    document.getElementById('playBtn').disabled=true;
    this.disabled=true;
};

document.addEventListener('keydown',e=>{
    if(e.repeat)return;
    const noteKey=keyMap[e.key.toLowerCase()];
    if(noteKey){
        const isNextOct=noteKey==='C+';
        const note=isNextOct?'C':noteKey;
        const oct=isNextOct?octave+1:octave;
        playNote(note,oct);
        const key=[...document.querySelectorAll('.key')].find(k=>
            k.dataset.note===note&&(k.dataset.nextOct==='true')==isNextOct
        );
        if(key)key.classList.add('active');
    }
});

document.addEventListener('keyup',e=>{
    const noteKey=keyMap[e.key.toLowerCase()];
    if(noteKey){
        const isNextOct=noteKey==='C+';
        const note=isNextOct?'C':noteKey;
        const key=[...document.querySelectorAll('.key')].find(k=>
            k.dataset.note===note&&(k.dataset.nextOct==='true')==isNextOct
        );
        if(key)key.classList.remove('active');
    }
});

window.onresize=resizeVisualizer;
resizeVisualizer();
createPiano();
