export class WindowService {
  private static smallScreen = 500;
  private static mediumScreen = 768;

  static getScreenWidth(): number {
    return window.innerWidth;
  }

  static isMediumScreen(): boolean {
    return WindowService.getScreenWidth() < WindowService.mediumScreen;
  }

  static isSmallScreen(): boolean {
    return WindowService.getScreenWidth() < WindowService.smallScreen;
  }
}
