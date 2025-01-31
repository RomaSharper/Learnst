import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateRange'
})
export class DateRangePipe implements PipeTransform {
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  };

  transform(startDate?: number | string | Date | null, endDate?: number | string | Date | null, isFirstLetterUpper: boolean = true): string {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (!start && !end) return '';
    const startDateFormatted = start ? start.toLocaleDateString('ru-RU', this.options) : '';
    const endDateFormatted = end ? end.toLocaleDateString('ru-RU', this.options) : '';

    if (end)
      return `${isFirstLetterUpper ? 'С' : 'с'} ${startDateFormatted} ${start ? 'по' : 'по'} ${endDateFormatted}`;
    return `${isFirstLetterUpper ? 'С' : 'с'} ${startDateFormatted}`;
  }
}

