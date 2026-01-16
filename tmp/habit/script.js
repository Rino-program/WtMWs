const icons=['💪','📚','🏃','💧','🧘','✍️','🎯','💤','🥗','🎨','🎵','💻','🌱','☀️','🧹'];
let habits=JSON.parse(localStorage.getItem('habits')||'[]');
let history=JSON.parse(localStorage.getItem('habitHistory')||'{}');
let currentMonth=new Date();
let editingId=null;

const today=new Date();
const todayStr=getDateStr(today);
document.getElementById('todayInfo').textContent=today.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'long'});

function getDateStr(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

function initIconPicker(){
    document.getElementById('iconPicker').innerHTML=icons.map((ic,i)=>
        `<div class="icon-option${i===0?' selected':''}" data-icon="${ic}" onclick="selectIcon(this)">${ic}</div>`
    ).join('');
}

function selectIcon(el){
    document.querySelectorAll('.icon-option').forEach(e=>e.classList.remove('selected'));
    el.classList.add('selected');
}

function openModal(id=null){
    editingId=id;
    if(id){
        const h=habits.find(x=>x.id===id);
        document.getElementById('modalTitle').textContent='習慣を編集';
        document.getElementById('habitName').value=h.name;
        document.getElementById('habitFreq').value=h.freq;
        document.querySelectorAll('.icon-option').forEach(e=>{
            e.classList.toggle('selected',e.dataset.icon===h.icon);
        });
    }else{
        document.getElementById('modalTitle').textContent='新しい習慣を追加';
        document.getElementById('habitName').value='';
        document.getElementById('habitFreq').value='daily';
        initIconPicker();
    }
    document.getElementById('modal').classList.add('active');
}

function closeModal(){
    document.getElementById('modal').classList.remove('active');
    editingId=null;
}

function saveHabit(){
    const name=document.getElementById('habitName').value.trim();
    if(!name)return alert('習慣名を入力してください');
    const icon=document.querySelector('.icon-option.selected').dataset.icon;
    const freq=document.getElementById('habitFreq').value;
    if(editingId){
        const h=habits.find(x=>x.id===editingId);
        h.name=name;h.icon=icon;h.freq=freq;
    }else{
        habits.push({id:Date.now(),name,icon,freq,created:todayStr});
    }
    saveData();
    closeModal();
    render();
}

function deleteHabit(id){
    if(!confirm('この習慣を削除しますか？'))return;
    habits=habits.filter(h=>h.id!==id);
    saveData();
    render();
}

function toggleHabit(id){
    if(!history[todayStr])history[todayStr]={};
    history[todayStr][id]=!history[todayStr][id];
    saveData();
    render();
}

function saveData(){
    localStorage.setItem('habits',JSON.stringify(habits));
    localStorage.setItem('habitHistory',JSON.stringify(history));
}

function isHabitActiveOnDate(h,date){
    const dow=date.getDay();
    if(h.freq==='daily')return true;
    if(h.freq==='weekdays')return dow>=1&&dow<=5;
    if(h.freq==='weekends')return dow===0||dow===6;
    return true;
}

function getStreak(id){
    let streak=0;
    const d=new Date(today);
    while(true){
        const str=getDateStr(d);
        const h=habits.find(x=>x.id===id);
        if(!h||str<h.created)break;
        if(!isHabitActiveOnDate(h,d)){d.setDate(d.getDate()-1);continue;}
        if(history[str]&&history[str][id]){streak++;d.setDate(d.getDate()-1);}
        else break;
    }
    return streak;
}

function render(){
    const activeHabits=habits.filter(h=>isHabitActiveOnDate(h,today));
    const doneTodayIds=history[todayStr]?Object.keys(history[todayStr]).filter(k=>history[todayStr][k]).map(Number):[];
    const doneCount=activeHabits.filter(h=>doneTodayIds.includes(h.id)).length;
    
    document.getElementById('totalHabits').textContent=habits.length;
    document.getElementById('todayDone').textContent=activeHabits.length?Math.round(doneCount/activeHabits.length*100)+'%':'-%';
    
    let maxStreak=0;
    habits.forEach(h=>{const s=getStreak(h.id);if(s>maxStreak)maxStreak=s;});
    document.getElementById('maxStreak').textContent=maxStreak;
    
    const firstHistory=Object.keys(history).sort()[0];
    if(firstHistory){
        const diff=Math.ceil((today-new Date(firstHistory))/(1000*60*60*24))+1;
        document.getElementById('totalDays').textContent=diff;
    }
    
    if(!habits.length){
        document.getElementById('habitList').innerHTML='<div class="empty-state">習慣を追加して始めましょう！</div>';
    }else{
        document.getElementById('habitList').innerHTML=activeHabits.map(h=>{
            const done=doneTodayIds.includes(h.id);
            const streak=getStreak(h.id);
            return `
                <div class="habit-item${done?' completed':''}">
                    <div class="habit-check${done?' checked':''}" onclick="toggleHabit(${h.id})">${done?'✓':''}</div>
                    <div class="habit-info">
                        <div class="habit-name">${h.icon} ${h.name}</div>
                        <div class="habit-streak">🔥 <span>${streak}日</span>連続</div>
                    </div>
                    <div class="habit-actions">
                        <button class="habit-action" onclick="openModal(${h.id})">✏️</button>
                        <button class="habit-action" onclick="deleteHabit(${h.id})">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderWeekView();
    renderCalendar();
}

function renderWeekView(){
    const weekDays=['日','月','火','水','木','金','土'];
    const startOfWeek=new Date(today);
    startOfWeek.setDate(today.getDate()-today.getDay());
    
    let html='';
    for(let i=0;i<7;i++){
        const d=new Date(startOfWeek);
        d.setDate(startOfWeek.getDate()+i);
        const str=getDateStr(d);
        const isToday=str===todayStr;
        const dayHistory=history[str]||{};
        
        html+=`<div class="week-day${isToday?' today':''}">
            <div class="week-day-name">${weekDays[i]}</div>
            <div class="week-day-num">${d.getDate()}</div>
            <div class="week-dots">
                ${habits.slice(0,4).map(h=>
                    `<div class="week-dot${dayHistory[h.id]?' done':''}"></div>`
                ).join('')}
            </div>
        </div>`;
    }
    document.getElementById('weekView').innerHTML=html;
}

function changeMonth(delta){
    currentMonth.setMonth(currentMonth.getMonth()+delta);
    renderCalendar();
}

function renderCalendar(){
    const year=currentMonth.getFullYear();
    const month=currentMonth.getMonth();
    document.getElementById('calendarTitle').textContent=`${year}年${month+1}月`;
    
    const firstDay=new Date(year,month,1);
    const lastDay=new Date(year,month+1,0);
    const startDay=new Date(firstDay);
    startDay.setDate(1-firstDay.getDay());
    
    let html='';
    const days=['日','月','火','水','木','金','土'];
    days.forEach(d=>html+=`<div class="calendar-cell" style="background:transparent;font-size:0.7rem;color:#888">${d}</div>`);
    
    for(let i=0;i<42;i++){
        const d=new Date(startDay);
        d.setDate(startDay.getDate()+i);
        const str=getDateStr(d);
        const isOther=d.getMonth()!==month;
        const isToday=str===todayStr;
        
        const dayHistory=history[str]||{};
        const activeHabits=habits.filter(h=>h.created<=str&&isHabitActiveOnDate(h,d));
        const doneCount=activeHabits.filter(h=>dayHistory[h.id]).length;
        let completion='';
        if(activeHabits.length&&str<=todayStr){
            if(doneCount===activeHabits.length)completion='full';
            else if(doneCount>0)completion='partial';
        }
        
        html+=`<div class="calendar-cell${isOther?' other-month':''}${isToday?' today':''}">
            ${d.getDate()}
            ${completion?`<div class="completion ${completion}"></div>`:''}
        </div>`;
    }
    document.getElementById('calendarGrid').innerHTML=html;
}

initIconPicker();
render();
