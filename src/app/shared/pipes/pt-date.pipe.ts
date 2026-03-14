import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../helpers/formatters.helper';

@Pipe({ name: 'ptDate', standalone: true })
export class PtDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDate(value);
  }
}
