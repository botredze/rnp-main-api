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

      sales_daily AS (
        SELECT 
            s.date::date AS day,
            SUM(s.price_with_disc)::numeric AS sales_total_amount,
            COUNT(s.id)::int AS sales_total_count
        FROM sales s
        WHERE s.product_id = $3 and s.is_cansel = false
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
            GROUP BY 1
        ) s2 ON s2.day = o.date::date
        WHERE o.product_id = $3
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
            SUM(nm.sum_price) AS adv_spend,
            SUM(nm.views) AS adv_views,
            SUM(nm.clicks) AS adv_clicks,
            SUM(nm.atbs) AS adv_atbs,
            SUM(nm.orders) AS adv_orders,

            CASE 
                WHEN SUM(nm.clicks) = 0 THEN 0
                ELSE ROUND(SUM(nm.sum_price) / SUM(nm.clicks), 2)
            END AS cpc,

            CASE 
                WHEN SUM(nm.views) = 0 THEN 0
                ELSE ROUND((SUM(nm.clicks) * 100.0) / SUM(nm.views), 2)
            END AS ctr,

            CASE 
                WHEN SUM(nm.orders) = 0 THEN 0
                ELSE ROUND(SUM(nm.sum_price) / SUM(nm.orders), 2)
            END AS cpo

        FROM advertising_day_statistic ads
        LEFT JOIN advertising_day_app app 
            ON app.day_statistic_id = ads.id
        LEFT JOIN advertising_day_app_nm nm 
            ON nm.app_statistic_id = app.id
        WHERE nm.product_id = $3
        GROUP BY ads.date
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
          COALESCE(st.avg_orders_by_mouth, 0) AS avg_orders_by_mouth
          
      FROM dates d
      LEFT JOIN sales_daily s ON s.day = d.date
      LEFT JOIN orders_daily o ON o.day = d.date
      LEFT JOIN history_daily h ON h.day = d.date
      LEFT JOIN stock_daily st ON st.day = d.date
      LEFT JOIN adv_daily a ON a.day = d.date
      ORDER BY d.date ASC;
    `;

    return this.dataSource.query(query, [startDate, endDate, productId]);
  }
}
