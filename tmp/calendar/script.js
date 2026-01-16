// カレンダーアプリ
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = this.loadEvents();
        
        this.initElements();
        this.initEventListeners();
        this.render();
    }
    
    initElements() {
        this.calendarDays = document.getElementById('calendarDays');
        this.currentMonthEl = document.getElementById('currentMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.eventsList = document.getElementById('eventsList');
        this.modal = document.getElementById('eventModal');
        this.eventInput = document.getElementById('eventInput');
        this.selectedDateEl = document.getElementById('selectedDate');
        this.saveEventBtn = document.getElementById('saveEvent');
        this.cancelEventBtn = document.getElementById('cancelEvent');
        this.closeBtn = document.querySelector('.close-btn');
    }
    
    initEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        this.saveEventBtn.addEventListener('click', () => this.saveEvent());
        this.cancelEventBtn.addEventListener('click', () => this.closeModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        
        this.eventInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEvent();
        });
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // キーボードナビゲーション
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
    
    // 日本の祝日データ
    getHolidays(year) {
        const holidays = {};
        
        // 固定祝日
        holidays[`${year}-01-01`] = '元日';
        holidays[`${year}-02-11`] = '建国記念の日';
        holidays[`${year}-02-23`] = '天皇誕生日';
        holidays[`${year}-04-29`] = '昭和の日';
        holidays[`${year}-05-03`] = '憲法記念日';
        holidays[`${year}-05-04`] = 'みどりの日';
        holidays[`${year}-05-05`] = 'こどもの日';
        holidays[`${year}-08-11`] = '山の日';
        holidays[`${year}-11-03`] = '文化の日';
        holidays[`${year}-11-23`] = '勤労感謝の日';
        
        // 成人の日（1月第2月曜）
        holidays[this.getNthWeekday(year, 1, 1, 2)] = '成人の日';
        
        // 海の日（7月第3月曜）
        holidays[this.getNthWeekday(year, 7, 1, 3)] = '海の日';
        
        // 敬老の日（9月第3月曜）
        holidays[this.getNthWeekday(year, 9, 1, 3)] = '敬老の日';
        
        // スポーツの日（10月第2月曜）
        holidays[this.getNthWeekday(year, 10, 1, 2)] = 'スポーツの日';
        
        // 春分の日（3月20日か21日）
        const springEquinox = this.getSpringEquinox(year);
        holidays[`${year}-03-${String(springEquinox).padStart(2, '0')}`] = '春分の日';
        
        // 秋分の日（9月22日か23日）
        const autumnEquinox = this.getAutumnEquinox(year);
        holidays[`${year}-09-${String(autumnEquinox).padStart(2, '0')}`] = '秋分の日';
        
        // 振替休日の計算
        const holidayKeys = Object.keys(holidays).sort();
        holidayKeys.forEach(dateStr => {
            const date = new Date(dateStr);
            if (date.getDay() === 0) { // 日曜日の場合
                let nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                let nextDayStr = this.formatDateKey(nextDay);
                while (holidays[nextDayStr]) {
                    nextDay.setDate(nextDay.getDate() + 1);
                    nextDayStr = this.formatDateKey(nextDay);
                }
                holidays[nextDayStr] = '振替休日';
            }
        });
        
        // 国民の休日（祝日に挟まれた平日）
        const sortedHolidays = Object.keys(holidays).sort();
        for (let i = 0; i < sortedHolidays.length - 1; i++) {
            const current = new Date(sortedHolidays[i]);
            const next = new Date(sortedHolidays[i + 1]);
            const diff = (next - current) / (1000 * 60 * 60 * 24);
            if (diff === 2) {
                const between = new Date(current);
                between.setDate(between.getDate() + 1);
                const betweenStr = this.formatDateKey(between);
                if (!holidays[betweenStr] && between.getDay() !== 0) {
                    holidays[betweenStr] = '国民の休日';
                }
            }
        }
        
        return holidays;
    }
    
    getNthWeekday(year, month, weekday, n) {
        const firstDay = new Date(year, month - 1, 1);
        let count = 0;
        let day = 1;
        
        while (count < n) {
            const date = new Date(year, month - 1, day);
            if (date.getDay() === weekday) {
                count++;
                if (count === n) {
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
            }
            day++;
        }
    }
    
    getSpringEquinox(year) {
        return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    
    getAutumnEquinox(year) {
        return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    
    formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }
    
    render() {
        this.renderCalendar();
        this.renderEvents();
    }
    
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 月表示更新
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        this.currentMonthEl.textContent = `${year}年 ${monthNames[month]}`;
        
        // 祝日データ取得
        const holidays = this.getHolidays(year);
        
        // カレンダー日付生成
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const today = new Date();
        const todayStr = this.formatDateKey(today);
        
        let html = '';
        
        // 空白セル
        for (let i = 0; i < startDay; i++) {
            html += '<div class="day empty"></div>';
        }
        
        // 日付セル
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDateKey(date);
            const dayOfWeek = date.getDay();
            
            let classes = ['day'];
            
            if (dateStr === todayStr) classes.push('today');
            if (dayOfWeek === 0) classes.push('sunday');
            if (dayOfWeek === 6) classes.push('saturday');
            if (holidays[dateStr]) classes.push('holiday');
            if (this.events[dateStr] && this.events[dateStr].length > 0) {
                classes.push('has-event');
            }
            
            const holidayName = holidays[dateStr] || '';
            
            html += `
                <div class="${classes.join(' ')}" data-date="${dateStr}">
                    ${day}
                    ${holidayName ? `<span class="holiday-name">${holidayName}</span>` : ''}
                </div>
            `;
        }
        
        this.calendarDays.innerHTML = html;
        
        // 日付クリックイベント
        this.calendarDays.querySelectorAll('.day:not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                this.openModal(dayEl.dataset.date);
            });
        });
    }
    
    renderEvents() {
        const allEvents = [];
        
        Object.keys(this.events).forEach(dateStr => {
            this.events[dateStr].forEach((event, index) => {
                allEvents.push({
                    date: dateStr,
                    name: event,
                    index: index
                });
            });
        });
        
        // 日付順でソート
        allEvents.sort((a, b) => a.date.localeCompare(b.date));
        
        if (allEvents.length === 0) {
            this.eventsList.innerHTML = '<div class="no-events">イベントはありません</div>';
            return;
        }
        
        let html = '';
        allEvents.forEach(event => {
            const date = new Date(event.date);
            const displayDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            const weekday = weekdays[date.getDay()];
            
            html += `
                <div class="event-item">
                    <div class="event-info">
                        <span class="event-date">${displayDate}（${weekday}）</span>
                        <span class="event-name">${this.escapeHtml(event.name)}</span>
                    </div>
                    <button class="delete-btn" data-date="${event.date}" data-index="${event.index}">削除</button>
                </div>
            `;
        });
        
        this.eventsList.innerHTML = html;
        
        // 削除ボタンイベント
        this.eventsList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteEvent(btn.dataset.date, parseInt(btn.dataset.index));
            });
        });
    }
    
    openModal(dateStr) {
        this.selectedDate = dateStr;
        const date = new Date(dateStr);
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const displayDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
        
        this.selectedDateEl.textContent = displayDate;
        this.eventInput.value = '';
        this.modal.classList.add('active');
        this.eventInput.focus();
    }
    
    closeModal() {
        this.modal.classList.remove('active');
        this.selectedDate = null;
    }
    
    saveEvent() {
        const eventName = this.eventInput.value.trim();
        if (!eventName || !this.selectedDate) return;
        
        if (!this.events[this.selectedDate]) {
            this.events[this.selectedDate] = [];
        }
        
        this.events[this.selectedDate].push(eventName);
        this.saveEvents();
        this.closeModal();
        this.render();
    }
    
    deleteEvent(dateStr, index) {
        if (this.events[dateStr]) {
            this.events[dateStr].splice(index, 1);
            if (this.events[dateStr].length === 0) {
                delete this.events[dateStr];
            }
            this.saveEvents();
            this.render();
        }
    }
    
    loadEvents() {
        try {
            const data = localStorage.getItem('calendarEvents');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to load events:', e);
            return {};
        }
    }
    
    saveEvents() {
        try {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        } catch (e) {
            console.error('Failed to save events:', e);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// アプリ初期化
document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});
