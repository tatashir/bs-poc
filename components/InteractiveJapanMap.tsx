"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, GeoJsonObject } from "geojson";
import type * as LeafletNS from "leaflet";
import type { CarrierAssignment, CarrierOffice } from "@/lib/carrier-offices";
import type { Site } from "@/lib/scheduler";

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { P?: string; label?: string };
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    };
  }>;
};

function getDifficultyColor(value: Site["difficulty"]) {
  if (value === "高") return "#dc2626";
  if (value === "中") return "#2563eb";
  return "#6b7280";
}

function getSiteCountByPrefecture(sites: Site[]) {
  const map = new Map<string, number>();
  for (const site of sites) {
    map.set(site.prefecture, (map.get(site.prefecture) ?? 0) + 1);
  }
  return map;
}

const prefectureFill = "#f1f5f9";
const initialCenter: [number, number] = [36.5, 138.4];
const initialZoom = 4.4;

export function InteractiveJapanMap({
  sites,
  carrierOffices,
  carrierAssignments,
  warningBySiteId,
  highlightedSiteId,
  highlightedCarrierOfficeId,
}: {
  sites: Site[];
  carrierOffices: CarrierOffice[];
  carrierAssignments: CarrierAssignment[];
  warningBySiteId: Map<string, number>;
  highlightedSiteId?: string | null;
  highlightedCarrierOfficeId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const prefectureLayerRef = useRef<LeafletNS.GeoJSON | null>(null);
  const linksLayerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const siteLayerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const carrierLayerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const [mode, setMode] = useState<"sites" | "heatmap" | "links">("sites");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(4.4);
  const [prefectureCount, setPrefectureCount] = useState(0);
  const [mapInitialized, setMapInitialized] = useState(false);
  const siteCountByPrefecture = useMemo(
    () => getSiteCountByPrefecture(sites),
    [sites],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        const L = await import("leaflet");
        if (!containerRef.current || cancelled) return;
        leafletRef.current = L;

        const map = L.map(containerRef.current, {
          zoomControl: false,
          minZoom: 3,
          maxZoom: 11,
          zoomSnap: 0.25,
          worldCopyJump: false,
          preferCanvas: true,
        });
        mapRef.current = map;
        L.control.zoom({ position: "topright" }).addTo(map);

        map.setView(initialCenter, initialZoom);
        setZoomLevel(Number(map.getZoom().toFixed(2)));

        const carrierLayer = L.layerGroup().addTo(map);
        const siteLayer = L.layerGroup().addTo(map);
        const linksLayer = L.layerGroup().addTo(map);
        carrierLayerRef.current = carrierLayer;
        siteLayerRef.current = siteLayer;
        linksLayerRef.current = linksLayer;
        setMapInitialized(true);

        map.on("zoomend", () => {
          setZoomLevel(Number(map.getZoom().toFixed(2)));
        });

        const observer = new ResizeObserver(() => {
          map.invalidateSize();
        });
        observer.observe(containerRef.current);
        map.on("remove", () => observer.disconnect());

        const response = await fetch("/japan-prefectures.geojson");
        if (!response.ok)
          throw new Error("Failed to fetch japan-prefectures.geojson");
        const geojson = (await response.json()) as GeoJsonFeatureCollection;
        if (cancelled) return;
        setPrefectureCount(geojson.features.length);

        const prefectureLayer = L.geoJSON(geojson as GeoJsonObject, {
          style: (feature?: Feature) => {
            return {
              color: "#000000",
              weight: 1.1,
              fillColor: prefectureFill,
              fillOpacity: 0.35,
            };
          },
        }).addTo(map);

        prefectureLayerRef.current = prefectureLayer;
        prefectureLayer.bringToBack();
        setStatus("ready");
      } catch (mapError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            mapError instanceof Error ? mapError.message : "Map setup failed",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      prefectureLayerRef.current = null;
      linksLayerRef.current = null;
      siteLayerRef.current = null;
      carrierLayerRef.current = null;
      leafletRef.current = null;
      setMapInitialized(false);
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const prefectureLayer = prefectureLayerRef.current;
    const siteLayer = siteLayerRef.current;
    const carrierLayer = carrierLayerRef.current;
    const linksLayer = linksLayerRef.current;
    if (!L || !map || !siteLayer || !carrierLayer || !linksLayer) return;

    siteLayer.clearLayers();
    carrierLayer.clearLayers();
    linksLayer.clearLayers();

    for (const site of sites) {
      const warnings = warningBySiteId.get(site.id) ?? 0;
      const isHeatmap = mode === "heatmap";
      const isHighlighted = highlightedSiteId === site.id;
      const circle = L.circleMarker([site.latitude, site.longitude], {
        radius: isHighlighted
          ? 8
          : isHeatmap
            ? 8
            : site.priority === "高"
              ? 6
              : site.priority === "中"
                ? 5
                : 4,
        color: isHighlighted ? "#111827" : "#ffffff",
        weight: isHighlighted ? 2 : 1.2,
        fillColor: isHeatmap ? "#0ea5e9" : getDifficultyColor(site.difficulty),
        fillOpacity: isHighlighted ? 1 : isHeatmap ? 0.38 : 0.95,
      }).bindPopup(
        `<strong>${site.name}</strong><br/>${site.region} / ${site.prefecture}<br/>Difficulty: ${site.difficulty}<br/>Warnings: ${warnings}`,
      );
      siteLayer.addLayer(circle);

      if (warnings > 0 || isHeatmap) {
        const halo = L.circle([site.latitude, site.longitude], {
          radius: isHeatmap ? 26000 : 15000,
          color: isHeatmap ? "#0284c7" : "#f59e0b",
          weight: isHeatmap ? 0.5 : 1,
          fillColor: isHeatmap ? "#38bdf8" : "#fbbf24",
          fillOpacity: isHeatmap ? 0.12 : 0.1,
        });
        siteLayer.addLayer(halo);
      }
    }

    for (const office of carrierOffices) {
      const isHighlighted = highlightedCarrierOfficeId === office.id;
      const marker = L.circleMarker([office.latitude, office.longitude], {
        radius: isHighlighted ? 8 : 6,
        color: "#ffffff",
        weight: isHighlighted ? 2 : 1.4,
        fillColor: isHighlighted ? "#1d4ed8" : "#111827",
        fillOpacity: 1,
      }).bindPopup(
        `<strong>${office.name}</strong><br/>Capacity: ${office.monthlyCapacity}/month`,
      );
      carrierLayer.addLayer(marker);
    }

    const siteById = new Map(sites.map((site) => [site.id, site]));
    const officeById = new Map(
      carrierOffices.map((office) => [office.id, office]),
    );

    for (const assignment of carrierAssignments) {
      const site = siteById.get(assignment.siteId);
      const office = officeById.get(assignment.carrierOfficeId);
      if (!site || !office) continue;
      const isHighlighted =
        highlightedSiteId === site.id &&
        highlightedCarrierOfficeId === office.id;

      const link = L.polyline(
        [
          [office.latitude, office.longitude],
          [site.latitude, site.longitude],
        ],
        {
          color: isHighlighted ? "#1d4ed8" : "#475569",
          weight: isHighlighted ? 2.4 : mode === "links" ? 1.2 : 0.8,
          opacity: isHighlighted ? 0.95 : mode === "links" ? 0.45 : 0.12,
        },
      );
      linksLayer.addLayer(link);
    }

    if (prefectureLayer) {
      prefectureLayer.setStyle((feature?: Feature) => {
        return {
          color: "#000000",
          weight: 1.1,
          fillColor: prefectureFill,
          fillOpacity: mode === "heatmap" ? 0.18 : 0.35,
        };
      });
      prefectureLayer.bringToBack();
    }
    linksLayer.eachLayer((layer) => {
      if ("bringToFront" in layer && typeof layer.bringToFront === "function")
        layer.bringToFront();
    });
    siteLayer.eachLayer((layer) => {
      if ("bringToFront" in layer && typeof layer.bringToFront === "function")
        layer.bringToFront();
    });
    carrierLayer.eachLayer((layer) => {
      if ("bringToFront" in layer && typeof layer.bringToFront === "function")
        layer.bringToFront();
    });

    map.invalidateSize();
  }, [
    carrierAssignments,
    carrierOffices,
    highlightedCarrierOfficeId,
    highlightedSiteId,
    mapInitialized,
    mode,
    siteCountByPrefecture,
    sites,
    warningBySiteId,
  ]);

  return (
    <div className="relative h-full min-h-[380px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:min-h-[520px]">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-white/80">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700">
            {status === "loading" ? "Loading map..." : `Map error: ${error}`}
          </div>
        </div>
      )}

      <div className="pointer-events-auto absolute left-3 top-3 z-[1200] flex max-w-[calc(100%-1.5rem)] overflow-x-auto rounded-md border border-zinc-200 bg-white p-1 shadow-sm">
        {[
          ["sites", "Sites"],
          ["heatmap", "Heatmap"],
          ["links", "Carrier links"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key as "sites" | "heatmap" | "links")}
            className={`h-8 shrink-0 rounded px-3 text-xs font-medium ${
              mode === key
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[1200] hidden rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 shadow-sm sm:block">
        Scroll / pinch to zoom. Drag to pan. status:{status} / zoom:{zoomLevel}
        <div className="mt-0.5 text-[11px] text-zinc-500">
          pref:{prefectureCount} sites:{sites.length} carriers:
          {carrierOffices.length} links:{carrierAssignments.length}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const map = mapRef.current;
          if (!map) return;
          map.setView(initialCenter, initialZoom, {
            animate: true,
            duration: 0.5,
          });
          setZoomLevel(Number(initialZoom.toFixed(2)));
        }}
        className="pointer-events-auto absolute bottom-3 left-3 z-[1200] h-8 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm hover:border-blue-300 hover:bg-blue-50"
      >
        Reset view
      </button>
    </div>
  );
}
