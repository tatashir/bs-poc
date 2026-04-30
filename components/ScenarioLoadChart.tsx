"use client";

import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import type { ScenarioResult } from "@/lib/simulator/types";

export function ScenarioLoadChart({
  scenario,
}: {
  scenario: ScenarioResult | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-950">Load Graph</h2>
        <p className="mt-1 text-xs text-slate-500">
          窓口負荷と管理負荷、同時に動くブロック数を比較します。
        </p>
      </div>
      <div className="h-[360px] px-3 py-4">
        {!mounted ? (
          <div className="grid h-full place-items-center rounded-2xl bg-slate-50 text-sm text-slate-500">
            グラフを準備中...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scenario?.monthlyPoints ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="yearMonth" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="supportLoad"
                name="窓口負荷"
                stroke="#dc2626"
                fill="#fecaca"
                fillOpacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="managementLoad"
                name="管理負荷"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="activeBlocks"
                name="同時ブロック数"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
