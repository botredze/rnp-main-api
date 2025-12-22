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
  // history_daily AS (
  //     SELECT
  //         DATE_TRUNC('day', h.date)::date AS day,
  //         SUM(h.open_card_count)::int AS open_card_count,
  //         SUM(h.add_to_card_count)::int AS add_to_card_count,
  //         SUM(h.orders_count)::int AS orders_count,
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
  //         CASE
  //             WHEN SUM(nm.clicks) > 0 THEN ROUND((SUM(nm.sum) / SUM(nm.clicks))::numeric, 2)
  //             ELSE 0
  //         END AS cpc,
  //         CASE
  //             WHEN SUM(nm.views) > 0 THEN ROUND(((SUM(nm.clicks)::numeric / SUM(nm.views)) * 100), 2)
  //             ELSE 0
  //         END AS ctr,
  //         CASE
  //             WHEN SUM(nm.orders) > 0 THEN ROUND((SUM(nm.sum) / SUM(nm.orders))::numeric, 2)
  //             ELSE 0
  //         END AS cpo
  //     FROM advertising_day_statistic ads
  //     INNER JOIN advertising_day_app app ON app.day_statistic_id = ads.id
  //     INNER JOIN advertising_day_app_nm nm ON nm.app_statistic_id = app.id
  //     WHERE nm.product_id = $3
  //     GROUP BY ads.date
  // ),
  //
  // sales_with_moving_avg AS (
  //     SELECT
  //         day,
  //         buy_out_count,
  //         AVG(buy_out_count) OVER (
  //             ORDER BY day
  //             ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
  //         ) AS avg_sales_per_day
  //     FROM history_daily
  //     WHERE buy_out_count > 0
  // ),
  //
  // history_with_moving_avg AS (
  //     SELECT
  //         day,
  //         avg_buy_out_percent,
  //         AVG(COALESCE(avg_buy_out_percent, 0)) OVER (
  //             ORDER BY day
  //             ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
  //         ) / 100.0 AS avg_buy_out_ratio
  //     FROM history_daily
  // ),
  //
  // daily_data AS (
  //     SELECT
  //         d.date,
  //
  //         -- Продажи
  //         COALESCE(h.buy_out_sum_rub, 0) AS sales_total_amount,
  //         COALESCE(h.buy_out_count, 0) AS sales_total_count,
  //
  //         -- Заказы
  //         COALESCE(h.order_sum_rub, 0) AS orders_amount,
  //         COALESCE(h.orders_count, 0) AS orders_count,
  //         COALESCE(h.buy_out_count, 0) AS orders_sales_count,
  //
  //         -- История
  //         COALESCE(h.open_card_count, 0) AS open_card_count,
  //         COALESCE(h.add_to_card_count, 0) AS add_to_card_count,
  //         COALESCE(h.orders_count, 0) AS history_orders_count,
  //         COALESCE(h.order_sum_rub, 0) AS order_sum_rub,
  //         COALESCE(h.buy_out_count, 0) AS buy_out_count,
  //         COALESCE(h.buy_out_sum_rub, 0) AS buy_out_sum_rub,
  //         COALESCE(h.avg_buy_out_percent, 0) AS avg_buy_out_percent,
  //         COALESCE(h.avg_add_to_card_conversion, 0) AS avg_add_to_card_conversion,
  //         COALESCE(h.avg_card_to_order_conversion, 0) AS avg_card_to_order_conversion,
  //         COALESCE(h.avg_add_to_wishlist, 0) AS avg_add_to_wishlist,
  //
  //         -- Остатки
  //         COALESCE(st.stock_total, 0) AS stock_total,
  //         COALESCE(st.stock_count, 0) AS stock_count,
  //         COALESCE(st.stock_sum, 0) AS stock_sum,
  //         COALESCE(st.avg_orders_by_mouth, 0) AS avg_orders_by_mouth,
  //
  //         -- Реклама
  //         COALESCE(a.adv_spend, 0) AS adv_spend,
  //         COALESCE(a.adv_views, 0) AS adv_views,
  //         COALESCE(a.adv_clicks, 0) AS adv_clicks,
  //         COALESCE(a.adv_atbs, 0) AS adv_atbs,
  //         COALESCE(a.adv_orders, 0) AS adv_orders,
  //         COALESCE(a.cpc, 0) AS cpc,
  //         COALESCE(a.ctr, 0) AS ctr,
  //         COALESCE(a.cpo, 0) AS cpo,
  //
  //         -- Органические клики
  //         COALESCE(h.open_card_count, 0) - COALESCE(a.adv_clicks, 0) AS organic_clicks,
  //
  //         -- Прогнозы
  //         CASE
  //             WHEN sma.avg_sales_per_day IS NULL OR sma.avg_sales_per_day = 0 OR hma.avg_buy_out_ratio = 0 OR st.stock_count IS NULL THEN NULL
  //             ELSE ROUND(st.stock_count / (sma.avg_sales_per_day * hma.avg_buy_out_ratio))
  //         END AS days_to_finish,
  //
  //         CASE
  //             WHEN sma.avg_sales_per_day IS NULL OR sma.avg_sales_per_day = 0 OR hma.avg_buy_out_ratio = 0 OR st.stock_count IS NULL THEN NULL
  //             ELSE d.date + (st.stock_count / (sma.avg_sales_per_day * hma.avg_buy_out_ratio))::int
  //         END AS finish_date
  //
  //     FROM dates d
  //     LEFT JOIN history_daily h ON h.day = d.date
  //     LEFT JOIN stock_daily st ON st.day = d.date
  //     LEFT JOIN adv_daily a ON a.day = d.date
  //     LEFT JOIN sales_with_moving_avg sma ON sma.day = d.date
  //     LEFT JOIN history_with_moving_avg hma ON hma.day = d.date
  // ),
  //
  // daily_with_changes AS (
  //     SELECT
  //         date,
  //
  //         -- Продажи
  //         sales_total_amount,
  //         percent_change(
  //             sales_total_amount,
  //             LAG(sales_total_amount) OVER w
  //         ) AS sales_total_amount_change_percent,
  //
  //         sales_total_count,
  //         percent_change(
  //             sales_total_count,
  //             LAG(sales_total_count) OVER w
  //         ) AS sales_total_count_change_percent,
  //
  //         -- Заказы
  //         orders_amount,
  //         percent_change(
  //             orders_amount,
  //             LAG(orders_amount) OVER w
  //         ) AS orders_amount_change_percent,
  //
  //         orders_count,
  //         percent_change(
  //             orders_count,
  //             LAG(orders_count) OVER w
  //         ) AS orders_count_change_percent,
  //
  //         orders_sales_count,
  //         percent_change(
  //             orders_sales_count,
  //             LAG(orders_sales_count) OVER w
  //         ) AS orders_sales_count_change_percent,
  //
  //         -- История
  //         open_card_count,
  //         percent_change(
  //             open_card_count,
  //             LAG(open_card_count) OVER w
  //         ) AS open_card_count_change_percent,
  //
  //         add_to_card_count,
  //         percent_change(
  //             add_to_card_count,
  //             LAG(add_to_card_count) OVER w
  //         ) AS add_to_card_count_change_percent,
  //
  //         history_orders_count,
  //         percent_change(
  //             history_orders_count,
  //             LAG(history_orders_count) OVER w
  //         ) AS history_orders_count_change_percent,
  //
  //         order_sum_rub,
  //         percent_change(
  //             order_sum_rub,
  //             LAG(order_sum_rub) OVER w
  //         ) AS order_sum_rub_change_percent,
  //
  //         buy_out_count,
  //         percent_change(
  //             buy_out_count,
  //             LAG(buy_out_count) OVER w
  //         ) AS buy_out_count_change_percent,
  //
  //         buy_out_sum_rub,
  //         percent_change(
  //             buy_out_sum_rub,
  //             LAG(buy_out_sum_rub) OVER w
  //         ) AS buy_out_sum_rub_change_percent,
  //
  //         avg_buy_out_percent,
  //         percent_change(
  //             avg_buy_out_percent,
  //             LAG(avg_buy_out_percent) OVER w
  //         ) AS avg_buy_out_percent_change_percent,
  //
  //         avg_add_to_card_conversion,
  //         percent_change(
  //             avg_add_to_card_conversion,
  //             LAG(avg_add_to_card_conversion) OVER w
  //         ) AS avg_add_to_card_conversion_change_percent,
  //
  //         avg_card_to_order_conversion,
  //         percent_change(
  //             avg_card_to_order_conversion,
  //             LAG(avg_card_to_order_conversion) OVER w
  //         ) AS avg_card_to_order_conversion_change_percent,
  //
  //         avg_add_to_wishlist,
  //         percent_change(
  //             avg_add_to_wishlist,
  //             LAG(avg_add_to_wishlist) OVER w
  //         ) AS avg_add_to_wishlist_change_percent,
  //
  //         -- Остатки
  //         stock_total,
  //         percent_change(
  //             stock_total,
  //             LAG(stock_total) OVER w
  //         ) AS stock_total_change_percent,
  //
  //         stock_count,
  //         percent_change(
  //             stock_count,
  //             LAG(stock_count) OVER w
  //         ) AS stock_count_change_percent,
  //
  //         stock_sum,
  //         percent_change(
  //             stock_sum,
  //             LAG(stock_sum) OVER w
  //         ) AS stock_sum_change_percent,
  //
  //         avg_orders_by_mouth,
  //         percent_change(
  //             avg_orders_by_mouth,
  //             LAG(avg_orders_by_mouth) OVER w
  //         ) AS avg_orders_by_mouth_change_percent,
  //
  //         -- Реклама
  //         adv_spend,
  //         percent_change(
  //             adv_spend,
  //             LAG(adv_spend) OVER w
  //         ) AS adv_spend_change_percent,
  //
  //         adv_views,
  //         percent_change(
  //             adv_views,
  //             LAG(adv_views) OVER w
  //         ) AS adv_views_change_percent,
  //
  //         adv_clicks,
  //         percent_change(
  //             adv_clicks,
  //             LAG(adv_clicks) OVER w
  //         ) AS adv_clicks_change_percent,
  //
  //         adv_atbs,
  //         percent_change(
  //             adv_atbs,
  //             LAG(adv_atbs) OVER w
  //         ) AS adv_atbs_change_percent,
  //
  //         adv_orders,
  //         percent_change(
  //             adv_orders,
  //             LAG(adv_orders) OVER w
  //         ) AS adv_orders_change_percent,
  //
  //         cpc,
  //         percent_change(
  //             cpc,
  //             LAG(cpc) OVER w
  //         ) AS cpc_change_percent,
  //
  //         ctr,
  //         percent_change(
  //             ctr,
  //             LAG(ctr) OVER w
  //         ) AS ctr_change_percent,
  //
  //         cpo,
  //         percent_change(
  //             cpo,
  //             LAG(cpo) OVER w
  //         ) AS cpo_change_percent,
  //
  //         organic_clicks,
  //         percent_change(
  //             organic_clicks,
  //             LAG(organic_clicks) OVER w
  //         ) AS organic_clicks_change_percent,
  //
  //         -- Прогнозы
  //         days_to_finish,
  //         finish_date
  //
  //     FROM daily_data
  //     WINDOW w AS (ORDER BY date)
  // )
  //
  //
  // -- Объединяем daily данные и TOTAL строку
  // SELECT * FROM daily_with_changes
  //
  // UNION ALL
  //
  // SELECT
  //     NULL AS date,
  //
  //     -- Суммы
  //     SUM(sales_total_amount) AS sales_total_amount,
  //     NULL AS sales_total_amount_change_percent,
  //
  //     SUM(sales_total_count) AS sales_total_count,
  //     NULL AS sales_total_count_change_percent,
  //
  //     SUM(orders_amount) AS orders_amount,
  //     NULL AS orders_amount_change_percent,
  //
  //     SUM(orders_count) AS orders_count,
  //     NULL AS orders_count_change_percent,
  //
  //     SUM(orders_sales_count) AS orders_sales_count,
  //     NULL AS orders_sales_count_change_percent,
  //
  //     SUM(open_card_count) AS open_card_count,
  //     NULL AS open_card_count_change_percent,
  //
  //     SUM(add_to_card_count) AS add_to_card_count,
  //     NULL AS add_to_card_count_change_percent,
  //
  //     SUM(history_orders_count) AS history_orders_count,
  //     NULL AS history_orders_count_change_percent,
  //
  //     SUM(order_sum_rub) AS order_sum_rub,
  //     NULL AS order_sum_rub_change_percent,
  //
  //     SUM(buy_out_count) AS buy_out_count,
  //     NULL AS buy_out_count_change_percent,
  //
  //     SUM(buy_out_sum_rub) AS buy_out_sum_rub,
  //     NULL AS buy_out_sum_rub_change_percent,
  //
  //     -- Средние
  //     ROUND(AVG(avg_buy_out_percent), 2) AS avg_buy_out_percent,
  //     NULL AS avg_buy_out_percent_change_percent,
  //
  //     ROUND(AVG(avg_add_to_card_conversion), 2) AS avg_add_to_card_conversion,
  //     NULL AS avg_add_to_card_conversion_change_percent,
  //
  //     ROUND(AVG(avg_card_to_order_conversion), 2) AS avg_card_to_order_conversion,
  //     NULL AS avg_card_to_order_conversion_change_percent,
  //
  //     ROUND(AVG(avg_add_to_wishlist), 2) AS avg_add_to_wishlist,
  //     NULL AS avg_add_to_wishlist_change_percent,
  //
  //     -- Последние значения остатков
  //     (SELECT stock_total FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS stock_total,
  //     NULL AS stock_total_change_percent,
  //
  //     (SELECT stock_count FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS stock_count,
  //     NULL AS stock_count_change_percent,
  //
  //     SUM(stock_sum) AS stock_sum,
  //     NULL AS stock_sum_change_percent,
  //
  //     ROUND(AVG(avg_orders_by_mouth), 2) AS avg_orders_by_mouth,
  //     NULL AS avg_orders_by_mouth_change_percent,
  //
  //     -- Реклама суммы
  //     SUM(adv_spend) AS adv_spend,
  //     NULL AS adv_spend_change_percent,
  //
  //     SUM(adv_views) AS adv_views,
  //     NULL AS adv_views_change_percent,
  //
  //     SUM(adv_clicks) AS adv_clicks,
  //     NULL AS adv_clicks_change_percent,
  //
  //     SUM(adv_atbs) AS adv_atbs,
  //     NULL AS adv_atbs_change_percent,
  //
  //     SUM(adv_orders) AS adv_orders,
  //     NULL AS adv_orders_change_percent,
  //
  //     -- Реклама средние
  //     ROUND(AVG(cpc), 2) AS cpc,
  //     NULL AS cpc_change_percent,
  //
  //     ROUND(AVG(ctr), 2) AS ctr,
  //     NULL AS ctr_change_percent,
  //
  //     ROUND(AVG(cpo), 2) AS cpo,
  //     NULL AS cpo_change_percent,
  //
  //     SUM(organic_clicks) AS organic_clicks,
  //     NULL AS organic_clicks_change_percent,
  //
  //     -- Прогнозы - последние значения
  //     (SELECT days_to_finish FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS days_to_finish,
  //     (SELECT finish_date FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS finish_date
  //
  // FROM daily_with_changes
  //
  // ORDER BY date ASC NULLS LAST;
  // `;
  //
  //     const result = await this.dataSource.query(query, [startDate, endDate, productId]);
  //
  //     const hasNonZero = result.some((row) =>
  //       Object.values(row).some((value) => {
  //         if (value == null || value instanceof Date) return false;
  //
  //         const numValue = typeof value === 'string' ? parseFloat(value) : value;
  //
  //         return typeof numValue === 'number' && !isNaN(numValue) && numValue !== 0;
  //       }),
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

