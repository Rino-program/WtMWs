const weatherData={
    tokyo:{name:'東京',temp:25,humidity:65,wind:5,uv:4,desc:'晴れ',icon:'☀️',type:'sunny'},
    osaka:{name:'大阪',temp:27,humidity:70,wind:4,uv:5,desc:'晴れ時々曇り',icon:'⛅',type:'cloudy'},
    nagoya:{name:'名古屋',temp:26,humidity:68,wind:6,uv:4,desc:'曇り',icon:'☁️',type:'cloudy'},
    sapporo:{name:'札幌',temp:18,humidity:75,wind:8,uv:2,desc:'雨',icon:'🌧️',type:'rainy'},
    fukuoka:{name:'福岡',temp:28,humidity:72,wind:5,uv:6,desc:'晴れ',icon:'☀️',type:'sunny'},
    sendai:{name:'仙台',temp:20,humidity:80,wind:7,uv:3,desc:'雨',icon:'🌧️',type:'rainy'},
    kyoto:{name:'京都',temp:26,humidity:60,wind:3,uv:5,desc:'晴れ',icon:'☀️',type:'sunny'},
    naha:{name:'那覇',temp:30,humidity:85,wind:6,uv:8,desc:'晴れ',icon:'🌞',type:'sunny'}
};

const weatherIcons=['☀️','⛅','☁️','🌧️','⛈️','🌨️','❄️','🌤️'];
const days=['日','月','火','水','木','金','土'];

function updateWeather(city){
    const data=weatherData[city];
    const card=document.getElementById('weatherCard');
    
    // 背景グラデーション変更
    const gradients={
        sunny:'linear-gradient(135deg, #f093fb, #f5576c)',
        cloudy:'linear-gradient(135deg, #667eea, #764ba2)',
        rainy:'linear-gradient(135deg, #4facfe, #00f2fe)',
        snowy:'linear-gradient(135deg, #e0e0e0, #b0b0b0)'
    };
    card.style.background=gradients[data.type];
    
    document.getElementById('weatherIcon').textContent=data.icon;
    document.getElementById('temp').textContent=data.temp;
    document.getElementById('description').textContent=data.desc;
    document.getElementById('humidity').textContent=data.humidity+'%';
    document.getElementById('wind').textContent=data.wind+'m/s';
    document.getElementById('uv').textContent=data.uv;
    
    updateAnimations(data.type);
    generateHourlyForecast(data.temp);
    generateWeeklyForecast(data.temp);
}

function generateHourlyForecast(baseTemp){
    const now=new Date();
    let html='';
    for(let i=0;i<12;i++){
        const hour=new Date(now.getTime()+i*3600000);
        const temp=baseTemp+Math.floor(Math.random()*6-3);
        const icon=weatherIcons[Math.floor(Math.random()*4)];
        html+=`
            <div class="hourly-item">
                <div class="time">${hour.getHours()}:00</div>
                <div class="icon">${icon}</div>
                <div class="temp">${temp}°</div>
            </div>
        `;
    }
    document.getElementById('hourlyList').innerHTML=html;
}

function generateWeeklyForecast(baseTemp){
    const now=new Date();
    let html='';
    for(let i=0;i<7;i++){
        const date=new Date(now.getTime()+i*86400000);
        const dayName=i===0?'今日':i===1?'明日':days[date.getDay()];
        const high=baseTemp+Math.floor(Math.random()*5);
        const low=baseTemp-Math.floor(Math.random()*5)-3;
        const icon=weatherIcons[Math.floor(Math.random()*4)];
        html+=`
            <div class="forecast-item">
                <div class="day">${dayName}</div>
                <div class="icon">${icon}</div>
                <div class="temp">${high}°</div>
                <div class="temp-range">${low}°</div>
            </div>
        `;
    }
    document.getElementById('forecastList').innerHTML=html;
}

function updateAnimations(type){
    const container=document.getElementById('animations');
    container.innerHTML='';
    
    if(type==='rainy'){
        for(let i=0;i<50;i++){
            const drop=document.createElement('div');
            drop.className='raindrop';
            drop.style.left=Math.random()*100+'%';
            drop.style.animationDelay=Math.random()*2+'s';
            drop.style.animationDuration=(0.5+Math.random()*0.5)+'s';
            container.appendChild(drop);
        }
    }else if(type==='snowy'){
        for(let i=0;i<30;i++){
            const flake=document.createElement('div');
            flake.className='snowflake';
            flake.textContent='❄';
            flake.style.left=Math.random()*100+'%';
            flake.style.fontSize=(0.5+Math.random()*1)+'rem';
            flake.style.animationDelay=Math.random()*5+'s';
            flake.style.animationDuration=(3+Math.random()*4)+'s';
            container.appendChild(flake);
        }
    }
}

document.getElementById('citySelect').onchange=function(){
    updateWeather(this.value);
};

updateWeather('tokyo');
