import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

@Pipe({
  name: 'ruDateTime',
  standalone: true
})
export class RuDateTimePipe implements PipeTransform {
  transform(value: string | Date | number | undefined | null, format: 'full' | 'relative' = 'full'): string | null {
    if (!value)
      return null;

    const date = new Date(value);

    if (format === 'relative')
      return formatDistanceToNow(date, { addSuffix: true, locale: ru });

    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
