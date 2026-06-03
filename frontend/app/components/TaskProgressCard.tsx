"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Flame, Award, TrendingUp, Loader2 } from "lucide-react";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface ProgressDay {
  date: string;
  label: string;
  count: number;
  avg_score: number;
}

interface ProgressStats {
  weekly_data: ProgressDay[];
  total_completions: number;
  avg_score: number;
  streak: number;
}


export default function TaskProgressCard() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("aca_token");
        const res = await fetch(`${API_BASE}/tasks/mine/progress`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch (e) {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-8 flex h-40 items-center justify-center rounded-2xl bg-white shadow-md">
        <Loader2 className="animate-spin text-teal-700" size={24} />
      </div>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.weekly_data.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl bg-gradient-to-br from-white to-teal-50/50 p-6 shadow-md"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Ma progression des tâches
            </h3>
            <p className="text-xs text-slate-500">7 derniers jours</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Flame size={14} className="text-orange-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Streak
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats.streak}{" "}
            <span className="text-xs font-semibold text-slate-500">j</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Award size={14} className="text-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats.total_completions}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-teal-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Score
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats.avg_score.toFixed(1)}
            <span className="text-xs font-semibold text-slate-500">/10</span>
          </p>
        </div>
      </div>

      {stats.total_completions === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center">
          <p className="text-sm text-slate-500">
            Aucune tâche validée cette semaine
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Complétez vos tâches pour voir votre progression !
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-4">
          <div className="flex h-40 items-end gap-2">
            {stats.weekly_data.map((day, idx) => {
              const heightPct = (day.count / maxCount) * 100;
              const isToday = idx === stats.weekly_data.length - 1;

              return (
                <div
                  key={day.date}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 text-[10px] font-bold text-teal-700">
                      {day.avg_score > 0
                        ? day.avg_score.toFixed(1)
                        : day.count}
                    </div>
                  )}

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    className={`w-full rounded-t-lg transition-all ${
                      day.count > 0
                        ? isToday
                          ? "bg-gradient-to-t from-teal-700 to-teal-500 shadow-md"
                          : "bg-gradient-to-t from-teal-500/80 to-teal-400/60"
                        : "bg-slate-100"
                    }`}
                    style={{ minHeight: day.count > 0 ? "20px" : "8px" }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2">
            {stats.weekly_data.map((day, idx) => (
              <div
                key={day.date}
                className={`flex-1 text-center text-[10px] font-bold ${
                  idx === stats.weekly_data.length - 1
                    ? "text-teal-700"
                    : "text-slate-500"
                }`}
              >
                {day.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.streak > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
          <Flame size={14} className="text-orange-500" />
          <p className="text-xs font-bold text-orange-900">
            🔥 {stats.streak} jour{stats.streak > 1 ? "s" : ""} consécutif
            {stats.streak > 1 ? "s" : ""} ! Continue comme ça !
          </p>
        </div>
      )}
    </motion.div>
  );
}