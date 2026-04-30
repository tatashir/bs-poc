"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScenarioResult } from "@/lib/simulator/types";

export function ScenarioTimelineChart({
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
        <h2 className="text-sm font-semibold text-slate-950">Timeline</h2>
        <p className="mt-1 text-xs text-slate-500">
          月別展開量と累積進捗を同時に確認します。
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
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="siteCount"
                name="月次対象拠点"
                fill="#0f172a"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="districtCount"
                name="月次地区本部"
                fill="#94a3b8"
                radius={[8, 8, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeSites"
                name="累積対象拠点"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
