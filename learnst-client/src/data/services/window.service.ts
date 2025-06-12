export class WindowService {
  private static mediumScreen = 768;

  static getScreenWidth(): number {
    return window.innerWidth;
  }

  static isMediumScreen(): boolean {
    return WindowService.getScreenWidth() < WindowService.mediumScreen;
  }
}
