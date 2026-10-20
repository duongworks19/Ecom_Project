export interface CustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
}

export interface UpdateCustomerProfileRequest {
  fullName: string;
  phone: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}
