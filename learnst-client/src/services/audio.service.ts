import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private nextTrackTimeout: any;
  private fadeDuration = 2000;
  private currentTrackIndex = -1;
  private userInteracted = false; // Флаг для отслеживания взаимодействия пользователя
  private sounds: string[] = [
    '/assets/sounds/sfx/03 Puzzle Solved.mp3',
    '/assets/sounds/sfx/37 Sun.mp3'
  ];
  private tracks: string[] = [
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
  private audioElement = new Audio();

  isEnabled = signal(false);
  targetVolume = signal(0.2);

  constructor() {
    this.audioElement.loop = false;
    this.loadState();
    this.setupAudioHandlers();
    this.initializeVolume();
    this.setupUserInteractionListener();
  }

  toggleMusic(state?: boolean): void {
    const newState = state !== undefined ? state : !this.isEnabled();
    if (newState === this.isEnabled()) return;

    this.isEnabled.set(newState);
    this.saveState();

    if (this.isEnabled() && this.userInteracted) {
      this.scheduleNextTrack();
    } else {
      this.fadeOut();
      this.clearSchedule();
    }
  }

  playVictorySound(): void {
    const sound = new Audio(this.sounds[0]);
    sound.loop = false;
    sound.volume = this.targetVolume();
    sound.play().catch(console.error);
  }

  setVolume(value: number): void {
    this.targetVolume.set(value); // Обновляем целевую громкость
    if (this.isEnabled())
      this.audioElement.volume = value;
    localStorage.setItem('musicVolume', value.toString());
  }

  private loadState(): void {
    this.isEnabled.set(localStorage.getItem('musicEnabled') === 'true');
    this.targetVolume.set(parseFloat(localStorage.getItem('musicVolume') ?? '0.2'));
  }

  private saveState(): void {
    localStorage.setItem('musicEnabled', this.isEnabled().toString());
  }

  private setupAudioHandlers(): void {
    const schedule = () => {
      if (this.isEnabled()) this.scheduleNextTrack();
    }

    schedule();
    this.audioElement.addEventListener('ended', schedule);
    this.audioElement.volume = 0;
  }

  private initializeVolume(): void {
    if (this.isEnabled())
      this.audioElement.volume = this.targetVolume();
    else
      this.audioElement.volume = 0;
  }

  private scheduleNextTrack(): void {
    this.clearSchedule();

    if (!this.isEnabled()) {
      console.log('Музыка отключена, планирование трека отменено.');
      return;
    }

    const delay = this.getRandomDelay();
    const nextTrack = this.selectNextTrack();

    console.log(`Следующий трек "${this.getTrackName(nextTrack)}" через ${delay / 1000} сек.`);

    this.nextTrackTimeout = setTimeout(() => {
      this.playSpecificTrack(nextTrack);
    }, delay);
  }

  private playSpecificTrack(track: string): void {
    if (!this.isEnabled()) {
      console.log('Музыка отключена, воспроизведение отменено.');
      return;
    }

    if (!this.userInteracted) {
      console.log('Пользователь еще не взаимодействовал с документом.');
      return;
    }

    // Если трек уже играет, не выбираем его снова
    if (this.audioElement.src === track && !this.audioElement.paused) {
      console.log('Трек уже играет.');
      return;
    }

    this.currentTrackIndex = this.tracks.indexOf(track);
    this.audioElement.src = track;

    // Сбрасываем громкость перед воспроизведением
    this.audioElement.volume = 0;

    this.audioElement.play()
      .then(() => {
        console.log(`Сейчас играет: ${this.getTrackName(track)}`);
        this.fadeIn(); // Добавляем fade-in при старте трека
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Воспроизведение прервано, музыка отключена.');
        } else {
          console.error('Ошибка воспроизведения:', error);
        }
      });
  }

  private selectNextTrack(): string {
    const availableTracks = this.tracks.filter((_, i) => i !== this.currentTrackIndex);
    return availableTracks[Math.floor(Math.random() * availableTracks.length)] || this.tracks[0];
  }

  private getRandomDelay(): number {
    return Math.floor(Math.random() * (300000 - 15000 + 1)) + 15000;
  }

  private getTrackName(path: string): string {
    return path.split('/').pop()?.split('.')[0] || path;
  }

  private clearSchedule(): void {
    if (this.nextTrackTimeout) {
      clearTimeout(this.nextTrackTimeout);
      this.nextTrackTimeout = null;
    }
  }

  private fadeIn(): void {
    const initialVolume = this.audioElement.volume;
    const delta = this.targetVolume() - initialVolume;
    const step = delta / (this.fadeDuration / 100);

    const fade = setInterval(() => {
      if (!this.isEnabled()) {
        clearInterval(fade);
        return;
      }

      const newVolume = this.audioElement.volume + step;
      if (newVolume >= this.targetVolume()) {
        this.audioElement.volume = this.targetVolume();
        clearInterval(fade);
      } else {
        this.audioElement.volume = newVolume;
      }
    }, 100);
  }

  private fadeOut(): void {
    const initialVolume = this.audioElement.volume;
    const step = initialVolume / (this.fadeDuration / 100);

    const fade = setInterval(() => {
      const newVolume = this.audioElement.volume - step;
      if (newVolume <= 0) {
        this.audioElement.volume = 0;
        this.audioElement.pause();
        clearInterval(fade);
      } else {
        this.audioElement.volume = newVolume;
      }
    }, 100);
  }

  private setupUserInteractionListener(): void {
    document.addEventListener('click', () => {
      if (!this.userInteracted) {
        this.userInteracted = true;
        console.debug('Пользователь провзаимодействовал с документом, воспроизведение музыки возможно.');
        if (this.isEnabled()) {
          // Если музыка включена, начинаем воспроизведение
          this.playSpecificTrack(this.selectNextTrack());
        }
      }
    }, { once: true });
  }
}
