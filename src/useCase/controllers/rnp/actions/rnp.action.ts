import { DateTime } from 'luxon';
import { GetRnpAnalyticsDto } from '@/shared/dtos/rnpAnalitics.dto';

export class RnpAction {
  generateDateRange(start: string, end: string): Array<string> {
    const dates = [];
    let current = DateTime.fromISO(start);
    const last = DateTime.fromISO(end);

    while (current <= last) {
      dates.push(current.toISODate());
      current = current.plus({ days: 1 });
    }

    return dates;
  }

  getRnpTimePeriod(query: GetRnpAnalyticsDto) {
    const { startDate, endDate, periodTypes } = query;

    let responseStartDate: string;
    let responseEndDate: string;

    const yesterday = DateTime.now().minus({ days: 1 }); // вчера

    switch (periodTypes) {
      case 'custom':
        responseStartDate = startDate!;
        responseEndDate = DateTime.fromISO(endDate!).plus({ days: 1 }).toISODate();
        break;

      case 'day':
        responseStartDate = yesterday.toISODate();
        responseEndDate = yesterday.plus({ days: 1 }).toISODate();
        break;

      case 'week':
        responseStartDate = yesterday.minus({ days: 6 }).toISODate(); // последние 7 дней
        responseEndDate = yesterday.plus({ days: 0 }).toISODate();
        break;

      case 'month':
        responseStartDate = yesterday.minus({ days: 28 }).toISODate(); // последние 30 дней
        responseEndDate = yesterday.plus({ days: 0 }).toISODate();
        break;

      case 'quarter':
        responseStartDate = yesterday.minus({ days: 89 }).toISODate(); // последние 90 дней
        responseEndDate = yesterday.plus({ days: 0 }).toISODate();
        break;

      case 'allTime':
        responseStartDate = '2025-01-01';
        responseEndDate = yesterday.plus({ days: 0 }).toISODate();
        break;
    }

    return { responseStartDate, responseEndDate };
  }
}
