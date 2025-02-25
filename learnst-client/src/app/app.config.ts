import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import { MY_DATE_FORMATS } from '../localization/my.date.formats';
import { getRussianPaginatorIntl } from '../localization/russian.paginator.intl';
import { routes } from './app.routes';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { provideServiceWorker } from '@angular/service-worker';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxMask(),
    provideHttpClient(),
    provideHttpClient(),
    provideRouter(routes),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: 'withCredentials', useValue: true },
    { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor },
    { provide: MatPaginatorIntl, useValue: getRussianPaginatorIntl() },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } },
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { showDelay: 250, hideDelay: 0, touchendHideDelay: 5, touchGestures: 'off' } },
    { provide: NGX_MONACO_EDITOR_CONFIG, useValue: { baseUrl: '/assets/monaco', defaultOptions: { theme: 'vs-dark', automaticLayout: true } } },
  ]
};
