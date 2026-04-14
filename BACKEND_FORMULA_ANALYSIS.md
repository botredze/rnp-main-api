# Анализ расчётов P&L в бэкенде (NestJS)

**Версия бэка:** после правок от 27.03.2026
**Порт:** 3005 | **БД:** data-metrics (PostgreSQL)

---

## Архитектура расчётов

```
finance_reports (детальные транзакции WB)   weekly_finance_reports (еженедельный отчёт WB)
       ↓                                              ↓
FinanceReportsRepository                   WeeklyFinanceReportRepository
       ↓                                              ↓
            ReportsUseCase.getOrganizationDashboard()
                           ↓
                     HTTP GET /reports/dashboard
```

**Два источника данных, которые нельзя объединить в одном SQL-запросе:**
- `finance_reports` — детальные транзакции (Продажа/Возврат/Логистика)
- `weekly_finance_reports` — агрегированные данные (хранение, штрафы, приёмка, удержания)

---

## Шаг 1 — Выручка (SQL в `getDetailedSalesStats`)

```sql
-- Выручка = продажи − возвраты по цене розничной со скидкой
revenue = SUM(wb_sale_amount WHERE document_type = 'Продажа')
        - SUM(wb_sale_amount WHERE document_type = 'Возврат')
```

Фильтр: `WHERE p.organization_id = $1 AND fr.sale_date BETWEEN $2 AND $3`

---

## Шаг 2 — К перечислению (SQL)

```sql
-- sellerPayout = выплата WB за продажи − выплата за возвраты
-- seller_payout per строка = wb_sale_amount − комиссия WB − эквайринг
sellerPayout = SUM(seller_payout WHERE document_type = 'Продажа')
             - SUM(seller_payout WHERE document_type = 'Возврат')
```

**Важно:** `seller_payout` из WB-отчёта **уже вычитает** комиссию и эквайринг.
Логистика, хранение, штрафы в этом поле **НЕ отражены** — они идут отдельными строками.

---

## Шаг 3 — Комиссия WB и Эквайринг (SQL)

```sql
-- Суммарная "комиссия" = всё что WB удержал из выручки до выплаты
wbCommission = revenue - sellerPayout
             = (Комиссия_WB_чистая + Эквайринг)

-- Эквайринг выделен отдельно
acquiring = SUM(acquiring_fee WHERE document_type = 'Продажа')
          - SUM(acquiring_fee WHERE document_type = 'Возврат')

-- Чистая комиссия WB (без эквайринга) — для отображения
commission = wbCommission - acquiring
```

---

## Шаг 4 — Логистика (SQL)

```sql
-- Итого логистика
deliveryCost = SUM(delivery_services_cost WHERE document_type = 'Логистика')

-- Прямая (доставки к покупателю)
deliveryCostForward = SUM(delivery_services_cost
                         WHERE document_type = 'Логистика'
                         AND (return_count = 0 OR return_count IS NULL))

-- Обратная (возвраты от покупателя)
deliveryCostReturn  = SUM(delivery_services_cost
                         WHERE document_type = 'Логистика'
                         AND return_count > 0)
```

---

## Шаг 5 — Данные из еженедельного отчёта (SQL в `getDashboardMetrics`)

Из таблицы `weekly_finance_reports`:

```
totalStorage       = SUM(storage_cost)     — хранение
totalFines         = SUM(total_fines)      — штрафы
totalAcceptanceCost = SUM(acceptance_cost) — платная приёмка
totalOtherCharges  = SUM(other_charges)    — прочие удержания
```

---

## Шаг 6 — Себестоимость (SQL LATERAL JOIN в `getCostPriceForPeriod`)

```sql
totalCostPrice = SUM(
  CASE
    WHEN cost.size IS NOT NULL         -- есть размерная себестоимость
      THEN cost.cost_price × report.quantity
    WHEN product_cost.cost_price IS NOT NULL  -- есть себестоимость на артикул
      THEN product_cost.cost_price × report.quantity
    ELSE 0
  END
)
```

Источник: таблица `product_cost_prices`, актуальная запись на дату транзакции (LATERAL + ORDER BY date DESC LIMIT 1).

---

## Шаг 7 — Внешние расходы (SQL в `OtherExpensesRepository.getTotalForPeriod`)

```sql
externalExpenses = SELECT SUM(amount)
                   FROM other_expenses
                   WHERE organization_id = $1
                     AND status = 'ACTIVE'
                     AND date BETWEEN $2 AND $3
```

---

## Шаг 8 — Оплата на Р/С (TypeScript в `ReportsUseCase`)

```typescript
// Оплата на Р/С = К перечислению − логистика − хранение − штрафы − приёмка − удержания
const totalToReceive = sellerPayout - delivery - fines - acceptance - otherDeductions - storage;
```

---

## Шаг 9 — Налог (TypeScript)

```typescript
// taxRate передаётся как query-параметр ?taxRate=0.02
// По умолчанию = 0 (налог не учитывается)
const tax = totalToReceive * (taxRate ?? 0);
```

Налог считается **от Оплаты на Р/С** (аналог "Считать от РС" в Excel).

---

## Шаг 10 — Чистая прибыль (TypeScript)

