import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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

        -- Остатки
        COALESCE(st.stock_total, 0) AS stock_total,
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
    LEFT JOIN adv_daily a ON a.day = d.date
    LEFT JOIN sales_with_moving_avg sma ON sma.day = d.date
    LEFT JOIN history_with_moving_avg hma ON hma.day = d.date
),

daily_with_changes AS (
    SELECT 
        date,
        
        -- Продажи
        sales_total_amount,
        CASE 
            WHEN LAG(sales_total_amount) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((sales_total_amount - LAG(sales_total_amount) OVER (ORDER BY date)) / LAG(sales_total_amount) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS sales_total_amount_change_percent,
        
        sales_total_count,
        CASE 
            WHEN LAG(sales_total_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((sales_total_count - LAG(sales_total_count) OVER (ORDER BY date)) / LAG(sales_total_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS sales_total_count_change_percent,

        -- Заказы
        orders_amount,
        CASE 
            WHEN LAG(orders_amount) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((orders_amount - LAG(orders_amount) OVER (ORDER BY date)) / LAG(orders_amount) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS orders_amount_change_percent,
        
        orders_count,
        CASE 
            WHEN LAG(orders_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((orders_count - LAG(orders_count) OVER (ORDER BY date)) / LAG(orders_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS orders_count_change_percent,
        
        orders_sales_count,
        CASE 
            WHEN LAG(orders_sales_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((orders_sales_count - LAG(orders_sales_count) OVER (ORDER BY date)) / LAG(orders_sales_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS orders_sales_count_change_percent,

        -- История
        open_card_count,
        CASE 
            WHEN LAG(open_card_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((open_card_count - LAG(open_card_count) OVER (ORDER BY date)) / LAG(open_card_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS open_card_count_change_percent,
        
        add_to_card_count,
        CASE 
            WHEN LAG(add_to_card_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((add_to_card_count - LAG(add_to_card_count) OVER (ORDER BY date)) / LAG(add_to_card_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS add_to_card_count_change_percent,
        
        history_orders_count,
        CASE 
            WHEN LAG(history_orders_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((history_orders_count - LAG(history_orders_count) OVER (ORDER BY date)) / LAG(history_orders_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS history_orders_count_change_percent,
        
        order_sum_rub,
        CASE 
            WHEN LAG(order_sum_rub) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((order_sum_rub - LAG(order_sum_rub) OVER (ORDER BY date)) / LAG(order_sum_rub) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS order_sum_rub_change_percent,
        
        buy_out_count,
        CASE 
            WHEN LAG(buy_out_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((buy_out_count - LAG(buy_out_count) OVER (ORDER BY date)) / LAG(buy_out_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS buy_out_count_change_percent,
        
        buy_out_sum_rub,
        CASE 
            WHEN LAG(buy_out_sum_rub) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((buy_out_sum_rub - LAG(buy_out_sum_rub) OVER (ORDER BY date)) / LAG(buy_out_sum_rub) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS buy_out_sum_rub_change_percent,
        
        avg_buy_out_percent,
        CASE 
            WHEN LAG(avg_buy_out_percent) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((avg_buy_out_percent - LAG(avg_buy_out_percent) OVER (ORDER BY date)) / LAG(avg_buy_out_percent) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS avg_buy_out_percent_change_percent,
        
        avg_add_to_card_conversion,
        CASE 
            WHEN LAG(avg_add_to_card_conversion) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((avg_add_to_card_conversion - LAG(avg_add_to_card_conversion) OVER (ORDER BY date)) / LAG(avg_add_to_card_conversion) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS avg_add_to_card_conversion_change_percent,
        
        avg_card_to_order_conversion,
        CASE 
            WHEN LAG(avg_card_to_order_conversion) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((avg_card_to_order_conversion - LAG(avg_card_to_order_conversion) OVER (ORDER BY date)) / LAG(avg_card_to_order_conversion) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS avg_card_to_order_conversion_change_percent,
        
        avg_add_to_wishlist,
        CASE 
            WHEN LAG(avg_add_to_wishlist) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((avg_add_to_wishlist - LAG(avg_add_to_wishlist) OVER (ORDER BY date)) / LAG(avg_add_to_wishlist) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS avg_add_to_wishlist_change_percent,

        -- Остатки
        stock_total,
        CASE 
            WHEN LAG(stock_total) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((stock_total - LAG(stock_total) OVER (ORDER BY date)) / LAG(stock_total) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS stock_total_change_percent,
        
        stock_count,
        CASE 
            WHEN LAG(stock_count) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((stock_count - LAG(stock_count) OVER (ORDER BY date)) / LAG(stock_count) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS stock_count_change_percent,
        
        stock_sum,
        CASE 
            WHEN LAG(stock_sum) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((stock_sum - LAG(stock_sum) OVER (ORDER BY date)) / LAG(stock_sum) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS stock_sum_change_percent,
        
        avg_orders_by_mouth,
        CASE 
            WHEN LAG(avg_orders_by_mouth) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((avg_orders_by_mouth - LAG(avg_orders_by_mouth) OVER (ORDER BY date)) / LAG(avg_orders_by_mouth) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS avg_orders_by_mouth_change_percent,

        -- Реклама
        adv_spend,
        CASE 
            WHEN LAG(adv_spend) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((adv_spend - LAG(adv_spend) OVER (ORDER BY date)) / LAG(adv_spend) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS adv_spend_change_percent,
        
        adv_views,
        CASE 
            WHEN LAG(adv_views) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((adv_views - LAG(adv_views) OVER (ORDER BY date)) / LAG(adv_views) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS adv_views_change_percent,
        
        adv_clicks,
        CASE 
            WHEN LAG(adv_clicks) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((adv_clicks - LAG(adv_clicks) OVER (ORDER BY date)) / LAG(adv_clicks) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS adv_clicks_change_percent,
        
        adv_atbs,
        CASE 
            WHEN LAG(adv_atbs) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((adv_atbs - LAG(adv_atbs) OVER (ORDER BY date)) / LAG(adv_atbs) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS adv_atbs_change_percent,
        
        adv_orders,
        CASE 
            WHEN LAG(adv_orders) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((adv_orders - LAG(adv_orders) OVER (ORDER BY date)) / LAG(adv_orders) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS adv_orders_change_percent,
        
        cpc,
        CASE 
            WHEN LAG(cpc) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((cpc - LAG(cpc) OVER (ORDER BY date)) / LAG(cpc) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS cpc_change_percent,
        
        ctr,
        CASE 
            WHEN LAG(ctr) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((ctr - LAG(ctr) OVER (ORDER BY date)) / LAG(ctr) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS ctr_change_percent,
        
        cpo,
        CASE 
            WHEN LAG(cpo) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((cpo - LAG(cpo) OVER (ORDER BY date)) / LAG(cpo) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS cpo_change_percent,
        
        organic_clicks,
        CASE 
            WHEN LAG(organic_clicks) OVER (ORDER BY date) = 0 THEN NULL
            ELSE ROUND(((organic_clicks - LAG(organic_clicks) OVER (ORDER BY date)) / LAG(organic_clicks) OVER (ORDER BY date) * 100)::numeric, 2)
        END AS organic_clicks_change_percent,

        -- Прогнозы
        days_to_finish,
        finish_date

    FROM daily_data
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
    
    -- Последние значения остатков
    (SELECT stock_total FROM daily_with_changes ORDER BY date DESC LIMIT 1) AS stock_total,
    NULL AS stock_total_change_percent,
    
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
