import {Pipe, PipeTransform} from '@angular/core';
import {format} from 'date-fns';
import {formatInTimeZone} from 'date-fns-tz';
import {ru} from 'date-fns/locale';

@Pipe({
  name: 'ruDateTime',
  standalone: true
})
export class RuDateTimePipe implements PipeTransform {
  transform(
    value: string | Date | number | undefined | null,
    type: 'relative' | 'absolute' = 'absolute'
  ): string | null {
    if (!value) return null;
    if (value === 'Только что') return value;

    const date = this.parseDate(value);
    if (!date) return null;

    return type === 'relative'
      ? this.formatRelative(date)
      : this.formatAbsolute(date);
  }

  private parseDate(value: string | Date | number): Date | null {
    try {
      let parsed: Date;

      if (typeof value === 'number') {
        parsed = new Date(value);
      } else if (typeof value === 'string') {
        // Добавляем Z для UTC, если его нет
        const dateString = value.endsWith('Z') ? value : `${value}Z`;
        parsed = new Date(dateString);
      } else {
        parsed = new Date(value);
      }

      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  private formatRelative(date: Date): string {
    // Используем оригинальный Date для расчета относительного времени
    return format(date, 'PPPpp', {
      locale: ru,
    }).replace(/^в /, '');
  }

  private formatAbsolute(date: Date): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return formatInTimeZone(date, timeZone, "d MMMM yyyy 'г.' HH:mm (zzz)", {
      locale: ru,
    });
  }
}
