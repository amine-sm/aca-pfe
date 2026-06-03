import { apiFetch } from "./api";

export type CreateCheckoutPayload = {
  appointment_id?: number;
  plan_id?: number;
  provider?: string;
  payment_method?: string;
  payment_method_id?: number | string;
  proof_reference?: string;
  notes?: string;
  proof_file?: File | null;
};

export type PaymentStatus =
  | "pending"
  | "paid"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "failed";

export type Payment = {
  id: number;
  code?: string;
  user_id?: number;
  psychologist_id?: number | null;
  appointment_id?: number | null;
  plan_id?: number | null;

  amount: number;
  currency?: string;

  provider?: string | null;
  payment_method?: string | null;
  proof_reference?: string | null;
  notes?: string | null;
  metadata?: any;

  status: PaymentStatus;
  rejection_reason?: string | null;

  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;

  patient_name?: string | null;
  patient_email?: string | null;

  user_name?: string | null;
  user_email?: string | null;

  psychologist_name?: string | null;
  psychologist_email?: string | null;

  plan_name?: string | null;
  appointment_date?: string | null;
  appointment_start_time?: string | null;
  appointment_end_time?: string | null;
};

export type PaymentPlan = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  currency?: string;
  duration_days?: number | null;
  is_active?: boolean;
  created_at?: string;
};

export type Invoice = {
  id: number;
  payment_id: number;
  invoice_number?: string;
  amount: number;
  currency?: string;
  status?: string;
  file_url?: string | null;
  created_at?: string;
  issued_at?: string;

  payment?: Payment;
};

export type PsychologistPayout = {
  id: number;
  psychologist_id: number;
  payment_id?: number | null;
  amount?: number;
  gross_amount?: number;
  platform_fee?: number;
  net_amount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
  paid_at?: string | null;

  patient_name?: string | null;
  appointment_date?: string | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
} & T;

// =======================
// PUBLIC
// =======================

export function getPlans() {
  return apiFetch<ApiResponse<{ plans: PaymentPlan[] }>>("/payments/plans", {
    auth: false,
  });
}

// =======================
// USER
// =======================

export function createCheckout(payload: CreateCheckoutPayload) {
  const formData = new FormData();

  if (payload.appointment_id) {
    formData.append("appointment_id", String(payload.appointment_id));
  }

  if (payload.plan_id) {
    formData.append("plan_id", String(payload.plan_id));
  }

  formData.append("provider", payload.provider || "manual");
  formData.append("payment_method", payload.payment_method || "manual");

  if (payload.payment_method_id) {
    formData.append("payment_method_id", String(payload.payment_method_id));
  }

  formData.append("proof_reference", payload.proof_reference || "");
  formData.append("notes", payload.notes || "");

  if (payload.proof_file) {
    formData.append("proof_file", payload.proof_file);
  }

  return apiFetch<
    ApiResponse<{
      payment: Payment;
      checkout_url?: string | null;
      invoice?: Invoice | null;
    }>
  >("/payments/create-checkout", {
    method: "POST",
    body: formData,
  });
}

export function uploadPaymentProof(id: number | string, proof_file: File) {
  const formData = new FormData();
  formData.append("proof_file", proof_file);

  return apiFetch<ApiResponse<{ proof: any }>>(`/payments/${id}/proof`, {
    method: "POST",
    body: formData,
  });
}

export function getMyPayments() {
  return apiFetch<ApiResponse<{ payments: Payment[] }>>("/payments/me");
}

export function getMyPaymentById(id: number | string) {
  return apiFetch<ApiResponse<{ payment: Payment }>>(`/payments/me/${id}`);
}

export function getMyInvoices() {
  return apiFetch<ApiResponse<{ invoices: Invoice[] }>>(
    "/payments/invoices/me"
  );
}

// =======================
// PSYCHOLOGIST
// =======================

export function getMyPsychologistPayouts() {
  return apiFetch<ApiResponse<{ payouts: PsychologistPayout[] }>>(
    "/payments/psychologist/payouts/me"
  );
}

// =======================
// ADMIN
// =======================

export function getAllPaymentsAdmin() {
  return apiFetch<ApiResponse<{ payments: Payment[] }>>("/payments/admin/all");
}

export function markManualPaid(id: number | string) {
  return apiFetch<ApiResponse<{ payment: Payment }>>(
    `/payments/${id}/manual-paid`,
    {
      method: "PATCH",
    }
  );
}

export function rejectPayment(id: number | string, reason?: string) {
  return apiFetch<ApiResponse<{ payment: Payment }>>(
    `/payments/${id}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({
        reason,
      }),
    }
  );
}