import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

@Pipe({
  name: 'ruDateTime',
  standalone: true
})
export class RuDateTimePipe implements PipeTransform {
  private readonly timezoneRegex = /(GMT[+-]\d{4}|\([A-Za-zа-яА-Я\s,]+\))/;
  private readonly dateFormats = [
    'EEE MMM dd yyyy HH:mm:ss', // Формат типа "Tue Feb 25 2025 23:23:03"
    'yyyy-MM-dd',               // ISO форматы
    'dd.MM.yyyy',               // Русский формат
    'MM/dd/yyyy'                // Американский формат
  ];

  transform(value: string | Date | number | undefined | null, type: 'relative' | 'absolute' = 'absolute'): string | null {
    if (!value) return null;

    const parsedDate = this.parseDate(value);
    if (!parsedDate) return null;

    const localDate = this.convertToLocalTime(parsedDate);

    return type === 'relative'
      ? this.formatRelative(localDate)
      : this.formatAbsolute(localDate);
  }

  private parseDate(value: string | Date | number): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);

    // Обработка строковых форматов
    if (this.isTimezonePresent(value)) {
      return this.parseWithTimezone(value);
    }

    // Попытка парсинга разными методами
    return this.safeDateParse(value);
  }

  private isTimezonePresent(value: string): boolean {
    return this.timezoneRegex.test(value);
  }

  private parseWithTimezone(value: string): Date | null {
    try {
      // Удаляем информацию о временной зоне в скобках
      const cleanedDateString = value.replace(/\s*\([^)]+\)$/, '');
      return new Date(cleanedDateString);
    } catch {
      return null;
    }
  }

  private safeDateParse(value: string): Date | null {
    // Пробуем разные форматы дат
    for (const _fmt of this.dateFormats) {
      try {
        const parsed = parseISO(value);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {

      }
    }

    // Пробуем стандартный парсинг
    try {
      const timestamp = Date.parse(value);
      if (!isNaN(timestamp)) return new Date(timestamp);
    } catch {}

    return null;
  }

  private convertToLocalTime(date: Date): Date {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return toZonedTime(date, timeZone);
  }

  private formatRelative(date: Date): string {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ru,
      includeSeconds: true
    }); //.replace(/^примерно /, '');
  }

  private formatAbsolute(date: Date): string {
    return format(date, "d MMMM yyyy 'г.' HH:mm", { locale: ru });
  }
}
