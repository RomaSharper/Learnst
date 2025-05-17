import {MediumScreenSupport} from '../../helpers/MediumScreenSupport';
import {Component, computed, effect, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import {ThemeService} from '../../services/theme.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-twitch',
  templateUrl: './twitch.component.html',
  styleUrls: ['./twitch.component.scss']
})
export class TwitchComponent extends MediumScreenSupport implements OnInit {
  @ViewChild('chat', {static: true}) chat!: ElementRef<HTMLIFrameElement>;
  @ViewChild('stream', {static: true}) stream!: ElementRef<HTMLIFrameElement>;

  private readonly sanitizer = inject(DomSanitizer);
  readonly streamUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://player.twitch.tv/?channel=fibi_ch&parent=learnst.runasp.net'
  );
  private readonly themeService = inject(ThemeService);
  private chatUrlCache = '';
  readonly chatUrl = computed<SafeResourceUrl>(() => {
    const themeParam = this.themeService.currentTheme().dark ? '&darkpopout' : '';
    const newUrl = `https://www.twitch.tv/embed/fibi_ch/chat?parent=learnst.runasp.net${themeParam}`;

    // Кеширование URL для предотвращения бесконечного цикла
    if (this.chatUrlCache !== newUrl) {
      this.chatUrlCache = newUrl;
      return this.sanitizer.bypassSecurityTrustResourceUrl(newUrl);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(newUrl);
  });

  ngOnInit(): void {
    this.setupThemeTracking();
  }

  private setupThemeTracking(): void {
    effect(() => {
      // Принудительное обновление через setTimeout для выхода из цикла изменений
      setTimeout(() => {
        const iframe = this.chat.nativeElement;
        if (iframe.src !== this.chatUrlCache) {
          iframe.src = this.chatUrlCache;
        }
      });
    });
  }
}
