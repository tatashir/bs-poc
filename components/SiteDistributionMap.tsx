"use client";

import { useEffect, useState } from "react";
import type { CarrierAssignment, CarrierOffice } from "@/lib/carrier-offices";
import type { Region, Site } from "@/lib/scheduler";
import { regions } from "@/lib/site-sets";

type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type GeoJsonFeature = {
  type: "Feature";
  properties: { P?: string; region?: Region; label?: string };
  geometry: GeoJsonGeometry;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

function projectLongitude(longitude: number) {
  const minLng = 122;
  const maxLng = 146;
  return ((longitude - minLng) / (maxLng - minLng)) * 100;
}

function projectLatitude(latitude: number) {
  const minLat = 24;
  const maxLat = 46;
  return 100 - ((latitude - minLat) / (maxLat - minLat)) * 100;
}

function normalizePoint(point: { latitude: number; longitude: number }) {
  const x = projectLongitude(point.longitude);
  const y = projectLatitude(point.latitude);
  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(96, Math.max(4, y)),
  };
}

function coordinateToPoint(coordinate: number[]) {
  const [longitude, latitude] = coordinate;
  return `${projectLongitude(longitude).toFixed(2)},${projectLatitude(latitude).toFixed(2)}`;
}

function polygonToPoints(polygon: number[][][]) {
  return polygon[0].map(coordinateToPoint).join(" ");
}

export function SiteDistributionMap({
  sites,
  carrierOffices = [],
  carrierAssignments = [],
  pilotSiteIds = [],
  showCarrierLinks = false,
}: {
  sites: Site[];
  carrierOffices?: CarrierOffice[];
  carrierAssignments?: CarrierAssignment[];
  pilotSiteIds?: string[];
  showCarrierLinks?: boolean;
}) {
  const [geoJson, setGeoJson] = useState<GeoJsonFeatureCollection | null>(null);
  const visibleSites = sites.length > 350 ? sites.filter((_, index) => index % Math.ceil(sites.length / 350) === 0) : sites;
  const visibleSiteIds = new Set(visibleSites.map((site) => site.id));
  const pilotSiteIdSet = new Set(pilotSiteIds);
  const carrierOfficeById = new Map(carrierOffices.map((office) => [office.id, office]));
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const visibleLinks = showCarrierLinks
    ? carrierAssignments
        .filter((assignment) => visibleSiteIds.has(assignment.siteId))
        .slice(0, 160)
        .map((assignment) => ({
          assignment,
          site: siteById.get(assignment.siteId),
          office: carrierOfficeById.get(assignment.carrierOfficeId),
        }))
        .filter((item): item is { assignment: CarrierAssignment; site: Site; office: CarrierOffice } => Boolean(item.site && item.office))
    : [];
  const regionCounts = regions.map((region) => ({
    region,
    count: sites.filter((site) => site.region === region).length,
  }));
  const prefectureCounts = new Map<string, number>();
  for (const site of sites) {
    prefectureCounts.set(site.prefecture, (prefectureCounts.get(site.prefecture) ?? 0) + 1);
  }
  const maxPrefectureCount = Math.max(1, ...prefectureCounts.values());

  useEffect(() => {
    let cancelled = false;

    fetch("/japan-prefectures.geojson")
      .then((response) => response.json())
      .then((data: GeoJsonFeatureCollection) => {
        if (!cancelled) setGeoJson(data);
      })
      .catch(() => {
        if (!cancelled) setGeoJson(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Site distribution</h2>
          <p className="mt-1 text-sm text-zinc-500">Prefecture coverage and field office links</p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
          {visibleSites.length}/{sites.length}点表示
        </span>
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative h-[420px] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
            {geoJson?.features.flatMap((feature) => {
              const prefecture = feature.properties.P ?? feature.properties.label ?? "";
              const prefectureCount = prefectureCounts.get(prefecture) ?? 0;
              const opacity = Math.min(0.86, 0.12 + (prefectureCount / maxPrefectureCount) * 0.68);
              const polygons =
                feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;

              return polygons.map((polygon, index) => (
                <polygon
                  key={`${prefecture}-${index}`}
                  points={polygonToPoints(polygon)}
                  fill={`rgba(82, 82, 91, ${opacity})`}
                  stroke="#e4e4e7"
                  strokeWidth="0.22"
                />
              ));
            })}
            {visibleLinks.map(({ assignment, site, office }) => {
              const sitePoint = normalizePoint(site);
              const officePoint = normalizePoint(office);
              return (
                <line
                  key={`${assignment.siteId}-${assignment.carrierOfficeId}`}
                  x1={officePoint.x}
                  y1={officePoint.y}
                  x2={sitePoint.x}
                  y2={sitePoint.y}
                  stroke="rgba(63, 63, 70, 0.22)"
                  strokeWidth="0.22"
                />
              );
            })}
          </svg>
          {visibleSites.map((site) => {
            const point = normalizePoint(site);
            const color =
              site.difficulty === "高" ? "bg-red-500" : site.difficulty === "中" ? "bg-blue-600" : "bg-zinc-400";
            const size = site.priority === "高" ? "h-3 w-3" : site.priority === "中" ? "h-2.5 w-2.5" : "h-2 w-2";
            return (
              <span key={site.id}>
                {pilotSiteIdSet.has(site.id) && (
                  <span
                    title={`${site.name} / パイロット候補`}
                    className="absolute h-5 w-5 rounded-full border-2 border-blue-700 bg-white/20"
                    style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-35%, -35%)" }}
                  />
                )}
                <span
                  title={`${site.name} / ${site.region} / 難易度${site.difficulty} / 優先度${site.priority}`}
                  className={`absolute rounded-full ${color} ${size} border border-white`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                />
              </span>
            );
          })}
          {carrierOffices.map((office) => {
            const point = normalizePoint(office);
            return (
              <span
                key={office.id}
                title={`${office.name} / ${office.engineers}名 / ${office.vehicles}台 / ${office.monthlyCapacity}件/月`}
                className="absolute grid h-4 w-4 place-items-center rounded-sm border-2 border-white bg-zinc-950"
                style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%) rotate(45deg)" }}
              />
            );
          })}
        </div>
        <div className="grid content-start gap-3">
          {regionCounts.map((item) => (
            <div key={item.region} className="rounded-md border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-zinc-800">{item.region}</span>
                <span className="font-semibold text-zinc-950">{item.count}</span>
              </div>
            </div>
          ))}
          <div className="rounded-md border border-zinc-200 p-3 text-xs leading-6 text-zinc-500">
            都道府県ポリゴンは `public/japan-prefectures.geojson` を読み込んで描画しています。塗りは都道府県別拠点数、点の色は難易度、点の大きさは優先度です。
            {carrierOffices.length > 0 && " 黒い菱形は通信回線業者拠点です。"}
            {pilotSiteIds.length > 0 && " ピンクのリングはパイロット展開候補です。"}
          </div>
        </div>
      </div>
    </div>
  );
}
