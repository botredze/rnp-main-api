export const EVENT_EMITTER_EVENTS = {
  NEW_TASK: 'new-task',
};

export enum TaskName {
  SHIPPING = 'shipping',
  OrganizationInitExecutor = 'organization_init_executor',
  CreateProductLogs = 'create_product_logs',
  GetStockCount = 'get_stock_count',
}

export const TASK_STATUS = {
  CREATED: 'created',
  SUCCESS: 'success',
  ERROR: 'error',
};
