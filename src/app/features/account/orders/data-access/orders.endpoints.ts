export const ORDERS_ENDPOINTS = {
  base: '/customer/orders',
  byId: (id: number) => `/customer/orders/${id}`,
  cancel: (id: number) => `/customer/orders/${id}/cancel`,
  rebuy: (id: number) => `/customer/orders/${id}/rebuy`,
} as const;
