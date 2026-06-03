import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export function PageHeader({
  badge,
  title,
  text,
  actions,
}: {
  badge?: string;
  title: string;
  text?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      {badge && <span className="badge info">{badge}</span>}
      <h1 style={{ marginBottom: 8 }}>{title}</h1>
      {text && (
        <p className="muted" style={{ maxWidth: 880 }}>
          {text}
        </p>
      )}
      {actions && (
        <div className="actions" style={{ marginTop: 16 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export function AlertBox({
  type = "info",
  children,
}: {
  type?: "info" | "error" | "success" | "warn";
  children: ReactNode;
}) {
  const cls =
    type === "error"
      ? "alert error"
      : type === "success"
      ? "alert success"
      : type === "warn"
      ? "alert warn"
      : "alert";

  return (
    <div className={cls}>
      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        {type === "success" ? (
          <CheckCircle2 size={18} />
        ) : type === "error" ? (
          <AlertTriangle size={18} />
        ) : (
          <Info size={18} />
        )}
        {children}
      </span>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  helper?: string;
}) {
  return (
    <div className="card">
      <div className="stat">
        <div className="stat-icon">{icon}</div>
        <div>
          <div className="muted" style={{ fontWeight: 850 }}>
            {label}
          </div>
          <div className="stat-value">{value}</div>
          {helper && (
            <div className="muted" style={{ fontSize: 13 }}>
              {helper}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}