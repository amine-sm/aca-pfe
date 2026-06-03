import { apiFetch } from "./api";

export type PaymentMethod = {
  id: number;
  method_type: string;
  name: string;
  account_holder?: string | null;
  ccp_number?: string | null;
  rip_key?: string | null;
  bank_name?: string | null;
  phone_number?: string | null;
  instructions?: string | null;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type PaymentMethodPayload = {
  method_type: string;
  name: string;
  account_holder?: string;
  ccp_number?: string;
  rip_key?: string;
  bank_name?: string;
  phone_number?: string;
  instructions?: string;
  is_active?: boolean;
  sort_order?: number | string;
};

export function getActivePaymentMethods() {
  return apiFetch<{ success: boolean; methods: PaymentMethod[] }>(
    "/payment-methods/active"
  );
}

export function getAdminPaymentMethods() {
  return apiFetch<{ success: boolean; methods: PaymentMethod[] }>(
    "/payment-methods/admin"
  );
}

export function createPaymentMethod(payload: PaymentMethodPayload) {
  return apiFetch<{ success: boolean; message: string; method: PaymentMethod }>(
    "/payment-methods/admin",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function updatePaymentMethod(
  id: number | string,
  payload: Partial<PaymentMethodPayload>
) {
  return apiFetch<{ success: boolean; message: string; method: PaymentMethod }>(
    `/payment-methods/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deletePaymentMethod(id: number | string) {
  return apiFetch<{ success: boolean; message: string }>(
    `/payment-methods/admin/${id}`,
    {
      method: "DELETE",
    }
  );
}
