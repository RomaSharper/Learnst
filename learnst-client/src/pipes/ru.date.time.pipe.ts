import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

@Pipe({
  name: 'ruDateTime',
  standalone: true
})
export class RuDateTimePipe implements PipeTransform {
  transform(value: string | Date | number | undefined | null, type: 'relative' | 'absolute' = 'absolute'): string | null {
    if (!value) return null;
    if (value === 'Только что') return value;

    // Преобразуем входящее значение в объект Date
    const utcDate = this.parseDateAsUTC(value); // Явно парсим как UTC
    if (!utcDate) return null;

    // Преобразуем UTC-время в локальное время пользователя
    const localDate = this.convertUtcToLocal(utcDate);

    // Форматируем дату в зависимости от типа
    if (type === 'relative') {
      return this.formatRelative(localDate); // Относительное время
    } else {
      return this.formatAbsolute(localDate); // Абсолютное время
    }
  }

  /**
   * Парсит входящее значение как UTC-время.
   * Поддерживает строки ISO, числа (timestamp) и объекты Date.
   */
  private parseDateAsUTC(value: string | Date | number): Date | null {
    if (value instanceof Date)
      return value; // Если уже объект Date
    else if (typeof value === 'string')
      return new Date(value + 'Z'); // Добавляем суффикс "Z" для явного указания UTC
    else if (typeof value === 'number')
      return new Date(value); // Создаём Date из timestamp
    return null; // Некорректный формат
  }

  /**
   * Преобразует UTC-время в локальное время пользователя.
   */
  private convertUtcToLocal(utcDate: Date): Date {
    // Определяем временную зону клиента
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Преобразуем UTC-время в локальное время
    return toZonedTime(utcDate, clientTimeZone);
  }

  /**
   * Форматирует дату как относительное время (например, "2 минуты назад").
   */
  private formatRelative(date: Date): string {
    return formatDistanceToNow(date, {
      addSuffix: true, // Добавляет суффикс "назад" или "через"
      locale: ru // Локализация на русский язык
    });
  }

  /**
   * Форматирует дату как абсолютное время (например, "1 февраля 2025 года").
   */
  private formatAbsolute(date: Date): string {
    return format(date, "d MMMM yyyy 'года' HH:mm", {
      locale: ru // Локализация на русский язык
    });
  }
}
