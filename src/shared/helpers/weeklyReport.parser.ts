import * as XLSX from 'xlsx';

export enum WeeklyReportColumns {
  REPORT_NUMBER = '№ отчета',
  LEGAL_ENTITY = 'Юридическое лицо',
  START_DATE = 'Дата начала',
  END_DATE = 'Дата конца',
  FORMATION_DATE = 'Дата формирования',
  REPORT_TYPE = 'Тип отчета',
  SALES = 'Продажа',
  LOYALTY_COMPENSATION = 'В том числе Компенсация скидки по программе лояльности',
  TO_TRANSFER = 'К перечислению за товар',
  AGREED_DISCOUNT = 'Согласованная скидка, %',
  LOGISTICS_COST = 'Стоимость логистики',
  STORAGE_COST = 'Стоимость хранения',
  ACCEPTANCE_COST = 'Стоимость операций на приемке',
  OTHER_CHARGES = 'Прочие удержания/выплаты',
  TOTAL_FINES = 'Общая сумма штрафов',
  VV_CORRECTION = 'Корректировка Вознаграждения Вайлдберриз (ВВ)',
  LOYALTY_PROGRAM_COST = 'Стоимость участия в программе лояльности',
  LOYALTY_POINTS_DEDUCTION = 'Сумма удержанная за начисленные баллы программы лояльности',
  PAYMENT_TERM_CHANGE = 'Разовое изменение срока перечисления денежных средств',
  TOTAL_TO_PAY = 'Итого к оплате',
  CURRENCY = 'Валюта',
}

export type WeeklyReportRow = Record<WeeklyReportColumns, any>;

export function parseWeeklyReportExcel(buffer: Buffer): WeeklyReportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  return data as WeeklyReportRow[];
}

export function toNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export function toDate(value: any): Date | null {
  if (!value) return null;

  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value);
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
