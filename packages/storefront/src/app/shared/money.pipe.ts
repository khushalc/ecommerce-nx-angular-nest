import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'money', standalone: true, pure: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency: 'INR' = 'INR'): string {
    if (value == null) return '—';
    if (currency !== 'INR') return String(value);
    return '₹ ' + Math.round(value).toLocaleString('en-IN');
  }
}