history_daily AS (
    SELECT 
        DATE_TRUNC('day', h.date)::date AS day,
        SUM(h.open_card_count)::int AS open_card_count,
        SUM(h.add_to_card_count)::int AS add_to_card_count,
        SUM(h.orders_count)::int AS orders_count,
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

-- НОВЫЙ БЛОК: берем данные из stock_count_on_side
stock_on_side_daily AS (
    SELECT
        DATE(scos.date) AS day,
        SUM(scos.quantity_full) AS stock_total,
        SUM(scos.in_way_to_client) AS in_way_to_client,
        SUM(scos.in_way_from_client) AS in_way_from_client
    FROM stock_count_on_side scos
    WHERE scos.product_id = $3
    GROUP BY 1
),

stock_daily AS (
    SELECT
        DATE(sc.date) AS day,
        SUM(sc.stock_count) AS stock_count,
        SUM(sc.stock_sum) AS stock_sum,
        AVG(sc.avg_orders_by_mouth) AS avg_orders_by_mouth,
        SUM(sc.quantity) AS quantity
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
        CASE 
            WHEN SUM(nm.clicks) > 0 THEN ROUND((SUM(nm.sum) / SUM(nm.clicks))::numeric, 2)
            ELSE 0
        END AS cpc,
        CASE 
            WHEN SUM(nm.views) > 0 THEN ROUND(((SUM(nm.clicks)::numeric / SUM(nm.views)) * 100), 2)
            ELSE 0
        END AS ctr,
        CASE 
            WHEN SUM(nm.orders) > 0 THEN ROUND((SUM(nm.sum) / SUM(nm.orders))::numeric, 2)
            ELSE 0
        END AS cpo
    FROM advertising_day_statistic ads
    INNER JOIN advertising_day_app app ON app.day_statistic_id = ads.id
    INNER JOIN advertising_day_app_nm nm ON nm.app_statistic_id = app.id
    WHERE nm.product_id = $3
    GROUP BY ads.date
),

sales_with_moving_avg AS (
    SELECT
        day,
        buy_out_count,
        AVG(buy_out_count) OVER (
            ORDER BY day
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ) AS avg_sales_per_day
    FROM history_daily
    WHERE buy_out_count > 0
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
),

daily_data AS (
    SELECT 
        d.date,
        
        -- Продажи
        COALESCE(h.buy_out_sum_rub, 0) AS sales_total_amount,
        COALESCE(h.buy_out_count, 0) AS sales_total_count,

        -- Заказы
        COALESCE(h.order_sum_rub, 0) AS orders_amount,
        COALESCE(h.orders_count, 0) AS orders_count,
        COALESCE(h.buy_out_count, 0) AS orders_sales_count,

        -- История
        COALESCE(h.open_card_count, 0) AS open_card_count,
        COALESCE(h.add_to_card_count, 0) AS add_to_card_count,
        COALESCE(h.orders_count, 0) AS history_orders_count,
        COALESCE(h.order_sum_rub, 0) AS order_sum_rub,
        COALESCE(h.buy_out_count, 0) AS buy_out_count,
        COALESCE(h.buy_out_sum_rub, 0) AS buy_out_sum_rub,
        COALESCE(h.avg_buy_out_percent, 0) AS avg_buy_out_percent,
        COALESCE(h.avg_add_to_card_conversion, 0) AS avg_add_to_card_conversion,
        COALESCE(h.avg_card_to_order_conversion, 0) AS avg_card_to_order_conversion,
        COALESCE(h.avg_add_to_wishlist, 0) AS avg_add_to_wishlist,

        -- ИЗМЕНЕННЫЕ ОСТАТКИ: теперь из stock_count_on_side
        COALESCE(scos.stock_total, 0) AS stock_total,
        COALESCE(scos.in_way_to_client, 0) AS in_way_to_client,
        COALESCE(scos.in_way_from_client, 0) AS in_way_from_client,
        COALESCE(st.stock_count, 0) AS stock_count,
        COALESCE(st.stock_sum, 0) AS stock_sum,
        COALESCE(st.avg_orders_by_mouth, 0) AS avg_orders_by_mouth,

        -- Реклама
        COALESCE(a.adv_spend, 0) AS adv_spend,
        COALESCE(a.adv_views, 0) AS adv_views,
        COALESCE(a.adv_clicks, 0) AS adv_clicks,
        COALESCE(a.adv_atbs, 0) AS adv_atbs,
        COALESCE(a.adv_orders, 0) AS adv_orders,
        COALESCE(a.cpc, 0) AS cpc,
        COALESCE(a.ctr, 0) AS ctr,
        COALESCE(a.cpo, 0) AS cpo,
        
        -- Органические клики
        COALESCE(h.open_card_count, 0) - COALESCE(a.adv_clicks, 0) AS organic_clicks,

        -- Прогнозы
        CASE 
            WHEN sma.avg_sales_per_day IS NULL OR sma.avg_sales_per_day = 0 OR hma.avg_buy_out_ratio = 0 OR st.stock_count IS NULL THEN NULL
            ELSE ROUND(st.stock_count / (sma.avg_sales_per_day * hma.avg_buy_out_ratio))
        END AS days_to_finish,

        CASE
            WHEN sma.avg_sales_per_day IS NULL OR sma.avg_sales_per_day = 0 OR hma.avg_buy_out_ratio = 0 OR st.stock_count IS NULL THEN NULL
            ELSE d.date + (st.stock_count / (sma.avg_sales_per_day * hma.avg_buy_out_ratio))::int
        END AS finish_date

    FROM dates d
    LEFT JOIN history_daily h ON h.day = d.date
    LEFT JOIN stock_daily st ON st.day = d.date
    LEFT JOIN stock_on_side_daily scos ON scos.day = d.date
    LEFT JOIN adv_daily a ON a.day = d.date
    LEFT JOIN sales_with_moving_avg sma ON sma.day = d.date
    LEFT JOIN history_with_moving_avg hma ON hma.day = d.date
),

daily_with_changes AS (
    SELECT
        date,

        -- Продажи
        sales_total_amount,
        percent_change(
            sales_total_amount,
            LAG(sales_total_amount) OVER w
        ) AS sales_total_amount_change_percent,

        sales_total_count,
        percent_change(
            sales_total_count,
            LAG(sales_total_count) OVER w
        ) AS sales_total_count_change_percent,

        -- Заказы
        orders_amount,
        percent_change(
            orders_amount,
            LAG(orders_amount) OVER w
        ) AS orders_amount_change_percent,

        orders_count,
        percent_change(
            orders_count,
            LAG(orders_count) OVER w
        ) AS orders_count_change_percent,

        orders_sales_count,
        percent_change(
            orders_sales_count,
            LAG(orders_sales_count) OVER w
        ) AS orders_sales_count_change_percent,

        -- История
        open_card_count,
        percent_change(
            open_card_count,
            LAG(open_card_count) OVER w
        ) AS open_card_count_change_percent,

        add_to_card_count,
        percent_change(
            add_to_card_count,
            LAG(add_to_card_count) OVER w
        ) AS add_to_card_count_change_percent,

        history_orders_count,
        percent_change(
            history_orders_count,
            LAG(history_orders_count) OVER w
        ) AS history_orders_count_change_percent,

        order_sum_rub,
        percent_change(
            order_sum_rub,
            LAG(order_sum_rub) OVER w
        ) AS order_sum_rub_change_percent,

        buy_out_count,
        percent_change(
            buy_out_count,
            LAG(buy_out_count) OVER w
        ) AS buy_out_count_change_percent,

        buy_out_sum_rub,
        percent_change(
            buy_out_sum_rub,
            LAG(buy_out_sum_rub) OVER w
        ) AS buy_out_sum_rub_change_percent,

        avg_buy_out_percent,
        percent_change(
            avg_buy_out_percent,
            LAG(avg_buy_out_percent) OVER w
        ) AS avg_buy_out_percent_change_percent,

        avg_add_to_card_conversion,
        percent_change(
            avg_add_to_card_conversion,
            LAG(avg_add_to_card_conversion) OVER w
        ) AS avg_add_to_card_conversion_change_percent,

        avg_card_to_order_conversion,
        percent_change(
            avg_card_to_order_conversion,
            LAG(avg_card_to_order_conversion) OVER w
        ) AS avg_card_to_order_conversion_change_percent,

        avg_add_to_wishlist,
        percent_change(
            avg_add_to_wishlist,
            LAG(avg_add_to_wishlist) OVER w
        ) AS avg_add_to_wishlist_change_percent,

        -- НОВЫЕ ПОЛЯ Остатков
        stock_total,
        percent_change(
            stock_total,
            LAG(stock_total) OVER w
        ) AS stock_total_change_percent,

        in_way_to_client,
        percent_change(
            in_way_to_client,
            LAG(in_way_to_client) OVER w
        ) AS in_way_to_client_change_percent,

        in_way_from_client,
        percent_change(
            in_way_from_client,
            LAG(in_way_from_client) OVER w
        ) AS in_way_from_client_change_percent,

        stock_count,
        percent_change(
            stock_count,
            LAG(stock_count) OVER w
        ) AS stock_count_change_percent,

        stock_sum,
        percent_change(
            stock_sum,
            LAG(stock_sum) OVER w
        ) AS stock_sum_change_percent,

        avg_orders_by_mouth,
        percent_change(
            avg_orders_by_mouth,
            LAG(avg_orders_by_mouth) OVER w
        ) AS avg_orders_by_mouth_change_percent,

        -- Реклама
        adv_spend,
        percent_change(
            adv_spend,
            LAG(adv_spend) OVER w
        ) AS adv_spend_change_percent,

        adv_views,
        percent_change(
            adv_views,
            LAG(adv_views) OVER w
        ) AS adv_views_change_percent,

        adv_clicks,
        percent_change(
            adv_clicks,
            LAG(adv_clicks) OVER w
        ) AS adv_clicks_change_percent,

        adv_atbs,
        percent_change(
            adv_atbs,
            LAG(adv_atbs) OVER w
        ) AS adv_atbs_change_percent,

        adv_orders,
        percent_change(
            adv_orders,
            LAG(adv_orders) OVER w
        ) AS adv_orders_change_percent,

        cpc,
        percent_change(
            cpc,
            LAG(cpc) OVER w
        ) AS cpc_change_percent,

        ctr,
        percent_change(
            ctr,
            LAG(ctr) OVER w
        ) AS ctr_change_percent,

        cpo,
        percent_change(
            cpo,
            LAG(cpo) OVER w
        ) AS cpo_change_percent,

        organic_clicks,
        percent_change(
            organic_clicks,
            LAG(organic_clicks) OVER w
        ) AS organic_clicks_change_percent,

        -- Прогнозы
        days_to_finish,
        finish_date

    FROM daily_data
    WINDOW w AS (ORDER BY date)
)

-- Объединяем daily данные и TOTAL строку
SELECT * FROM daily_with_changes

UNION ALL

SELECT
    NULL AS date,
    
    -- Суммы
    SUM(sales_total_amount) AS sales_total_amount,
    NULL AS sales_total_amount_change_percent,
    
    SUM(sales_total_count) AS sales_total_count,
    NULL AS sales_total_count_change_percent,
    
    SUM(orders_amount) AS orders_amount,
    NULL AS orders_amount_change_percent,
    
    SUM(orders_count) AS orders_count,
    NULL AS orders_count_change_percent,
    
    SUM(orders_sales_count) AS orders_sales_count,
    NULL AS orders_sales_count_change_percent,
    
    SUM(open_card_count) AS open_card_count,
    NULL AS open_card_count_change_percent,
    
    SUM(add_to_card_count) AS add_to_card_count,
    NULL AS add_to_card_count_change_percent,
    
    SUM(history_orders_count) AS history_orders_count,
    NULL AS history_orders_count_change_percent,
    
    SUM(order_sum_rub) AS order_sum_rub,
    NULL AS order_sum_rub_change_percent,
    
    SUM(buy_out_count) AS buy_out_count,
    NULL AS buy_out_count_change_percent,
    
    SUM(buy_out_sum_rub) AS buy_out_sum_rub,
    NULL AS buy_out_sum_rub_change_percent,
    
    -- Средние
    ROUND(AVG(avg_buy_out_percent), 2) AS avg_buy_out_percent,
    NULL AS avg_buy_out_percent_change_percent,
    
    ROUND(AVG(avg_add_to_card_conversion), 2) AS avg_add_to_card_conversion,
    NULL AS avg_add_to_card_conversion_change_percent,
    
    ROUND(AVG(avg_card_to_order_conversion), 2) AS avg_card_to_order_conversion,
    NULL AS avg_card_to_order_conversion_change_percent,
    
    ROUND(AVG(avg_add_to_wishlist), 2) AS avg_add_to_wishlist,
    NULL AS avg_add_to_wishlist_change_percent,
    
    -- НОВЫЕ ПОЛЯ - последние значения остатков
    (SELECT stock_total FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS stock_total,
    NULL AS stock_total_change_percent,

    (SELECT in_way_to_client FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS in_way_to_client,
    NULL AS in_way_to_client_change_percent,

    (SELECT in_way_from_client FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS in_way_from_client,
    NULL AS in_way_from_client_change_percent,
    
    (SELECT stock_count FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS stock_count,
    NULL AS stock_count_change_percent,
    
    SUM(stock_sum) AS stock_sum,
    NULL AS stock_sum_change_percent,
    
    ROUND(AVG(avg_orders_by_mouth), 2) AS avg_orders_by_mouth,
    NULL AS avg_orders_by_mouth_change_percent,
    
    -- Реклама суммы
    SUM(adv_spend) AS adv_spend,
    NULL AS adv_spend_change_percent,
    
    SUM(adv_views) AS adv_views,
    NULL AS adv_views_change_percent,
    
    SUM(adv_clicks) AS adv_clicks,
    NULL AS adv_clicks_change_percent,
    
    SUM(adv_atbs) AS adv_atbs,
    NULL AS adv_atbs_change_percent,
    
    SUM(adv_orders) AS adv_orders,
    NULL AS adv_orders_change_percent,
    
    -- Реклама средние
    ROUND(AVG(cpc), 2) AS cpc,
    NULL AS cpc_change_percent,
    
    ROUND(AVG(ctr), 2) AS ctr,
    NULL AS ctr_change_percent,
    
    ROUND(AVG(cpo), 2) AS cpo,
    NULL AS cpo_change_percent,
    
    SUM(organic_clicks) AS organic_clicks,
    NULL AS organic_clicks_change_percent,
    
    -- Прогнозы - последние значения
    (SELECT days_to_finish FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS days_to_finish,
    (SELECT finish_date FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS finish_date

FROM daily_with_changes

ORDER BY date ASC NULLS LAST;
`;

    const result = await this.dataSource.query(query, [startDate, endDate, productId]);

    const hasNonZero = result.some((row) =>
      Object.values(row).some((value) => {
        if (value == null || value instanceof Date) return false;

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        return typeof numValue === 'number' && !isNaN(numValue) && numValue !== 0;
      }),
    );

    return hasNonZero ? result : [];
  }

  async getProductByIdMetric(productId: number) {
    const query = `
WITH last_date AS (
    SELECT MAX(date) AS last_date
    FROM stock_count_on_side
    WHERE product_id = $1
),

-- Остаток по размерам на последнюю дату из stock_count_on_side
sizes AS (
    SELECT
        scos.tech_size,
        SUM(scos.quantity_full) AS qty
    FROM stock_count_on_side scos
    CROSS JOIN last_date ld
    WHERE scos.product_id = $1
      AND scos.date = ld.last_date
    GROUP BY scos.tech_size
),

-- Общее количество продукта на складе на последнюю дату
total_quantity AS (
    SELECT SUM(quantity_full) AS total_qty
    FROM stock_count_on_side scos
    CROSS JOIN last_date ld
    WHERE scos.product_id = $1
      AND scos.date = ld.last_date
),

-- Средняя цена заказа за последние 5 дней из таблицы history
avg_price AS (
    SELECT 
        CASE 
            WHEN SUM(h.orders_count) > 0 
            THEN SUM(h.order_sum_rub) / SUM(h.orders_count)
            ELSE 0 
        END AS avg_order_price
    FROM history h
    WHERE h.product_id = $1
      AND h.date >= (
            SELECT MAX(date) - INTERVAL '5 days'
            FROM history
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
    (SELECT total_qty * avg_order_price FROM total_quantity, avg_price) AS capitalization_rub,
    (SELECT avg_buy_out_percent FROM avg_buyout) AS avg_buy_out_percent_5_days;
`;

    const result = await this.dataSource.query(query, [productId]);

    return result[0];
  }

  async getBasicAnalytics(organizationId: number) {
    const query = `
WITH date_range AS (
    -- Определяем дату начала данных из history
    SELECT 
        MIN(date) AS start_date,
        MAX(date) AS end_date
    FROM history h
    INNER JOIN products p ON p.id = h.product_id
    WHERE p.organization_id = $1
      AND p.status = 'active'
),

-- Агрегируем данные из history
history_totals AS (
    SELECT
        SUM(h.orders_count) AS total_orders_count,
        SUM(h.order_sum_rub) AS total_orders_sum,
        SUM(h.buy_out_count) AS total_sales_count,
        SUM(h.buy_out_sum_rub) AS total_sales_sum,
        AVG(h.buy_out_percent) AS avg_buy_out_percent,
        SUM(h.open_card_count) AS total_views,
        SUM(h.add_to_card_count) AS total_add_to_cart
    FROM history h
    INNER JOIN products p ON p.id = h.product_id
    WHERE p.organization_id = $1
      AND p.status = 'active'
),

-- Последние остатки из stock_count_on_side
last_stock_date AS (
    SELECT MAX(scos.date) AS last_date
    FROM stock_count_on_side scos
    INNER JOIN products p ON p.id = scos.product_id
    WHERE p.organization_id = $1
      AND p.status = 'active'
),

stock_totals AS (
    SELECT
        SUM(scos.quantity_full) AS total_stock_quantity,
        -- Расчет стоимости остатков (количество * средняя цена из history)
        SUM(scos.quantity_full * COALESCE(
            (
                SELECT 
                    CASE 
                        WHEN SUM(h.orders_count) > 0 
                        THEN SUM(h.order_sum_rub) / SUM(h.orders_count)
                        ELSE 0 
                    END
                FROM history h
                WHERE h.product_id = scos.product_id
                  AND h.date >= (SELECT MAX(date) - INTERVAL '5 days' FROM history WHERE product_id = scos.product_id)
            ), 0
        )) AS total_stock_value
    FROM stock_count_on_side scos
    CROSS JOIN last_stock_date lsd
    INNER JOIN products p ON p.id = scos.product_id
    WHERE p.organization_id = $1
      AND p.status = 'active'
      AND scos.date = lsd.last_date
),

-- Средние продажи за последние 5 дней для расчета оборачиваемости
avg_sales_last_5_days AS (
    SELECT
        AVG(daily_sales) AS avg_daily_sales
    FROM (
        SELECT
            DATE_TRUNC('day', h.date)::date AS day,
            SUM(h.buy_out_count) AS daily_sales
        FROM history h
        INNER JOIN products p ON p.id = h.product_id
        WHERE p.organization_id = $1
          AND p.status = 'active'
          AND h.date >= (
              SELECT MAX(date) - INTERVAL '5 days'
              FROM history h2
              INNER JOIN products p2 ON p2.id = h2.product_id
              WHERE p2.organization_id = $1
          )
        GROUP BY DATE_TRUNC('day', h.date)::date
    ) daily
),

-- Средний процент выкупа за последние 5 дней для более точного расчета
avg_buyout_last_5_days AS (
    SELECT
        AVG(h.buy_out_percent) / 100.0 AS avg_buyout_ratio
    FROM history h
    INNER JOIN products p ON p.id = h.product_id
    WHERE p.organization_id = $1
      AND p.status = 'active'
      AND h.date >= (
          SELECT MAX(date) - INTERVAL '5 days'
          FROM history h2
          INNER JOIN products p2 ON p2.id = h2.product_id
          WHERE p2.organization_id = $1
      )
),

-- Затраты на рекламу
advertising_totals AS (
    SELECT
        COALESCE(SUM(nm.sum), 0) AS total_adv_spend
    FROM advertising_day_statistic ads
    INNER JOIN advertising_day_app app ON app.day_statistic_id = ads.id
    INNER JOIN advertising_day_app_nm nm ON nm.app_statistic_id = app.id
    INNER JOIN products p ON p.id = nm.product_id
    WHERE p.organization_id = $1
      AND p.status = 'active'
),

-- Количество активных артикулов
active_products AS (
    SELECT COUNT(*) AS total_active_products
    FROM products p
    WHERE p.organization_id = $1
      AND p.status = 'active'
)

SELECT
    -- Даты
    (SELECT start_date FROM date_range) AS data_start_date,
    (SELECT end_date FROM date_range) AS data_end_date,
    
    -- 1. Общее количество заказов
    COALESCE((SELECT total_orders_count FROM history_totals), 0) AS total_orders_count,
    
    -- 2. Сумма заказов
    COALESCE((SELECT total_orders_sum FROM history_totals), 0) AS total_orders_sum,
    
    -- 3. Количество продаж
    COALESCE((SELECT total_sales_count FROM history_totals), 0) AS total_sales_count,
    
    -- 4. Сумма продаж
    COALESCE((SELECT total_sales_sum FROM history_totals), 0) AS total_sales_sum,
    
    -- 5. Средний процент выкупа
    COALESCE(ROUND((SELECT avg_buy_out_percent FROM history_totals), 2), 0) AS avg_buy_out_percent,
    
    -- 6. Остатки всех товаров за последнюю дату
    COALESCE((SELECT total_stock_quantity FROM stock_totals), 0) AS total_stock_quantity,
    
    -- 7. Общее количество просмотров
    COALESCE((SELECT total_views FROM history_totals), 0) AS total_views,
    
    -- 8. Оборачиваемость (дни до окончания товаров)
    CASE
        WHEN (SELECT avg_daily_sales FROM avg_sales_last_5_days) > 0 
             AND (SELECT avg_buyout_ratio FROM avg_buyout_last_5_days) > 0
        THEN ROUND(
            (SELECT total_stock_quantity FROM stock_totals) / 
            ((SELECT avg_daily_sales FROM avg_sales_last_5_days) * 
             (SELECT avg_buyout_ratio FROM avg_buyout_last_5_days))
        )
        ELSE NULL
    END AS days_until_stock_depletes,
    
    -- 9. Товары на сумму на складе
    COALESCE(ROUND((SELECT total_stock_value FROM stock_totals), 2), 0) AS total_stock_value,
    
    -- 10. Количество добавлений в корзину
    COALESCE((SELECT total_add_to_cart FROM history_totals), 0) AS total_add_to_cart,
    
    -- 11. Затраты на рекламу
    COALESCE((SELECT total_adv_spend FROM advertising_totals), 0) AS total_adv_spend,
    
    -- 12. Количество активных артикулов
    COALESCE((SELECT total_active_products FROM active_products), 0) AS total_active_products;
`;

    const result = await this.dataSource.query(query, [organizationId]);

    return result[0];
  }
}
