export interface VideoJsOptions {
  // Стандартные опции элемента <video>
  autoplay?: boolean | string; // Автоматическое воспроизведение видео
  controls?: boolean; // Показывать ли элементы управления
  height?: number | string; // Высота видео
  loop?: boolean; // Зациклить воспроизведение
  muted?: boolean; // Отключить звук
  poster?: string; // URL изображения-заставки
  preload?: 'auto' | 'metadata' | 'none'; // Предзагрузка видео
  src?: string; // URL источника видео
  width?: number | string; // Ширина видео

  // Специфичные опции Video.js
  aspectRatio?: string; // Соотношение сторон (например, "16:9")
  audioOnlyMode?: boolean; // Режим только для аудио
  audioPosterMode?: boolean; // Использовать постер для аудио
  autoSetup?: boolean; // Автоматическая настройка Video.js
  breakpoints?: { [key: string]: number }; // Брейкпоинты для адаптивного дизайна
  children?: string[] | { [key: string]: any }; // Дочерние компоненты
  disablePictureInPicture?: boolean; // Отключить режим "Картинка в картинке"
  enableDocumentPictureInPicture?: boolean; // Включить режим "Картинка в картинке" в документе
  enableSmoothSeeking?: boolean; // Плавное переключение между фрагментами видео
  experimentalSvgIcons?: boolean; // Экспериментальные SVG-иконки
  fluid?: boolean; // Адаптивное поведение видео
  fullscreen?: { options: { navigationUI: 'auto' | 'hide' | 'show' } }; // Настройки полноэкранного режима
  id?: string; // Идентификатор видео
  inactivityTimeout?: number; // Таймаут неактивности (в миллисекундах)
  language?: string; // Язык интерфейса
  languages?: { [key: string]: any }; // Поддерживаемые языки
  liveui?: boolean; // Включить интерфейс для live-стримов
  liveTracker?: {
    trackingThreshold?: number; // Порог отслеживания для live-стримов
    liveTolerance?: number; // Допуск для live-стримов
  };
  nativeControlsForTouch?: boolean; // Использовать нативные элементы управления для сенсорных устройств
  normalizeAutoplay?: boolean; // Нормализация автозапуска
  notSupportedMessage?: string; // Сообщение, если видео не поддерживается
  noUITitleAttributes?: boolean; // Отключить атрибуты title в интерфейсе
  playbackRates?: number[]; // Скорости воспроизведения
  playsinline?: boolean; // Воспроизведение встроенно (на мобильных устройствах)
  plugins?: { [key: string]: any }; // Плагины Video.js
  preferFullWindow?: boolean; // Предпочитать полноэкранный режим
  responsive?: boolean; // Адаптивный режим
  restoreEl?: boolean; // Восстановить элемент после уничтожения
  skipButtons?: {
    forward?: number; // Кнопка перемотки вперед (в секундах)
    backward?: number; // Кнопка перемотки назад (в секундах)
  };
  sources?: Array<{ src: string; type: string }>; // Источники видео
  suppressNotSupportedError?: boolean; // Подавлять ошибку "не поддерживается"
  techCanOverridePoster?: boolean; // Технология может переопределить постер
  techOrder?: string[]; // Порядок технологий воспроизведения
  userActions?: {
    click?: boolean | Function; // Действие при клике
    doubleClick?: boolean | Function; // Действие при двойном клике
    hotkeys?: {
      fullscreenKey?: Function; // Горячая клавиша для полноэкранного режима
      muteKey?: Function; // Горячая клавиша для отключения звука
      playPauseKey?: Function; // Горячая клавиша для воспроизведения/паузы
    };
  };
  vttJs?: string; // URL для vtt.js (для субтитров)
  spatialNavigation?: {
    enabled?: boolean; // Включить пространственную навигацию
    keys?: { [key: string]: string }; // Клавиши для навигации
  };
  html5?: {
    nativeControlsForTouch?: boolean; // Нативные элементы управления для сенсорных устройств
    nativeAudioTracks?: boolean; // Нативные аудиодорожки
    nativeTextTracks?: boolean; // Нативные текстовые дорожки
    nativeVideoTracks?: boolean; // Нативные видеодорожки
    preloadTextTracks?: boolean; // Предзагрузка текстовых дорожек
  };
}
