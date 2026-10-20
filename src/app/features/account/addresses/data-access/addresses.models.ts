export interface CustomerAddress {
  id: number;
  recipientName: string;
  phone: string;
  streetAddress: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

export interface UpsertCustomerAddressRequest {
  recipientName: string;
  phone: string;
  streetAddress: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}
