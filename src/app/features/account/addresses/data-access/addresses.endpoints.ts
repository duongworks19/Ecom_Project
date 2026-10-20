export const ADDRESSES_ENDPOINTS = {
  base: '/customer/addresses',
  byId: (id: number) => `/customer/addresses/${id}`,
  setDefault: (id: number) => `/customer/addresses/${id}/default`,
} as const;
