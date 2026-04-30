"use client";

import { useMemo } from "react";
import { InteractiveJapanMap } from "@/components/InteractiveJapanMap";
import type { AssignmentRow, CarrierOffice, TargetSite } from "@/lib/assignment/types";

function mapPriority(value: string): "低" | "中" | "高" {
  const normalized = value.trim().toLowerCase();
  if (["high", "高", "p1", "urgent"].includes(normalized)) return "高";
  if (["medium", "中", "p2"].includes(normalized)) return "中";
  return "低";
}

export function AssignmentMap({
  sites,
  offices,
  rows,
}: {
  sites: TargetSite[];
  offices: CarrierOffice[];
  rows: AssignmentRow[];
}) {
  const mapSites = useMemo(
    () =>
      sites
        .filter((site) => site.lat !== null && site.lng !== null && site.region)
        .map((site) => ({
          id: site.siteId,
          name: site.siteName,
          prefecture: site.prefecture,
          region: site.region!,
          latitude: site.lat!,
          longitude: site.lng!,
          difficulty: "中" as const,
          priority: mapPriority(site.priority),
          blackoutMonths: [],
        })),
    [sites],
  );

  const mapOffices = useMemo(
    () =>
      offices
        .filter((office) => office.lat !== null && office.lng !== null && office.region)
        .map((office) => ({
          id: office.officeId,
          name: office.officeName,
          region: office.region!,
          prefecture: office.prefecture,
          latitude: office.lat!,
          longitude: office.lng!,
          engineers: 0,
          vehicles: 0,
          monthlyCapacity: office.monthlyCapacity,
          serviceRegions: office.region ? [office.region] : [],
        })),
    [offices],
  );

  const carrierAssignments = useMemo(
    () =>
      rows
        .filter((row) => row.assignedOffice && row.site.lat !== null && row.site.lng !== null)
        .map((row) => ({
          siteId: row.siteId,
          carrierOfficeId: row.assignedOfficeId,
          distanceKm: Math.round(row.distanceKm ?? 0),
          reason: row.warning.join(","),
        })),
    [rows],
  );

  const warningBySiteId = useMemo(
    () => new Map(rows.map((row) => [row.siteId, row.warning.length])),
    [rows],
  );

  if (mapSites.length === 0 || mapOffices.length === 0) {
    return (
      <section className="rounded-md border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-950">Map</h2>
        </div>
        <div className="grid min-h-[280px] place-items-center p-6 text-sm text-zinc-500">
          緯度経度付きのデータを読み込むと地図を表示します。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">Map</h2>
      </div>
      <div className="h-[520px] p-3">
        <InteractiveJapanMap
          sites={mapSites}
          carrierOffices={mapOffices}
          carrierAssignments={carrierAssignments}
          warningBySiteId={warningBySiteId}
        />
      </div>
    </section>
  );
}
