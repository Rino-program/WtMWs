let h=180,s=70,l=55;
const preview=document.getElementById('preview');
const toast=document.getElementById('toast');

const presetColors=[
    '#FF6B6B','#F093FB','#FECA57','#48DBFB','#1DD1A1','#5F27CD',
    '#FF9FF3','#54A0FF','#00D2D3','#FF6B6B','#FFC048','#A29BFE',
    '#2D3436','#636E72','#B2BEC3','#DFE6E9','#74B9FF','#0984E3'
];

function hslToRgb(h,s,l){
    s/=100;l/=100;
    const a=s*Math.min(l,1-l);
    const f=n=>{const k=(n+h/30)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1)};
    return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}

function rgbToHex(r,g,b){
    return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function hexToHsl(hex){
    let r=parseInt(hex.slice(1,3),16)/255;
    let g=parseInt(hex.slice(3,5),16)/255;
    let b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){h=s=0}
    else{
        const d=max-min;
        s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){
            case r:h=((g-b)/d+(g<b?6:0))/6;break;
            case g:h=((b-r)/d+2)/6;break;
            case b:h=((r-g)/d+4)/6;break;
        }
    }
    return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}

function updateColor(){
    const rgb=hslToRgb(h,s,l);
    const hex=rgbToHex(...rgb);
    preview.style.background=`hsl(${h},${s}%,${l}%)`;
    preview.style.color=l>50?'#000':'#fff';
    preview.textContent=hex;
    document.getElementById('hueVal').textContent=h+'°';
    document.getElementById('satVal').textContent=s+'%';
    document.getElementById('lightVal').textContent=l+'%';
    document.getElementById('hexInput').value=hex;
    document.getElementById('rgbInput').value=`rgb(${rgb.join(', ')})`;
    document.getElementById('hslInput').value=`hsl(${h}, ${s}%, ${l}%)`;
    document.getElementById('satSlider').style.setProperty('--current',`hsl(${h},100%,50%)`);
    updateHarmony();
}

function updateHarmony(){
    const type=document.querySelector('.harmony-types .active').dataset.type;
    let colors=[];
    switch(type){
        case'complementary':
            colors=[{h,s,l},{h:(h+180)%360,s,l}];
            break;
        case'analogous':
            colors=[{h:(h-30+360)%360,s,l},{h,s,l},{h:(h+30)%360,s,l}];
            break;
        case'triadic':
            colors=[{h,s,l},{h:(h+120)%360,s,l},{h:(h+240)%360,s,l}];
            break;
        case'split':
            colors=[{h,s,l},{h:(h+150)%360,s,l},{h:(h+210)%360,s,l}];
            break;
        case'tetradic':
            colors=[{h,s,l},{h:(h+90)%360,s,l},{h:(h+180)%360,s,l},{h:(h+270)%360,s,l}];
            break;
    }
    document.getElementById('harmony').innerHTML=colors.map(c=>{
        const rgb=hslToRgb(c.h,c.s,c.l);
        const hex=rgbToHex(...rgb);
        return`<div class="harmony-color" style="background:hsl(${c.h},${c.s}%,${c.l}%);color:${c.l>50?'#000':'#fff'}" onclick="copyHex('${hex}')">${hex}</div>`;
    }).join('');
}

function generateRandom(){
    const colors=[];
    for(let i=0;i<12;i++){
        const rh=Math.random()*360;
        const rs=50+Math.random()*40;
        const rl=40+Math.random()*30;
        colors.push({h:rh,s:rs,l:rl});
    }
    document.getElementById('generated').innerHTML=colors.map(c=>{
        const rgb=hslToRgb(c.h,c.s,c.l);
        const hex=rgbToHex(...rgb);
        return`<div class="generated-color" style="background:${hex}" onclick="copyHex('${hex}')"><span>${hex}</span></div>`;
    }).join('');
}

function copyValue(type){
    const input=document.getElementById(type+'Input');
    navigator.clipboard.writeText(input.value);
    showToast();
}

function copyHex(hex){
    navigator.clipboard.writeText(hex);
    showToast();
}

function showToast(){
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2000);
}

document.getElementById('hueSlider').oninput=e=>{h=+e.target.value;updateColor()};
document.getElementById('satSlider').oninput=e=>{s=+e.target.value;updateColor()};
document.getElementById('lightSlider').oninput=e=>{l=+e.target.value;updateColor()};

document.getElementById('hexInput').onchange=e=>{
    const hex=e.target.value;
    if(/^#[0-9A-Fa-f]{6}$/.test(hex)){
        [h,s,l]=hexToHsl(hex);
        document.getElementById('hueSlider').value=h;
        document.getElementById('satSlider').value=s;
        document.getElementById('lightSlider').value=l;
        updateColor();
    }
};

document.querySelectorAll('.harmony-types button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.harmony-types .active').classList.remove('active');
        this.classList.add('active');
        updateHarmony();
    };
});

// プリセット
document.getElementById('palette').innerHTML=presetColors.map(c=>
    `<div class="palette-color" style="background:${c}" onclick="setFromHex('${c}')"></div>`
).join('');

window.setFromHex=function(hex){
    [h,s,l]=hexToHsl(hex);
    document.getElementById('hueSlider').value=h;
    document.getElementById('satSlider').value=s;
    document.getElementById('lightSlider').value=l;
    updateColor();
};

updateColor();
generateRandom();
