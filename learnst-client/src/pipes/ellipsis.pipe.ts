import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'ellipsis'
})
export class EllipsisPipe implements PipeTransform {
  transform(value: string, maxLength: number): string {
    if (!value || value.length <= maxLength)
      return value;
    return value.slice(0, maxLength) + '...';
  }
}
