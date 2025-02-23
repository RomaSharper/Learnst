import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ColorsService {
  public static generateColor(): string {
    return `#${(0x1000000 + Math.random() * 0xffffff).toString(16).slice(1,6)}`;
  }

  public static getContrastColor(color: string): 'dark' | 'light' {
    // Проверяем, является ли цвет градиентом
    if (this.isGradient(color)) {
      const averageLuminance = this.getAverageLuminanceFromGradient(color);
      console.log(averageLuminance);
      return averageLuminance > 0.5 ? 'dark' : 'light';
    }

    // Если это обычный HEX цвет, продолжаем его обработку
    const hex = color.replace('#', ''); // Удаляем # если есть
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // Считаем яркость по формуле WCAG
    console.log(luminance);
    return luminance > 0.5 ? 'dark' : 'light';
  }

  private static isGradient(color: string): boolean {
    return color.startsWith('linear-gradient') || color.startsWith('radial-gradient');
  }

  private static getAverageLuminanceFromGradient(gradient: string): number {
    // Регулярное выражение для извлечения цветов из градиента
    const colorRegex = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)|#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|(\w+)/g;
    const colors = gradient.match(colorRegex) || [];

    let totalLuminance = 0;
    colors.forEach(color => {
      totalLuminance += this.getLuminance(color);
    });

    return totalLuminance / colors.length; // Возвращаем среднюю яркость
  }

  // Метод для вычисления яркости для цвета
  private static getLuminance(color: string): number {
    let r, g, b;

    // Обработка RGBA
    const rgbaMatch = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/.exec(color);
    if (rgbaMatch) {
      r = parseInt(rgbaMatch[1]);
      g = parseInt(rgbaMatch[2]);
      b = parseInt(rgbaMatch[3]);
    } else if (color.startsWith('#')) {
      // Обработка HEX цвета
      const hex = color.replace('#', '');
      r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
      g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
      b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    } else {
      // Обработка именованных цветов (например, "white", "black")
      const colorMap: { [key: string]: [number, number, number] } = {
        'black': [0, 0, 0],
        'white': [255, 255, 255],
        // Добавьте сюда другие именованные цвета по необходимости
      };
      if (colorMap[color]) {
        [r, g, b] = colorMap[color];
      } else {
        return 0; // Если цвет не распознан, возвращаем 0.
      }
    }

    // Считаем luminance по формуле
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
}
