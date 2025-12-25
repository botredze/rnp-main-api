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

    // ВАЖНО: UTC
    const todayUtc = DateTime.now().setZone('utc').startOf('day');
    const yesterdayUtc = todayUtc.minus({ days: 1 });

    switch (periodTypes) {
      case 'custom':
        responseStartDate = startDate!;
        responseEndDate = endDate!;
        break;

      case 'day':
        responseStartDate = yesterdayUtc.toISODate();
        responseEndDate = yesterdayUtc.toISODate();
        break;

      case 'week':
        responseStartDate = yesterdayUtc.minus({ days: 6 }).toISODate();
        responseEndDate = yesterdayUtc.toISODate();
        break;

      case 'month':
        responseStartDate = yesterdayUtc.minus({ days: 29 }).toISODate();
        responseEndDate = yesterdayUtc.toISODate();
        break;

      case 'quarter':
        responseStartDate = yesterdayUtc.minus({ days: 89 }).toISODate();
        responseEndDate = yesterdayUtc.toISODate();
        break;

      case 'allTime':
        responseStartDate = '1970-01-01';
        responseEndDate = yesterdayUtc.toISODate();
        break;
    }

    return { responseStartDate, responseEndDate };
  }
}
