import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'round'
})
export class RoundPipe implements PipeTransform {
  transform(input: number, digits: number | null): number | null {
    if (typeof input !== 'number' || isNaN(input))
      return null;

    if (typeof digits !== 'number' || digits < 0)
      return input;

    const factor = Math.pow(10, digits);
    return Math.round(input * factor) / factor;
  }
}
