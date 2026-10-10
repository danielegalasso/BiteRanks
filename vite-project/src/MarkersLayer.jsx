import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useMap } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import createClusterCustomIcon from "./CreateClusterCustomIcon";
import createCustomIcon from "./CreateCustomIcon";
import SchedaLocale from "./scheda/SchedaLocale";

// Quanto lavoro fare per ogni frame quando si aggiungono marker: oltre questa soglia si cede
// il controllo al browser, così la mappa resta fluida e i marker compaiono un po' alla volta.
const FRAME_BUDGET_MS = 25;

// Trasforma la struttura dei markers ({classifica: [{subclassifica: [locale, ...]}, ...]})
// in una mappa chiave -> dati del singolo marker. La chiave è stabile tra un aggiornamento e l'altro,
// così quando arriva un nuovo file si aggiungono solo i suoi marker.
function flattenMarkers(markers) {
  const nomeChiaveJson = Object.keys(markers);
  const result = new Map();
  Object.entries(markers).forEach(([classificaKey, classifica]) => {
    classifica.forEach((subclassifica) => {
      Object.entries(subclassifica).forEach(([categoryKey, category]) => {
        category.forEach((locale, localeIndex) => {
          (locale.coord || []).forEach((coords, coordsIndex) => {
            const key = `${classificaKey}|${categoryKey}|${localeIndex}|${coordsIndex}`;
            result.set(key, {
              locale,
              coords,
              categoryKey,
              useCategoryColor: !nomeChiaveJson.includes(locale.ranking),
            });
          });
        });
      });
    });
  });
  return result;
}

// La scheda viene renderizzata solo quando il popup si apre, non per ogni marker
function bindScheda(marker, { locale, coords }) {
  marker.bindPopup(() => {
    if (!marker._schedaEl) {
      const el = document.createElement("div");
      const root = createRoot(el);
      flushSync(() => {
        root.render(
          <SchedaLocale
            nome={locale.name}
            nomeClassifica={locale.ranking}
            subclassifiche={[[locale["sub-ranking"], locale.position, locale.ref]]}
            linkGoogleMaps={`https://www.google.com/maps?q=${coords[0]},${coords[1]}`}
            linkIndicazioniMaps={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
            linkSitoWeb={locale.website}
            coords={coords}
          />
        );
      });
      marker._schedaEl = el;
      marker._schedaRoot = root;
    }
    return marker._schedaEl;
  });
  marker.on("popupclose", () => {
    const root = marker._schedaRoot;
    marker._schedaEl = null;
    marker._schedaRoot = null;
    if (root) setTimeout(() => root.unmount(), 0);
  });
}

function createMarker(data) {
  const icon = createCustomIcon(data.locale.ranking, data.categoryKey, data.locale.position, data.useCategoryColor);
  const marker = L.marker(data.coords, { icon });
  bindScheda(marker, data);
  return marker;
}

export default function MarkersLayer({ markers }) {
  const map = useMap();
  const [searchParams] = useSearchParams();
  const groupRef = useRef(null);
  const layersRef = useRef(new Map()); // chiave -> L.Marker presente (o in coda) sulla mappa
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const sharedOpenedRef = useRef(false);

  useEffect(() => {
    const group = L.markerClusterGroup({ iconCreateFunction: createClusterCustomIcon });
    group.addTo(map);
    groupRef.current = group;
    window.globalClusters = group; // usato da pannelli e pulsanti fuori dalla mappa
    window.globalMarkers = {};
    return () => {
      clearTimeout(timerRef.current);
      map.removeLayer(group);
      groupRef.current = null;
      layersRef.current = new Map();
      queueRef.current = [];
    };
  }, [map]);

  // Se l'URL è il link condiviso di una scheda, apre il popup appena il marker è sulla mappa
  const openSharedMarker = () => {
    if (sharedOpenedRef.current) return;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng || !searchParams.get("ranking") || !searchParams.get("subranking")) return;
    const target = L.latLng(parseFloat(lat), parseFloat(lng));
    const marker = [...layersRef.current.values()].find((m) => m._added && m.getLatLng().equals(target));
    if (marker) {
      sharedOpenedRef.current = true;
      groupRef.current.zoomToShowLayer(marker, () => marker.openPopup());
    }
  };

  const processQueue = () => {
    timerRef.current = null;
    const group = groupRef.current;
    if (!group) return;
    const start = performance.now();
    const batch = [];
    // marker creati finché c'è tempo nel frame, poi aggiunti al cluster in un'unica operazione
    while (queueRef.current.length && performance.now() - start < FRAME_BUDGET_MS) {
      const marker = queueRef.current.shift();
      if (marker._removed) continue;
      marker._added = true;
      batch.push(marker);
    }
    if (batch.length) group.addLayers(batch);
    openSharedMarker();
    if (queueRef.current.length) timerRef.current = setTimeout(processQueue, 0);
  };

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const desired = flattenMarkers(markers);
    const current = layersRef.current;

    const toRemove = [];
    for (const [key, marker] of current) {
      if (!desired.has(key)) {
        marker._removed = true;
        if (marker._added) toRemove.push(marker);
        current.delete(key);
        delete window.globalMarkers[key];
      }
    }
    if (toRemove.length) group.removeLayers(toRemove);

    for (const [key, data] of desired) {
      if (current.has(key)) continue;
      const marker = createMarker(data);
      current.set(key, marker);
      window.globalMarkers[key] = marker;
      queueRef.current.push(marker);
    }
    if (queueRef.current.length && !timerRef.current) timerRef.current = setTimeout(processQueue, 0);
  }, [markers]);

  return null;
}
