"use client";

import { useEffect, useRef } from "react";

import { cn } from "@louez/utils";

interface StoreMapProps {
  latitude: number;
  longitude: number;
  storeName: string;
  address?: string;
  className?: string;
  interactive?: boolean;
  showZoomControl?: boolean;
  tileTheme?: "auto" | "light" | "dark";
  zoom?: number;
}

const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" aria-hidden="true"><path fill="#dc2626" stroke="#fff" stroke-width="2" d="M18 1C8.6 1 1 8.6 1 18c0 12.8 17 29 17 29s17-16.2 17-29C35 8.6 27.4 1 18 1Z"/><circle cx="18" cy="18" r="6" fill="#fff"/></svg>`;

export const StoreMap = ({
  latitude,
  longitude,
  storeName,
  address,
  className,
  interactive = true,
  showZoomControl = true,
  zoom = 14,
}: StoreMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let cleanup = () => {};

    void import("leaflet").then((leaflet) => {
      if (disposed || !containerRef.current) return;

      const map = leaflet.map(containerRef.current, {
        center: [latitude, longitude],
        zoom,
        zoomControl: showZoomControl,
        // The default prefix carries a flag; the OSM credit below is the licence requirement.
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        touchZoom: interactive,
      });
      leaflet.control.attribution({ prefix: false }).addTo(map);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      const icon = leaflet.divIcon({
        html: markerSvg,
        className: "border-0 bg-transparent",
        iconSize: [36, 48],
        iconAnchor: [18, 48],
        popupAnchor: [0, -44],
      });
      const marker = leaflet.marker([latitude, longitude], { icon, title: storeName }).addTo(map);
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = storeName;
      popup.append(title);

      if (address) {
        const addressLine = document.createElement("p");
        addressLine.className = "mt-1";
        addressLine.textContent = `Забрать товары: ${address}`;
        popup.append(addressLine);

        const route = document.createElement("a");
        route.className = "mt-2 inline-block font-medium underline";
        route.href = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}`;
        route.target = "_blank";
        route.rel = "noopener noreferrer";
        route.textContent = "Построить маршрут";
        popup.append(route);
      }

      marker.bindPopup(popup);
      window.setTimeout(() => map.invalidateSize(), 0);
      cleanup = () => map.remove();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [address, interactive, latitude, longitude, showZoomControl, storeName, zoom]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Карта: ${storeName}`}
      // isolate: Leaflet's panes (z-index up to 1000) stay inside the map and
      // cannot paint over the sticky store header.
      className={cn("isolate relative h-full min-h-full w-full", className)}
      data-slot="store-map"
    />
  );
};
