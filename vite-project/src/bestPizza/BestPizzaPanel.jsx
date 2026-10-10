import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMap, Popup } from "react-leaflet";
import L from "leaflet";
import SchedaLocale from "../scheda/SchedaLocale";
import { buildPizzerias, bestPizzeriasIn, badgeText } from "./pizzaScore";
import "./BestPizzaPanel.css";

const PAGE_SIZE = 10;

// Pannello "Migliori pizze in zona": classifica unica di tutte le classifiche pizza
// (50 Top Pizza, Gambero Rosso, ...) limitata a ciò che è visibile sulla mappa.
const BestPizzaPanel = () => {
  const map = useMap();
  const [open, setOpen] = useState(false);
  const [pizzerias, setPizzerias] = useState(null);
  const [error, setError] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [focused, setFocused] = useState(null); // { pizzeria, location } per la scheda aperta dal pannello
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  // i click e lo scroll sul pannello non devono muovere la mappa
  useEffect(() => {
    [panelRef.current, toggleRef.current].forEach((el) => {
      if (el) {
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
      }
    });
  }, [open]);

  // i dati vengono caricati solo alla prima apertura
  useEffect(() => {
    if (!open || pizzerias) return;
    fetch("/food/Pizza.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => setPizzerias(buildPizzerias(data.Pizza || [])))
      .catch((err) => {
        console.error("Errore nel caricamento delle pizzerie:", err);
        setError(true);
      });
  }, [open, pizzerias]);

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

  const { list, total } = useMemo(() => {
    if (!pizzerias || !bounds) return { list: [], total: 0 };
    return bestPizzeriasIn(pizzerias, bounds, limit);
  }, [pizzerias, bounds, limit]);

  // la scheda aperta dal pannello riunisce tutte le classifiche della pizzeria
  const showPizzeria = useCallback((pizzeria) => {
    const location = pizzeria.visibleLocations[0];
    map.closePopup();
    map.flyTo(location.coord, Math.max(map.getZoom(), 16), { duration: 0.8 });
    setFocused({ pizzeria, location });
  }, [map]);

  return (
    <>
      <button
        ref={toggleRef}
        className={`best-pizza-toggle ${open ? "is-open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Migliori pizze in zona"
      >
        <span aria-hidden="true">🍕</span>
        <span className="best-pizza-toggle-text">Top pizza in zona</span>
      </button>

      {open && (
        <div ref={panelRef} className="best-pizza-panel" role="dialog" aria-label="Migliori pizze in zona">
          <div className="best-pizza-header">
            <div>
              <h2 className="best-pizza-title">🏆 Migliori pizze in zona</h2>
              <p className="best-pizza-subtitle">
                {pizzerias
                  ? `${total} ${total === 1 ? "pizzeria premiata" : "pizzerie premiate"} nell'area visibile`
                  : "Caricamento classifiche…"}
              </p>
            </div>
            <button className="best-pizza-close" onClick={() => setOpen(false)} aria-label="Chiudi">
              ✕
            </button>
          </div>

          <div className="best-pizza-body">
            {error && <p className="best-pizza-empty">Impossibile caricare le classifiche. Riprova più tardi.</p>}

            {pizzerias && total === 0 && (
              <p className="best-pizza-empty">
                Nessuna pizzeria in classifica in quest’area. Prova a rimpicciolire la mappa.
              </p>
            )}

            <ol className="best-pizza-list">
              {list.map((pizzeria, index) => (
                <li key={pizzeria.id}>
                  <button className="best-pizza-item" onClick={() => showPizzeria(pizzeria)}>
                    <span className={`best-pizza-rank ${index < 3 ? `podium-${index + 1}` : ""}`}>{index + 1}</span>
                    <span className="best-pizza-info">
                      <span className="best-pizza-name">{pizzeria.name}</span>
                      <span className="best-pizza-address">
                        {pizzeria.visibleLocations[0].address}
                        {pizzeria.visibleLocations.length > 1 && ` · ${pizzeria.visibleLocations.length} sedi in zona`}
                      </span>
                      <span className="best-pizza-badges">
                        {pizzeria.appearances.map((appearance, i) => (
                          <span key={appearance.subRanking} className={`best-pizza-badge ${i === 0 ? "is-best" : ""}`} title={`${appearance.position ? `${appearance.position} ` : ""}${appearance.subRanking}`}>
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
              <button className="best-pizza-more" onClick={() => setLimit(limit + PAGE_SIZE)}>
                Mostra altre ({total - list.length})
              </button>
            )}
          </div>
        </div>
      )}

      {focused && (
        <Popup
          key={`${focused.pizzeria.id}-${focused.location.coord.join(",")}`}
          position={focused.location.coord}
          eventHandlers={{ remove: () => setFocused(null) }}
        >
          <SchedaLocale
            nome={focused.pizzeria.name}
            nomeClassifica={focused.pizzeria.appearances[0].ranking}
            subclassifiche={focused.pizzeria.appearances.map((a) => [a.subRanking, a.position, a.ref])}
            linkGoogleMaps={`https://www.google.com/maps?q=${focused.location.coord[0]},${focused.location.coord[1]}`}
            linkIndicazioniMaps={`https://www.google.com/maps/dir/?api=1&destination=${focused.location.coord[0]},${focused.location.coord[1]}`}
            linkSitoWeb={focused.pizzeria.website}
            coords={focused.location.coord}
          />
        </Popup>
      )}
    </>
  );
};

export default BestPizzaPanel;
