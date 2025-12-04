import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  //   async getDailyAnalytics(startDate: string, endDate: string, productId: number) {
  //     const query = `
  // WITH dates AS (
  //     SELECT generate_series(
  //         $1::date,
  //         $2::date,
  //         INTERVAL '1 day'
  //     )::date AS date
  // ),
  //
  // sales_daily AS (
  //     SELECT
  //         s.date::date AS day,
  //         SUM(s.for_pay)::numeric AS sales_total_amount,
  //         COUNT(s.id)::int AS sales_total_count
  //     FROM sales s
  //     WHERE s.product_id = $3
  //       AND s.is_cansel = false
  //     GROUP BY s.date::date
  // ),
  //
  // orders_daily AS (
  //     SELECT
  //         o.date::date AS day,
  //         COUNT(o.id)::int AS orders_count,
  //         SUM(o.total_price)::numeric AS orders_amount,
  //         COALESCE(SUM(s2.count), 0)::int AS sales_count_for_orders
  //     FROM orders o
  //     LEFT JOIN (
  //         SELECT s.date::date AS day, COUNT(s.id) AS count
  //         FROM sales s
  //         WHERE s.product_id = $3
  //           AND s.is_cansel = false
  //         GROUP BY 1
  //     ) s2 ON s2.day = o.date::date
  //     WHERE o.product_id = $3
  //       AND o.is_cancel = false
  //     GROUP BY 1
  // ),
  //
  // history_daily AS (
  //     SELECT
  //         DATE_TRUNC('day', h.date)::date AS day,
  //         SUM(h.open_card_count)::int AS open_card_count,
  //         SUM(h.add_to_card_count)::int AS add_to_card_count,
  //         SUM(h.orders_count)::int AS history_orders_count,
  //         SUM(h.order_sum_rub)::numeric AS order_sum_rub,
  //         SUM(h.buy_out_count)::int AS buy_out_count,
  //         SUM(h.buy_out_sum_rub)::numeric AS buy_out_sum_rub,
  //         ROUND(AVG(h.buy_out_percent), 2) AS avg_buy_out_percent,
  //         ROUND(AVG(h.add_to_card_conversion), 2) AS avg_add_to_card_conversion,
  //         ROUND(AVG(h.card_to_order_conversion), 2) AS avg_card_to_order_conversion,
  //         ROUND(AVG(h.add_to_with_list), 2) AS avg_add_to_wishlist
  //     FROM history h
  //     WHERE h.product_id = $3
  //     GROUP BY 1
  // ),
  //
  // stock_daily AS (
  //     SELECT
  //         DATE(sc.date) AS day,
  //         SUM(sc.stock_count) AS stock_count,
  //         SUM(sc.stock_sum) AS stock_sum,
  //         AVG(sc.avg_orders_by_mouth) AS avg_orders_by_mouth,
  //         SUM(sc.quantity) AS quantity,
  //         SUM(sc.quantity_full) AS stock_total
  //     FROM stock_counts sc
  //     WHERE sc.product_id = $3
  //     GROUP BY 1
  // ),
  //
  // adv_daily AS (
  //     SELECT
  //         ads.date::date AS day,
  //         SUM(nm.sum) AS adv_spend,
  //         SUM(nm.views) AS adv_views,
  //         SUM(nm.clicks) AS adv_clicks,
  //         SUM(nm.atbs) AS adv_atbs,
  //         SUM(nm.orders) AS adv_orders,
  //         SUM(nm.cpc) AS cpc,
  //         SUM(nm.ctr) AS ctr,
  //         SUM(nm.cpc) AS cpo
  //     FROM advertising_day_statistic ads
  //     LEFT JOIN advertising_day_app app ON app.day_statistic_id = ads.id
  //     LEFT JOIN advertising_day_app_nm nm ON nm.app_statistic_id = app.id
  //     WHERE nm.product_id = $3
  //     GROUP BY ads.date
  // ),
  //
  // turnover AS (
  //     SELECT
  //         -- среднее число продаж за последние 5 дней
  //         (SELECT AVG(sales_total_count)
  //          FROM (
  //              SELECT sales_total_count
  //              FROM sales_daily
  //              WHERE sales_total_count > 0
  //              ORDER BY day DESC
  //              LIMIT 5
  //          ) AS last5) AS avg_sales_per_day,
  //
  //         -- средний процент выкупа за последние 5 дней
  //         (SELECT AVG(COALESCE(buy_out_percent, 0)) / 100.0
  //          FROM (
  //              SELECT avg_buy_out_percent AS buy_out_percent
  //              FROM history_daily
  //              ORDER BY day DESC
  //              LIMIT 5
  //          ) AS last5_buyout) AS avg_buy_out_ratio,
  //
  //         -- последний остаток на складе
  //         (SELECT stock_count
  //          FROM (
  //              SELECT stock_count
  //              FROM stock_daily
  //              ORDER BY day DESC
  //              LIMIT 1
  //          ) AS last_stock) AS last_stock_total,
  //
  //         CURRENT_DATE AS today
  // )
  //
  // SELECT
  //     d.date,
  //     COALESCE(s.sales_total_amount, 0) AS sales_total_amount,
  //     COALESCE(s.sales_total_count, 0) AS sales_total_count,
  //
  //     COALESCE(o.orders_amount, 0) AS orders_amount,
  //     COALESCE(o.orders_count, 0) AS orders_count,
  //     COALESCE(o.sales_count_for_orders, 0) AS orders_sales_count,
  //
  //     COALESCE(h.open_card_count, 0) AS open_card_count,
  //     COALESCE(h.add_to_card_count, 0) AS add_to_card_count,
  //     COALESCE(h.history_orders_count, 0) AS history_orders_count,
  //     COALESCE(h.order_sum_rub, 0) AS order_sum_rub,
  //     COALESCE(h.buy_out_count, 0) AS buy_out_count,
  //     COALESCE(h.buy_out_sum_rub, 0) AS buy_out_sum_rub,
  //     COALESCE(h.avg_buy_out_percent, 0) AS avg_buy_out_percent,
  //     COALESCE(h.avg_add_to_card_conversion, 0) AS avg_add_to_card_conversion,
  //     COALESCE(h.avg_card_to_order_conversion, 0) AS avg_card_to_order_conversion,
  //     COALESCE(h.avg_add_to_wishlist, 0) AS avg_add_to_wishlist,
  //
  //     COALESCE(st.stock_total, 0) AS stock_total,
  //
  //     COALESCE(a.adv_spend, 0) AS adv_spend,
  //     COALESCE(a.adv_views, 0) AS adv_views,
  //     COALESCE(a.adv_clicks, 0) AS adv_clicks,
  //     COALESCE(a.adv_atbs, 0) AS adv_atbs,
  //     COALESCE(a.adv_orders, 0) AS adv_orders,
  //     COALESCE(a.cpc, 0) AS cpc,
  //     COALESCE(a.ctr, 0) AS ctr,
  //     COALESCE(a.cpo, 0) AS cpo,
  //     COALESCE(st.stock_count, 0) AS stock_count,
  //     COALESCE(st.stock_sum, 0) AS stock_sum,
  //     COALESCE(st.avg_orders_by_mouth, 0) AS avg_orders_by_mouth,
  //     COALESCE(h.open_card_count, 0) - COALESCE(a.adv_clicks, 0) AS organic_clicks,
  //
  //
  //     CASE
  //         WHEN t.avg_sales_per_day IS NULL OR t.avg_sales_per_day = 0 OR t.avg_buy_out_ratio = 0 THEN NULL
  //         ELSE ROUND(t.last_stock_total / (t.avg_sales_per_day * t.avg_buy_out_ratio))
  //     END AS days_to_finish,
  //
  //     CASE
  //         WHEN t.avg_sales_per_day IS NULL OR t.avg_sales_per_day = 0 OR t.avg_buy_out_ratio = 0 THEN NULL
  //         ELSE t.today + (t.last_stock_total / (t.avg_sales_per_day * t.avg_buy_out_ratio))::int
  //     END AS finish_date
  //
  // FROM dates d
  // LEFT JOIN sales_daily s ON s.day = d.date
  // LEFT JOIN orders_daily o ON o.day = d.date
  // LEFT JOIN history_daily h ON h.day = d.date
  // LEFT JOIN stock_daily st ON st.day = d.date
  // LEFT JOIN adv_daily a ON a.day = d.date
  // CROSS JOIN turnover t
  // ORDER BY d.date ASC;
  // `;
  //
  //     const result = await this.dataSource.query(query, [startDate, endDate, productId]);
  //
  //     const hasNonZero = result.some((row) =>
  //       Object.values(row).some((value) => typeof value === 'number' && value !== 0),
  //     );
  //
  //     return hasNonZero ? result : [];
  //   }

  async getDailyAnalytics(startDate: string, endDate: string, productId: number) {
    const query = `
WITH dates AS (
    SELECT generate_series(
        $1::date,
        $2::date,
        INTERVAL '1 day'
    )::date AS date
),

sales_daily AS (
    SELECT 
        s.date::date AS day,
        SUM(s.for_pay)::numeric AS sales_total_amount,
        COUNT(s.id)::int AS sales_total_count
    FROM sales s
    WHERE s.product_id = $3 
      AND s.is_cansel = false
    GROUP BY s.date::date
),

orders_daily AS (
    SELECT
        o.date::date AS day,
        COUNT(o.id)::int AS orders_count,
        SUM(o.total_price)::numeric AS orders_amount,
        COALESCE(SUM(s2.count), 0)::int AS sales_count_for_orders
    FROM orders o
    LEFT JOIN (
        SELECT s.date::date AS day, COUNT(s.id) AS count
        FROM sales s
        WHERE s.product_id = $3
          AND s.is_cansel = false
        GROUP BY 1
    ) s2 ON s2.day = o.date::date
    WHERE o.product_id = $3
      AND o.is_cancel = false
    GROUP BY 1
),

history_daily AS (
    SELECT 
        DATE_TRUNC('day', h.date)::date AS day,
        SUM(h.open_card_count)::int AS open_card_count,
        SUM(h.add_to_card_count)::int AS add_to_card_count,
        SUM(h.orders_count)::int AS history_orders_count,
        SUM(h.order_sum_rub)::numeric AS order_sum_rub,
        SUM(h.buy_out_count)::int AS buy_out_count,
        SUM(h.buy_out_sum_rub)::numeric AS buy_out_sum_rub,
        ROUND(AVG(h.buy_out_percent), 2) AS avg_buy_out_percent,
        ROUND(AVG(h.add_to_card_conversion), 2) AS avg_add_to_card_conversion,
        ROUND(AVG(h.card_to_order_conversion), 2) AS avg_card_to_order_conversion,
        ROUND(AVG(h.add_to_with_list), 2) AS avg_add_to_wishlist
    FROM history h
    WHERE h.product_id = $3
    GROUP BY 1
),

stock_daily AS (
    SELECT
        DATE(sc.date) AS day,
        SUM(sc.stock_count) AS stock_count,
        SUM(sc.stock_sum) AS stock_sum,
        AVG(sc.avg_orders_by_mouth) AS avg_orders_by_mouth,
        SUM(sc.quantity) AS quantity,
        SUM(sc.quantity_full) AS stock_total
    FROM stock_counts sc
    WHERE sc.product_id = $3
    GROUP BY 1
),

adv_daily AS (
    SELECT 
        ads.date::date AS day,
        SUM(nm.sum) AS adv_spend,
        SUM(nm.views) AS adv_views,
        SUM(nm.clicks) AS adv_clicks,
        SUM(nm.atbs) AS adv_atbs,
        SUM(nm.orders) AS adv_orders,
        SUM(nm.cpc) AS cpc,
        SUM(nm.ctr) AS ctr,
        SUM(nm.cpc) AS cpo
    FROM advertising_day_statistic ads
    LEFT JOIN advertising_day_app app ON app.day_statistic_id = ads.id
    LEFT JOIN advertising_day_app_nm nm ON nm.app_statistic_id = app.id
    WHERE nm.product_id = $3
    GROUP BY ads.date
),

sales_with_moving_avg AS (
    SELECT
        day,
        sales_total_count,
        AVG(sales_total_count) OVER (
            ORDER BY day
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ) AS avg_sales_per_day
    FROM sales_daily
    WHERE sales_total_count > 0
),

history_with_moving_avg AS (
    SELECT
        day,
        avg_buy_out_percent,
        AVG(COALESCE(avg_buy_out_percent, 0)) OVER (
            ORDER BY day
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ) / 100.0 AS avg_buy_out_ratio
    FROM history_daily
)

SELECT 
    d.date,
    COALESCE(s.sales_total_amount, 0) AS sales_total_amount,
    COALESCE(s.sales_total_count, 0) AS sales_total_count,

    COALESCE(o.orders_amount, 0) AS orders_amount,
    COALESCE(o.orders_count, 0) AS orders_count,
    COALESCE(o.sales_count_for_orders, 0) AS orders_sales_count,

    COALESCE(h.open_card_count, 0) AS open_card_count,
    COALESCE(h.add_to_card_count, 0) AS add_to_card_count,
    COALESCE(h.history_orders_count, 0) AS history_orders_count,
    COALESCE(h.order_sum_rub, 0) AS order_sum_rub,
    COALESCE(h.buy_out_count, 0) AS buy_out_count,
    COALESCE(h.buy_out_sum_rub, 0) AS buy_out_sum_rub,
    COALESCE(h.avg_buy_out_percent, 0) AS avg_buy_out_percent,
    COALESCE(h.avg_add_to_card_conversion, 0) AS avg_add_to_card_conversion,
    COALESCE(h.avg_card_to_order_conversion, 0) AS avg_card_to_order_conversion,
    COALESCE(h.avg_add_to_wishlist, 0) AS avg_add_to_wishlist,

    COALESCE(st.stock_total, 0) AS stock_total,

    COALESCE(a.adv_spend, 0) AS adv_spend,
    COALESCE(a.adv_views, 0) AS adv_views,
    COALESCE(a.adv_clicks, 0) AS adv_clicks,
    COALESCE(a.adv_atbs, 0) AS adv_atbs,
    COALESCE(a.adv_orders, 0) AS adv_orders,
    COALESCE(a.cpc, 0) AS cpc,
    COALESCE(a.ctr, 0) AS ctr,
    COALESCE(a.cpo, 0) AS cpo,
    COALESCE(st.stock_count, 0) AS stock_count,
    COALESCE(st.stock_sum, 0) AS stock_sum,
    COALESCE(st.avg_orders_by_mouth, 0) AS avg_orders_by_mouth, 
    COALESCE(h.open_card_count, 0) - COALESCE(a.adv_clicks, 0) AS organic_clicks,

    CASE 
        WHEN sma.avg_sales_per_day IS NULL OR sma.avg_sales_per_day = 0 OR hma.avg_buy_out_ratio = 0 OR st.stock_count IS NULL THEN NULL
        ELSE ROUND(st.stock_count / (sma.avg_sales_per_day * hma.avg_buy_out_ratio))
    END AS days_to_finish,

    CASE
        WHEN sma.avg_sales_per_day IS NULL OR sma.avg_sales_per_day = 0 OR hma.avg_buy_out_ratio = 0 OR st.stock_count IS NULL THEN NULL
        ELSE d.date + (st.stock_count / (sma.avg_sales_per_day * hma.avg_buy_out_ratio))::int
    END AS finish_date

FROM dates d
LEFT JOIN sales_daily s ON s.day = d.date
LEFT JOIN orders_daily o ON o.day = d.date
LEFT JOIN history_daily h ON h.day = d.date
LEFT JOIN stock_daily st ON st.day = d.date
LEFT JOIN adv_daily a ON a.day = d.date
LEFT JOIN sales_with_moving_avg sma ON sma.day = d.date
LEFT JOIN history_with_moving_avg hma ON hma.day = d.date
ORDER BY d.date ASC;
`;

    const result = await this.dataSource.query(query, [startDate, endDate, productId]);

    const hasNonZero = result.some((row) =>
      Object.values(row).some((value) => typeof value === 'number' && value !== 0),
    );

    return hasNonZero ? result : [];
  }

  async getProductByIdMetric(productId: number) {
    const query = `
   WITH last_date AS (
    SELECT MAX(date) AS last_date
    FROM stock_counts
    WHERE product_id = $1
),

-- Остаток по размерам на последнюю дату
sizes AS (
    SELECT
        sc.tech_size,
        SUM(sc.quantity) AS qty
    FROM stock_counts sc
    CROSS JOIN last_date ld
    WHERE sc.product_id = $1
      AND sc.date = ld.last_date
    GROUP BY sc.tech_size
),

-- Общее количество продукта на складе на последнюю дату
total_quantity AS (
    SELECT SUM(quantity) AS total_qty
    FROM stock_counts sc
    CROSS JOIN last_date ld
    WHERE sc.product_id = $1
      AND sc.date = ld.last_date
),

-- Средняя цена продажи за последние 5 дней (не отменённые)
avg_price AS (
    SELECT AVG(s.for_pay) AS avg_for_pay
    FROM sales s
    WHERE s.product_id = $1
      AND s.is_cansel = false
      AND s.date >= (
            SELECT MAX(date) - INTERVAL '5 days'
            FROM sales
            WHERE product_id = $1
      )
),

-- Средний процент выкупа за последние 5 дней
avg_buyout AS (
    SELECT AVG(h.buy_out_percent) AS avg_buy_out_percent
    FROM history h
    WHERE h.product_id = $1
      AND h.date >= (
            SELECT MAX(date) - INTERVAL '5 days'
            FROM history
            WHERE product_id = $1
      )
)

SELECT
    (SELECT json_agg(json_build_object('size', tech_size, 'quantity', qty)) FROM sizes) AS sizes_left,
    (SELECT total_qty * avg_for_pay FROM total_quantity, avg_price) AS capitalization_rub,
    (SELECT avg_buy_out_percent FROM avg_buyout) AS avg_buy_out_percent_5_days;
`;

    const result = await this.dataSource.query(query, [productId]);

    return result[0];
  }
}
