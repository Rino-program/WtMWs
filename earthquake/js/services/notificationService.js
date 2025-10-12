/**
 * 通知サービス - プッシュ通知とアラートシステム
 */
class NotificationService {
    constructor() {
        this.permission = 'default';
        this.soundEnabled = CONFIG.NOTIFICATION.SOUND_ENABLED;
        this.sounds = {};
        this.init();
    }

    async init() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
            if (this.permission === 'default') {
                this.permission = await Notification.requestPermission();
            }
        }
        this.loadSounds();
    }

    loadSounds() {
        Object.entries(CONFIG.NOTIFICATION.SOUNDS).forEach(([key, path]) => {
            this.sounds[key] = new Audio(path);
        });
    }

    async notify(title, options = {}) {
        if (this.permission !== 'granted') return;
        const notification = new Notification(title, {
            icon: '/assets/icon.png',
            badge: '/assets/badge.png',
            ...options
        });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        return notification;
    }

    showEEWAlert(eew) {
        this.playSound('EEW');
        const magnitude = eew.magnitude || '不明';
        const region = eew.region || '不明';
        this.notify('緊急地震速報', {
            body: `${region} M${magnitude}\n強い揺れに警戒してください`,
            tag: 'eew',
            requireInteraction: true
        });
        this.showModal({
            title: '⚠️ 緊急地震速報',
            message: `${region}でM${magnitude}の地震\n強い揺れに警戒してください`,
            type: 'danger',
            sound: true
        });
    }

    showTsunamiAlert(warnings) {
        this.playSound('TSUNAMI');
        const message = warnings.map(w => `${w.region}: ${w.gradeLabel}`).join('\n');
        this.notify('津波警報・注意報', {
            body: message,
            tag: 'tsunami',
            requireInteraction: true
        });
    }

    showEarthquakeNotification(earthquake) {
        const { magnitude, region, maxIntensity } = earthquake;
        if (magnitude >= CONFIG.NOTIFICATION.THRESHOLDS.MIN_MAGNITUDE) {
            this.playSound('EARTHQUAKE');
            this.notify('地震情報', {
                body: `${region} M${magnitude} 最大震度${maxIntensity}`,
                tag: `earthquake-${earthquake.id}`
            });
        }
    }

    playSound(type) {
        if (this.soundEnabled && this.sounds[type]) {
            this.sounds[type].play().catch(e => console.error('音声再生エラー:', e));
        }
    }

    showModal(options) {
        const modal = document.createElement('div');
        modal.className = 'alert-modal';
        modal.innerHTML = `
            <div class="alert-content alert-${options.type}">
                <h2>${options.title}</h2>
                <p>${options.message}</p>
                <button class="btn btn-primary">確認</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('button').onclick = () => modal.remove();
    }
}

const notificationService = new NotificationService();
if (typeof window !== 'undefined') window.notificationService = notificationService;
