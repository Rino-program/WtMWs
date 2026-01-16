const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
let W,H,columns,drops=[],speed=50,density=15,charset='katakana';
const charsets={
katakana:'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
binary:'01',
hex:'0123456789ABCDEF',
kanji:'日月火水木金土山川田中村森林海空雲雨風雷電光闇夢幻'
};
const fontSize=18;

function resize(){
W=cv.width=innerWidth;H=cv.height=innerHeight;
columns=Math.floor(W/fontSize);
drops=[];
for(let i=0;i<columns;i++)drops[i]=Math.random()*-100;
}
resize();window.onresize=resize;

document.getElementById('speed').oninput=function(){speed=+this.value};
document.getElementById('density').oninput=function(){density=+this.value;resize()};
document.getElementById('charset').onchange=function(){charset=this.value};

function getChar(){
const chars=charsets[charset];
return chars[Math.floor(Math.random()*chars.length)];
}

function draw(){
ctx.fillStyle='rgba(0,0,0,0.05)';
ctx.fillRect(0,0,W,H);
ctx.font=fontSize+'px monospace';
for(let i=0;i<columns;i++){
if(Math.random()*100<density){
const y=drops[i]*fontSize;
// グロー効果
ctx.shadowBlur=15;
ctx.shadowColor='#0f0';
// 先頭は白く
ctx.fillStyle=y>H-fontSize*3?'#fff':'#0f0';
ctx.fillText(getChar(),i*fontSize,y);
ctx.shadowBlur=0;
// 徐々に暗く
for(let j=1;j<5;j++){
ctx.fillStyle=`rgba(0,${255-j*40},0,${1-j*0.2})`;
ctx.fillText(getChar(),i*fontSize,y-j*fontSize);
}
}
drops[i]++;
if(drops[i]*fontSize>H&&Math.random()>0.975)drops[i]=0;
}
setTimeout(()=>requestAnimationFrame(draw),100-speed);
}
draw();
