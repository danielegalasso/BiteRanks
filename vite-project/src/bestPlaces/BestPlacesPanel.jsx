import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMap, Popup } from "react-leaflet";
import L from "leaflet";
import SchedaLocale from "../scheda/SchedaLocale";
import { buildPlaces, bestPlacesIn, badgeText, entriesOf } from "./placeScore";
import "./BestPlacesPanel.css";

const PAGE_SIZE = 10;

// Pannello "I migliori in zona": classifica unica dei locali selezionati (categorie di cibo o classifiche)
// limitata a ciò che è visibile sulla mappa. Si apre dal bottone ⛶ sotto la barra di ricerca.
const BestPlacesPanel = ({ open, onClose, markers }) => {
  const map = useMap();
  const [bounds, setBounds] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [focused, setFocused] = useState(null); // { place, location } per la scheda aperta dal pannello
  const panelRef = useRef(null);

  // i click e lo scroll sul pannello non devono muovere la mappa
  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      setBounds(map.getBounds());
      setLimit(PAGE_SIZE);
    };
    update();
    map.on("moveend", update);
    return () => map.off("moveend", update);
  }, [open, map]);

  // si ricalcola solo a pannello aperto: i marker arrivano un file alla volta
  const places = useMemo(() => (open ? buildPlaces(entriesOf(markers)) : []), [open, markers]);
  const hasSelection = Object.keys(markers || {}).length > 0;

  const { list, total } = useMemo(() => {
    if (!bounds) return { list: [], total: 0 };
    return bestPlacesIn(places, bounds, limit);
  }, [places, bounds, limit]);

  // la scheda aperta dal pannello riunisce tutte le classifiche del locale
  const showPlace = useCallback((place) => {
    const location = place.visibleLocations[0];
    map.closePopup();
    map.flyTo(location.coord, Math.max(map.getZoom(), 16), { duration: 0.8 });
    setFocused({ place, location });
  }, [map]);

  return (
    <>
      {open && (
        <div ref={panelRef} className="best-places-panel" role="dialog" aria-label="I migliori in zona">
          <div className="best-places-header">
            <div>
              <h2 className="best-places-title">⛶ I migliori in zona</h2>
              <p className="best-places-subtitle">
                {hasSelection
                  ? `${total} ${total === 1 ? "locale premiato" : "locali premiati"} nell'area visibile`
                  : "Nessuna categoria o classifica selezionata"}
              </p>
            </div>
            <button className="best-places-close" onClick={onClose} aria-label="Chiudi">
              ✕
            </button>
          </div>

          <div className="best-places-body">
            {!hasSelection && (
              <p className="best-places-empty">
                Scegli una o più categorie di cibo o classifiche con il bottone di modifica: qui compariranno i
                migliori locali della zona che stai guardando.
              </p>
            )}

            {hasSelection && total === 0 && (
              <p className="best-places-empty">
                Nessun locale in classifica in quest’area. Prova a rimpicciolire la mappa.
              </p>
            )}

            <ol className="best-places-list">
              {list.map((place, index) => (
                <li key={place.id}>
                  <button className="best-places-item" onClick={() => showPlace(place)}>
                    <span className={`best-places-rank ${index < 3 ? `podium-${index + 1}` : ""}`}>{index + 1}</span>
                    <span className="best-places-info">
                      <span className="best-places-name">
                        <span className="best-places-emoji" aria-hidden="true">{place.emoji}</span> {place.name}
                      </span>
                      <span className="best-places-address">
                        {place.visibleLocations[0].address}
                        {place.visibleLocations.length > 1 && ` · ${place.visibleLocations.length} sedi in zona`}
                      </span>
                      <span className="best-places-badges">
                        {place.appearances.map((appearance, i) => (
                          <span key={appearance.subRanking} className={`best-places-badge ${i === 0 ? "is-best" : ""}`} title={`${appearance.position ? `${appearance.position} ` : ""}${appearance.subRanking}`}>
                            {badgeText(appearance)}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {total > list.length && (
              <button className="best-places-more" onClick={() => setLimit(limit + PAGE_SIZE)}>
                Mostra altri ({total - list.length})
              </button>
            )}
          </div>
        </div>
      )}

      {focused && (
        <Popup
          key={`${focused.place.id}-${focused.location.coord.join(",")}`}
          position={focused.location.coord}
          eventHandlers={{ remove: () => setFocused(null) }}
        >
          <SchedaLocale
            nome={focused.place.name}
            nomeClassifica={focused.place.appearances[0].ranking}
            subclassifiche={focused.place.appearances.map((a) => [a.subRanking, a.position, a.ref])}
            linkGoogleMaps={`https://www.google.com/maps?q=${focused.location.coord[0]},${focused.location.coord[1]}`}
            linkIndicazioniMaps={`https://www.google.com/maps/dir/?api=1&destination=${focused.location.coord[0]},${focused.location.coord[1]}`}
            linkSitoWeb={focused.place.website}
            coords={focused.location.coord}
          />
        </Popup>
      )}
    </>
  );
};

export default BestPlacesPanel;
