import { apiFetch } from "./api";

export type AdminDashboardFilters = {
  from?: string;
  to?: string;
  chartMode?: "day" | "month" | "all";
};

export type PsychologistCommissionFilters = {
  from?: string;
  to?: string;
};

export type PsychologistPayoutFilters = PsychologistCommissionFilters & {
  amount?: number | string;
};

export function getAdminDashboard(filters?: AdminDashboardFilters) {
  const params = new URLSearchParams();

  if (filters?.from) {
    params.set("from", filters.from);
  }

  if (filters?.to) {
    params.set("to", filters.to);
  }

  if (filters?.chartMode) {
    params.set("chartMode", filters.chartMode);
  }

  const queryString = params.toString();

  return apiFetch(`/admin/dashboard${queryString ? `?${queryString}` : ""}`);
}

export function getAdminPsychologists() {
  return apiFetch("/admin/psychologists");
}

export function getPsychologistCommissions(
  filters?: PsychologistCommissionFilters
) {
  const params = new URLSearchParams();

  if (filters?.from) {
    params.set("from", filters.from);
  }

  if (filters?.to) {
    params.set("to", filters.to);
  }

  const queryString = params.toString();

  return apiFetch(
    `/admin/psychologists/commissions${queryString ? `?${queryString}` : ""}`
  );
}

export function payPsychologistPayouts(
  psychologistId: number | string,
  filters?: PsychologistPayoutFilters
) {
  return apiFetch(`/admin/psychologists/${psychologistId}/payouts/pay`, {
    method: "PATCH",
    body: JSON.stringify({
      from: filters?.from || "",
      to: filters?.to || "",
      amount:
        filters?.amount !== undefined && filters?.amount !== null
          ? String(filters.amount)
          : "",
    }),
  });
}

export function verifyPsychologist(id: number | string) {
  return apiFetch(`/admin/psychologists/${id}/verify`, {
    method: "PATCH",
  });
}

export function disablePsychologist(id: number | string) {
  return apiFetch(`/admin/psychologists/${id}/disable`, {
    method: "PATCH",
  });
}

export function enablePsychologist(id: number | string) {
  return apiFetch(`/admin/psychologists/${id}/enable`, {
    method: "PATCH",
  });
}

export function getAdminPayments() {
  return apiFetch("/admin/payments");
}

export function getAdminAlerts() {
  return apiFetch("/admin/alerts");
}

export function closeAlert(id: number | string) {
  return apiFetch(`/admin/alerts/${id}/close`, {
    method: "PATCH",
  });
}