import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ruDate'
})
export class RuDatePipe implements PipeTransform {
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  };

  transform(inputDate?: number | string | Date | null): string {
    if (!inputDate) return '';
    const date = new Date(inputDate);
    const dateFormatted = date ? date.toLocaleDateString('ru-RU', this.options) : '';
    return dateFormatted;
  }
}

