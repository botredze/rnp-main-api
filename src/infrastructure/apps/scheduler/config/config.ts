const CRON_RULES = {
  everyMinute: '* * * * *',
  everyFiveMinutes: '*/5 * * * *',
  everyHour: '0 * * * *',
  everySixHours: '0 */6 * * *',
  everyDay: '0 0 * * *',
  everyWeek: '0 0 * * 1',
  everyMonth: '0 0 1 * *',
  dailyAt: (hour: number, minute: number = 0) => `0 ${minute} ${hour} * * *`,
};

export const defaultScheduledTasks = [
];