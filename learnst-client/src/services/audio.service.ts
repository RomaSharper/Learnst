import {inject, Injectable, signal} from '@angular/core';
import {LogService} from './log.service';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  readonly tracks: string[] = [
    '/assets/sounds/music/01 My Burden Is Light.mp3',
    '/assets/sounds/music/02 Someplace I Know.mp3',
    '/assets/sounds/music/04 Phosphor.mp3',
    '/assets/sounds/music/05 The Prophecy.mp3',
    '/assets/sounds/music/06 Abandoned Factory.mp3',
    '/assets/sounds/music/07 Silverpoint.mp3',
    '/assets/sounds/music/08 A God\'s Machine.mp3',
    '/assets/sounds/music/09 Rowbot.mp3',
    '/assets/sounds/music/10 Geothermal.mp3',
    '/assets/sounds/music/11 Distant.mp3',
    '/assets/sounds/music/12 Into The Light.mp3',
    '/assets/sounds/music/13 Self Contained Universe (Reprise).mp3',
    '/assets/sounds/music/14 Navigate.mp3',
    '/assets/sounds/music/15 To Sleep.mp3',
    '/assets/sounds/music/16 To Dream.mp3',
    '/assets/sounds/music/17 Flooded Ruins.mp3',
    '/assets/sounds/music/18 Alula.mp3',
    '/assets/sounds/music/19 Children of the Ruins.mp3',
    '/assets/sounds/music/21 Pretty Bad.mp3',
    '/assets/sounds/music/22 On Little Cat Feet.mp3',
    '/assets/sounds/music/23 Indoors.mp3',
    '/assets/sounds/music/24 Dark Stairwell.mp3',
    '/assets/sounds/music/25 Sonder.mp3',
    '/assets/sounds/music/26 Pretty nice day, huh....mp3',
    '/assets/sounds/music/27 On Little Cat Feet (ground).mp3',
    '/assets/sounds/music/28 Library Stroll.mp3',
    '/assets/sounds/music/29 Simple Secrets.mp3',
    '/assets/sounds/music/30 Factory.mp3',
    '/assets/sounds/music/31 Library Nap.mp3',
    '/assets/sounds/music/32 The Tower.mp3',
    '/assets/sounds/music/33 Distant water.mp3',
    '/assets/sounds/music/34 Niko and the World Machine.mp3',
    '/assets/sounds/music/35 I\'m Here.mp3',
    '/assets/sounds/music/36 Pretty.mp3',
    '/assets/sounds/music/38 Self Contained Universe.mp3',
    '/assets/sounds/music/39 Thanks For Everything.mp3',
    '/assets/sounds/music/40 OneShot Trailer.mp3',
    '/assets/sounds/music/41 Countdown.mp3',
    '/assets/sounds/music/42 IT\'S TIME TO FIGHT CRIME.mp3'
  ];
  private tabId!: string;
  private nextTrackTimeout: any;
  private fadeDuration = 2000;
  private isActiveTab = false;
  private isScheduling = false;
  private syncChannel!: BroadcastChannel;
  private currentTrackIndex = -1;
  private userInteracted = false;
  private logService = inject(LogService);
  private audioElement = new Audio();
  private readonly sounds: string[] = [
    '/assets/sounds/sfx/03 Puzzle Solved.mp3',
    '/assets/sounds/sfx/37 Sun.mp3'
  ];
  private readonly MUSIC_STORAGE_KEY = 'music';
  isEnabled = signal(localStorage.getItem(this.MUSIC_STORAGE_KEY) === 'on');
  private readonly VOLUME_STORAGE_KEY = 'volume';
  targetVolume = signal(parseFloat(localStorage.getItem(this.VOLUME_STORAGE_KEY) ?? '20'));
  private readonly trackNames: string[] = [
    'My Burden Is Light', 'Someplace I Know', 'Phosphor', 'The Prophecy',
    'Abandoned Factory', 'Silverpoint', "A God's Machine", 'Rowbot',
    'Geothermal', 'Distant', 'Into The Light', 'Self Contained Universe (Reprise)',
    'Navigate', 'To Sleep', 'To Dream', 'Flooded Ruins', 'Alula',
    'Children of the Ruins', 'Pretty Bad', 'On Little Cat Feet',
    'Indoors', 'Dark Stairwell', 'Sonder', 'Pretty nice day, huh...',
    'On Little Cat Feet (ground)', 'Library Stroll', 'Simple Secrets',
    'Factory', 'Library Nap', 'The Tower', 'Distant water',
    'Niko and the World Machine', 'I\'m Here', 'Pretty',
    'Self Contained Universe', 'Thanks For Everything', 'OneShot Trailer',
    'Countdown', 'IT\'S TIME TO FIGHT CRIME'
  ];
  private readonly SYNC_CHANNEL_NAME = 'music_channel';
  private readonly ACTIVE_TAB_KEY = 'active_music_tab';

  constructor() {
    this.audioElement.loop = false;
    this.initializeTabId();
    this.initializeVolume();
    this.setupAudioHandlers();
    this.setupUserInteractionListener();
    this.setupTabSync();
  }

  getTrackNameByNumber(trackNumber: number): string {
    return this.trackNames[trackNumber - 1] || 'Неизвестный';
  }

  toggleMusic(state?: boolean): void {
    const newState = state ?? !this.isEnabled();

    if (newState === this.isEnabled()) {
      this.logService.log('Состояние музыки не изменилось', {current: this.isEnabled()});
      return;
    }

    this.isEnabled.set(newState);
    this.saveState();
    this.logService.log(`Музыка ${newState ? 'ВКЛЮЧЕНА' : 'ВЫКЛЮЧЕНА'} пользователем`);

    if (newState) {
      this.attemptToClaimActiveTab().then(isActive => {
        if (isActive) {
          this.logService.log('Успешный захват активности после включения музыки');
          if (this.audioElement.paused) {
            this.logService.log('Запуск нового трека (плеер был остановлен)');
            this.scheduleNextTrack();
          }
        }
      });
    } else {
      this.logService.log('Инициировано выключение музыки', {
        activeTab: this.isActiveTab,
        scheduled: !!this.nextTrackTimeout
      });
      this.fadeOut();
      this.clearSchedule();
      this.syncChannel.postMessage({
        type: 'status_update',
        isPlaying: false,
        tabId: this.tabId
      });
    }
  }

  playVictorySound(): void {
    const sound = new Audio(this.sounds[0]);
    sound.loop = false;
    sound.volume = this.targetVolume() / 100;
    sound.play().catch(this.logService.error);
  }

  setVolume(value: number): boolean {
    if (value < 0 || value > 100) {
      this.logService.log('Некорректное значение громкости', {value});
      return false;
    }

    const oldVolume = this.targetVolume();
    this.targetVolume.set(value);
    const logData = {
      new: value,
      old: oldVolume,
      actual: this.audioElement.volume
    };

    if (this.isEnabled()) {
      this.audioElement.volume = value / 100;
      this.logService.log('Громкость изменена', logData);
    } else
      this.logService.log('Громкость изменена (но музыка выключена)', logData);

    localStorage.setItem(this.VOLUME_STORAGE_KEY, value.toString());
    return true;
  }

  async playSpecificTrack(track: string, force: boolean = false): Promise<boolean> {
    try {
      if (force || !this.isActiveTab) {
        localStorage.setItem(this.ACTIVE_TAB_KEY, this.tabId);
        this.isActiveTab = true;
        this.clearSchedule();
        this.syncChannel.postMessage({
          type: 'force_stop',
          tabId: this.tabId,
          timestamp: Date.now()
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Остановка предыдущего саундтрека
      if (!this.audioElement.paused) {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      }

      // Инициализация нового саундтрека
      this.audioElement.src = track;
      this.currentTrackIndex = this.tracks.indexOf(track);
      this.audioElement.volume = 0;

      // Запуск воспроизведения
      try {
        await this.audioElement.play();
        this.syncChannel.postMessage({
          isPlaying: true,
          tabId: this.tabId,
          type: 'status_update',
          track: this.getTrackName(this.audioElement.src)
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') throw error;
        this.logService.log('Воспроизведение прервано, перезапуск...');
        await this.audioElement.play();
      }

      // плавное увеличение громкости
      this.fadeIn();
      this.logService.log('Воспроизведение успешно начато', {
        track: this.getTrackName(track),
        duration: `${this.audioElement.duration.toFixed(2)}s`
      });
      return true;
    } catch (error) {
      this.logService.log('Критическая ошибка воспроизведения', {
        tabId: this.tabId,
        error: (error as Error).message,
        track: this.getTrackName(track),
        status: {
          active: this.isActiveTab,
          enabled: this.isEnabled(),
          paused: this.audioElement.paused
        }
      });
      return false;
    }
  }

  private saveState(): void {
    localStorage.setItem(this.MUSIC_STORAGE_KEY, this.isEnabled() ? 'on' : 'off');
    localStorage.setItem(this.VOLUME_STORAGE_KEY, this.targetVolume().toString());
  }

  private initializeTabId(): void {
    this.tabId = sessionStorage.getItem('tab_id') || this.generateTabId(); // Пытаемся получить ID из sessionStorage
    sessionStorage.setItem('tab_id', this.tabId); // Сохраняем ID для будущих перезагрузок
  }

  private generateTabId(): string {
    return Math.random().toString(36).slice(2, 9);
  }

  private initializeVolume(): void {
    if (this.isEnabled())
      this.audioElement.volume = this.targetVolume() / 100;
    else
      this.audioElement.volume = 0;
  }

  private setupAudioHandlers(): void {
    this.audioElement.addEventListener('ended', () => {
      this.logService.log('Саундтрек закончился', {
        track: this.getTrackName(this.audioElement.src),
        duration: `${this.audioElement.duration.toFixed(2)}s`
      });

      if (this.isEnabled() && this.isActiveTab)
        this.scheduleNextTrack();
    });

    // Добавляем обработчик временных меток
    /*this.audioElement.addEventListener('timeupdate', () =>
      this.logService.log('Прогресс воспроизведения', {
        current: this.audioElement.currentTime,
        duration: this.audioElement.duration
      }));*/
  }

  private setupTabSync(): void {
    this.syncChannel = new BroadcastChannel(this.SYNC_CHANNEL_NAME);
    this.logService.log('Канал синхронизации создан', {
      tabId: this.tabId,
      name: this.SYNC_CHANNEL_NAME
    });

    this.syncChannel.onmessage = (event: MessageEvent) => {
      if (event.data.tabId === this.tabId) return;
      this.logService.log('Получено сообщение', event.data);

      const data = event.data;
      switch (data.type) {
        case 'alive_check':
          if (this.tabId === data.targetTabId)
            this.syncChannel.postMessage({
              type: 'alive',
              tabId: this.tabId,
              timestamp: data.timestamp
            });
          break;

        case 'force_stop':
          if (this.tabId === data.tabId) {
            this.logService.log('Игнорируем собственный force_stop');
            return;
          }
          this.logService.log('Обработка force_stop от', data.tabId);
          this.handleInactive();
          this.syncChannel.postMessage({
            type: 'force_stop_ack',
            tabId: data.tabId,
            timestamp: Date.now()
          });
          break;

        case 'status_update':
          this.logService.log('Синхронизация статуса воспроизведения', {
            source: data.tabId,
            track: data.track,
            status: data.isPlaying ? 'playing' : 'stopped'
          });
          if (data.isPlaying && this.isActiveTab) {
            this.logService.log(`Обнаружен конфликт воспроизведения! Вкладка-источник: ${data.tabId}`);
            this.handleInactive();
          }
          break;

        case 'tab_closed':
          this.logService.log('Получено уведомление о закрытии вкладки', data);
          if (data.isActive && data.tabId === localStorage.getItem(this.ACTIVE_TAB_KEY)) {
            this.logService.log('Обнаружено закрытие активной вкладки', {
              currentActiveTab: localStorage.getItem(this.ACTIVE_TAB_KEY),
              isCurrentActive: this.isActiveTab
            });
            localStorage.removeItem(this.ACTIVE_TAB_KEY);
            setTimeout(() => {
              this.logService.log('Инициирован перехват активности после закрытия вкладки');
              this.attemptToClaimActiveTab();
            }, 1000 + Math.random() * 2000);
          }
          break;

        case 'claim_request':
          this.logService.log('Запрос захвата от', data.tabId);
          if (this.isActiveTab) {
            this.logService.log('Отправка отказа на запрос захвата');
            this.syncChannel.postMessage({
              type: 'claim_response',
              tabId: this.tabId,
              success: false,
              timestamp: data.timestamp
            });
          }
          break;

        case 'claim_response':
          this.logService.log('Ответ на запрос захвата', data);
          break;

        case 'force_stop_ack':
          this.logService.log('Подтверждение force_stop получено', data);
          break;
      }
    };

    const handler = () => {
      if (this.isActiveTab) {
        this.logService.log('Отправка уведомления о закрытии активной вкладки');
        this.syncChannel.postMessage({
          type: 'tab_closed',
          tabId: this.tabId,
          isActive: true,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('close', handler);
    window.addEventListener('beforeunload', handler);
  }

  private handleInactive(): void {
    this.logService.log('Переход в неактивное состояние', {
      wasActive: this.isActiveTab,
      hadSchedule: !!this.nextTrackTimeout
    });
    this.isActiveTab = false;
    this.clearSchedule();
    this.fadeOut();
    localStorage.removeItem(this.ACTIVE_TAB_KEY);
  }

  private async attemptToClaimActiveTab(): Promise<boolean> {
    this.logService.log('Начало захвата активной вкладки');

    // Атомарная проверка и установка статуса
    const currentActiveTab = localStorage.getItem(this.ACTIVE_TAB_KEY);

    // Сценарий 1: Нет активных вкладок
    if (!currentActiveTab) {
      this.logService.log('Нет активной вкладки - захватываем');
      localStorage.setItem(this.ACTIVE_TAB_KEY, this.tabId);
      this.isActiveTab = true;
      this.scheduleNextTrack();
      return true;
    }

    // Сценарий 2: Текущая вкладка уже активна
    if (currentActiveTab === this.tabId) {
      this.logService.log('Вкладка уже активна');
      this.isActiveTab = true;
      return true;
    }

    // Сценарий 3: Проверка активности другой вкладки
    this.logService.log(`Проверка активности вкладки ${currentActiveTab}`);
    const isAlive = await this.checkTabAlive(currentActiveTab);

    if (!isAlive) {
      this.logService.log('Вкладка неактивна - перехватываем контроль');
      localStorage.setItem(this.ACTIVE_TAB_KEY, this.tabId);
      this.isActiveTab = true;
      this.scheduleNextTrack();
      return true;
    }

    this.logService.log('Активная вкладка уже планирует или воспроизводит музыку');
    return false;
  }

  private checkTabAlive(tabId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const checkTimeout = 300;
      let responded = false;

      const timeoutId = setTimeout(() => {
        if (!responded) {
          this.logService.log('Таймаут проверки активности для ' + tabId);
          resolve(false);
        }
      }, checkTimeout);

      const listener = (event: MessageEvent) => {
        if (event.data.type === 'alive' && event.data.tabId === tabId) {
          responded = true;
          clearTimeout(timeoutId);
          this.syncChannel.removeEventListener('message', listener);
          this.logService.log('Получен ответ активности от ' + tabId);
          resolve(true);
        }
      };

      this.syncChannel.addEventListener('message', listener);
      this.syncChannel.postMessage({
        type: 'alive_check',
        targetTabId: tabId,
        timestamp: Date.now(),
        sourceTab: this.tabId
      });
    });
  }

  private scheduleNextTrack(): void {
    if (this.isScheduling) {
      this.logService.log('Планирование уже активно');
      return;
    }

    if (!this.isEnabled()) {
      this.logService.log('Планирование отменено: музыка выключена');
      return;
    }

    if (!this.isActiveTab) {
      this.logService.log('Планирование отменено: вкладка неактивна');
      return;
    }

    // Сброс предыдущего таймера
    this.clearSchedule();

    this.isScheduling = true;
    const nextTrack = this.selectNextTrack();
    const delay = this.getRandomDelay();

    this.logService.log('Запланирован следующий саундтрек', {
      track: this.getTrackName(nextTrack),
      delay: `${delay / 1000}s`
    });

    this.nextTrackTimeout = setTimeout(async () => {
      try {
        if (this.isActiveTab && this.isEnabled())
          await this.playSpecificTrack(nextTrack);
      } finally {
        this.isScheduling = false;
      }
    }, delay);
  }

  private selectNextTrack(): string {
    const availableTracks = this.tracks.filter((_, i) => i !== this.currentTrackIndex);
    return availableTracks[Math.floor(Math.random() * availableTracks.length)] || this.tracks[0];
  }

  private getRandomDelay(): number {
    return Math.floor(Math.random() * (300000 - 15000 + 1)) + 15000;
  }

  private getTrackName(path?: string): string {
    if (!path) return 'Неизвестный трек';
    try {
      return decodeURIComponent(path.split('/').pop()?.split('.')[0] || path);
    } catch (e) {
      this.logService.log('Ошибка декодирования названия трека', {path, error: e});
      return path;
    }
  }

  private clearSchedule(): void {
    if (this.nextTrackTimeout) {
      this.logService.log('Очистка расписания');
      clearTimeout(this.nextTrackTimeout);
      this.nextTrackTimeout = null;
      this.isScheduling = false;
    }
  }

  private fadeIn(): void {
    if (!this.isActiveTab || this.audioElement.volume >= this.targetVolume() / 100)
      return;

    const initialVolume = this.audioElement.volume;
    const target = this.targetVolume() / 100;
    const step = (target - initialVolume) / (this.fadeDuration / 100);

    const fade = setInterval(() => {
      if (!this.isActiveTab || this.audioElement.paused) {
        clearInterval(fade);
        return;
      }

      const newVolume = Math.min(this.audioElement.volume + step, target);
      this.audioElement.volume = newVolume;

      if (newVolume >= target)
        clearInterval(fade);
    }, 100);
  }

  private fadeOut(): void {
    this.logService.log('Начало затухания музыки', {
      currentVolume: this.audioElement.volume,
      targetVolume: 0
    });

    const initialVolume = this.audioElement.volume;
    const step = initialVolume / (this.fadeDuration / 100);

    const fade = setInterval(() => {
      const newVolume = this.audioElement.volume - step;
      if (newVolume <= 0) {
        this.audioElement.volume = 0;
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        clearInterval(fade);
        this.logService.log('Музыка полностью остановлена (затухание завершено)');
      } else
        this.audioElement.volume = newVolume;
    }, 100);
  }

  private setupUserInteractionListener(): void {
    const handler = () => {
      if (!this.userInteracted) {
        this.userInteracted = true;
        this.logService.log('Первое взаимодействие пользователя');
        this.attemptToClaimActiveTab().then(success => {
          if (success) {
            this.logService.log('Успешный захват активности');
            this.scheduleNextTrack();
          }
        });
      }
    };

    window.addEventListener('keydown', handler, {once: true});
    document.addEventListener('click', handler, {once: true});
  }
}