```typescript
// ЧП = Оплата на Р/С − налог − себестоимость − внешние расходы
const netProfit = totalToReceive - tax - totalCostPrice - externalExpenses;
```

---

## Шаг 11 — Производные метрики (TypeScript)

```typescript
const wbDeductions = wbCommission + delivery + storage + fines + acceptance + otherDeductions;
const marginality  = revenue > 0 ? (netProfit / revenue) * 100 : 0;
const totalCosts   = wbDeductions + totalCostPrice + tax + externalExpenses;
const roi          = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
```

---

## API Endpoints

### GET /reports/dashboard
```
Query params:
  organizationId  (number, required)
  startDate       (string YYYY-MM-DD, optional)
  endDate         (string YYYY-MM-DD, optional)
  taxRate         (number 0–1, optional, default 0)  ← напр. 0.02 для УСН 2%

Пример: GET /reports/dashboard?organizationId=1&startDate=2026-03-09&endDate=2026-03-15&taxRate=0.02
```

### GET /reports/summary
```
Query params: те же + taxRate
```

---

## Полная таблица метрик дашборда

| Метрика | Источник | Формула |
|---------|---------|---------|
| Выручка | finance_reports SQL | SUM(wb_sale_amount) Продажа − Возврат |
| К перечислению | finance_reports SQL | SUM(seller_payout) Продажа − Возврат |
| Комиссия WB | вычисляемое | wbCommission − acquiring |
| Эквайринг | finance_reports SQL | SUM(acquiring_fee) Продажа − Возврат |
| Логистика | finance_reports SQL | SUM(delivery_services_cost) WHERE Логистика |
| Логистика доставок | finance_reports SQL | то же, return_count = 0 |
| Логистика возвратов | finance_reports SQL | то же, return_count > 0 |
| Хранение | weekly_finance_reports SQL | SUM(storage_cost) |
| Штрафы | weekly_finance_reports SQL | SUM(total_fines) |
| Приёмка | weekly_finance_reports SQL | SUM(acceptance_cost) |
| Удержания | weekly_finance_reports SQL | SUM(other_charges) |
| Себестоимость | product_cost_prices LATERAL | cost_price × quantity |
| **Оплата на Р/С** | TypeScript | sellerPayout − delivery − хранение − штрафы − приёмка − удержания |
| Налог | TypeScript | Оплата на Р/С × taxRate |
| Внешние расходы | other_expenses SQL | SUM(amount) WHERE ACTIVE AND date IN period |
| **Чистая прибыль** | TypeScript | Оплата на Р/С − налог − себестоимость − внешние расходы |
| Маржинальность | TypeScript | ЧП / Выручка × 100 |
| ROI | TypeScript | ЧП / (все_удержания_WB + себестоимость + налог + внешние_расходы) × 100 |

---

## Отличия от Excel

### Совпадает ✅
- Формула выручки (wb_sale_amount продажи − возвраты)
- Формула комиссии WB (revenue − sellerPayout)
- Логистика (sum delivery_services_cost WHERE Логистика)
- Себестоимость (per-SKU LATERAL lookup с историей цен)
- Оплата на Р/С (после правок)
- Чистая прибыль (после правок)

### Отличается ⚠️

| Аспект | Excel | Бэкенд |
|--------|-------|--------|
| **Ставка налога** | Хардкод 2% в файле (Dashboard!G4) | Query-параметр `taxRate`, по умолчанию 0 |
| **Внешние расходы** | Распределяются пропорционально выручке SKU | Суммируются по `other_expenses` за период (без разбивки по SKU) |
| **Хранение** | Пропорционально распределяется по SKU из отдельного файла | Берётся агрегатом из `weekly_finance_reports.storage_cost` |
| **Прочие удержания** | Разбиты на 6 категорий (продвижение, транзит, Джем, утилизация, отзыв, прочее) | Одно поле `otherCharges` из еженедельного отчёта |
| **Самовыкупы** | Отдельный лист, учитывается в ЧП | Не реализовано |
| **Логистика доставок/возвратов** | Считается по признаку типа доставки из `CR` | По полю `return_count` |
| **СПП %** | (Выручка − WB_реализовал) / Выручка | Не реализовано |
| **Выкуп %** | Выкупы / (Выкупы + Отмены) | Не реализовано |
| **ABC анализ** | Есть (лист ABC) | Не реализовано |

### Было исправлено (27.03.2026) 🔧

| Что | Было (баг) | Стало (исправлено) |
|-----|-----------|-------------------|
| Оплата на Р/С | `sellerPayout − штрафы − хранение − приёмка − удержания` (логистика НЕ вычиталась) | `sellerPayout − **логистика** − штрафы − хранение − приёмка − удержания` |
| Налог | Не считался | `totalToReceive × taxRate` (0 по умолчанию) |
| Внешние расходы | Не вычитались из ЧП | `totalToReceive − налог − себестоимость − **внешние расходы**` |
| Эквайринг | Скрыт внутри wbCommission | Выделен отдельной метрикой |
| Логистика | Одна цифра | Разбита на прямую + обратную |
| Разница ЧП | ~1 371 378 руб. (завышена на 946 420) | ~424 958 руб. (соответствует Excel) |
