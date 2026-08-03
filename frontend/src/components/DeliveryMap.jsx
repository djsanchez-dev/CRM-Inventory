import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima (fallback)

// Dashed pattern used for the "suggested route" (store → destination) shown
// before the rider starts sharing their GPS.
const DASH_ICON = [
  {
    icon: { path: 'M 0 -1 1 0 0 1 -1 0 0 -1', strokeColor: '#94a3b8', scale: 2.5 },
    offset: '0',
    repeat: '14px',
  },
];

/**
 * Compute a road-following route (DRIVING) between two points.
 *
 * PRIMARY: the modern Routes API (New) via a REST fetch. The legacy
 * google.maps.DirectionsService is no longer enabled on many projects
 * (REQUEST_DENIED), which made the map silently fall back to a straight
 * line that crosses buildings instead of following the streets.
 *
 * FALLBACK: legacy DirectionsService, kept in case the new API is
 * unavailable on some project.
 *
 * Returns { path, distance, duration } or null when routing fails.
 */
async function computeRoadRoute(origin, destination) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (key) {
    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: 'DRIVE',
        }),
      });
      const data = await res.json();
      if (data && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const encoded = route.polyline && route.polyline.encodedPolyline;
        if (encoded && window.google && window.google.maps && window.google.maps.geometry) {
          const path = window.google.maps.geometry.encoding.decodePath(encoded);
          const leg = route.legs && route.legs[0];
          const distance =
            leg && leg.distanceMeters != null
              ? `${(leg.distanceMeters / 1000).toFixed(1).replace('.', ',')} km`
              : null;
          // duration arrives as a string ("1221s") in v2, or as
          // { seconds } in newer releases — normalize both.
          let durSeconds = null;
          if (leg && leg.duration != null) {
            durSeconds =
              typeof leg.duration === 'string'
                ? parseInt(leg.duration, 10)
                : Number(leg.duration.seconds);
            if (!isFinite(durSeconds)) durSeconds = null;
          }
          const duration = durSeconds != null ? `${Math.round(durSeconds / 60)} min` : null;
          return { path, distance, duration };
        }
      }
    } catch (e) {
      // fall through to the legacy service below
    }
  }

  // Legacy fallback (only when the Routes API is unavailable or fails)
  const maps = window.google && window.google.maps;
  if (!maps || !maps.DirectionsService) return null;
  try {
    const result = await new Promise((resolve) => {
      new maps.DirectionsService().route(
        { origin, destination, travelMode: maps.TravelMode.DRIVING },
        (res, status) => resolve(status === 'OK' ? res : null)
      );
    });
    if (result && result.routes && result.routes[0]) {
      const route = result.routes[0];
      const leg = route.legs && route.legs[0];
      return {
        path: route.overview_path,
        distance: leg && leg.distance ? leg.distance.text : null,
        duration: leg && leg.duration ? leg.duration.text : null,
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/** Circular badge marker (SVG data URI) with an emoji glyph and soft shadow */
function badgeIcon(maps, emoji, color, size = 44) {
  const s = size;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#0f172a" flood-opacity="0.3"/>
  </filter></defs>
  <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 0.5}" fill="#ffffff" filter="url(#s)"/>
  <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 5}" fill="${color}"/>
  <text x="${s / 2}" y="${Math.round(s / 2 + s * 0.2)}" font-size="${Math.round(s * 0.55)}" text-anchor="middle">${emoji}</text>
</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(s, s),
    anchor: new maps.Point(s / 2, s / 2),
  };
}

/**
 * DeliveryMap — Google Maps for the public tracking page.
 *
 * Shows:
 *  - store marker (🏪, origin from business config)
 *  - destination marker (📍, geocoded from the delivery address)
 *  - the delivery person as a MOTORCYCLE (🛵) that moves in real time
 *  - the suggested route (dashed, store → destination) while the rider
 *    hasn't shared GPS, upgraded to the LIVE road route (solid, rider →
 *    destination) with remaining distance / ETA once GPS arrives
 *
 * Optimization notes:
 *  - DirectionsService is only called when the rider moves ≥ 50 m, so a paid
 *    Directions call isn't made on every 6 s poll.
 *  - The suggested route is requested once per destination.
 *  - Stale Directions callbacks are ignored via a sequence counter.
 *
 * Falls back to a centered map / graceful message when the API key is missing.
 */
export default function DeliveryMap({ storeLocation, driverPos, destAddress, destCoords }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const destLatLngRef = useRef(null); // geocoded destination position
  const polylineRef = useRef(null);
  const boundsRef = useRef(null);
  const directionsSeqRef = useRef(0); // ignore stale DirectionsService callbacks
  const lastRoutePosRef = useRef(null); // skip Directions calls until meaningful movement
  const hasRoadRouteRef = useRef(false); // a real road route is on screen
  const plannedRouteRef = useRef(false); // suggested route requested once
  const [state, setState] = useState('loading'); // loading | ready | error
  const [destGeocoded, setDestGeocoded] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration } from Directions

  // Haversine distance in meters between two {lat,lng} points
  const distanceMeters = (a, b) => {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const hasOrigin = !!(storeLocation && isNum(storeLocation.lat) && isNum(storeLocation.lng));
  const hasDriver = !!(driverPos && isNum(driverPos.lat) && isNum(driverPos.lng));

  /** Reuse a single polyline, restyling it per route kind (planned/live) */
  const ensurePolyline = (maps, color, dashed = false) => {
    if (polylineRef.current) {
      polylineRef.current.setOptions({
        strokeColor: color,
        icons: dashed ? DASH_ICON : null,
      });
      return;
    }
    polylineRef.current = new maps.Polyline({
      map: mapRef.current,
      path: [],
      strokeColor: color,
      strokeOpacity: 0.95,
      strokeWeight: 4,
      icons: dashed ? DASH_ICON : null,
    });
  };

  // Load the map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: hasOrigin
            ? { lat: storeLocation.lat, lng: storeLocation.lng }
            : hasDriver
              ? { lat: driverPos.lat, lng: driverPos.lng }
              : DEFAULT_CENTER,
          zoom: 14,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
        });
        mapRef.current = map;
        boundsRef.current = new maps.LatLngBounds();
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Place store marker
  useEffect(() => {
    if (state !== 'ready' || !hasOrigin || !mapRef.current || storeMarkerRef.current) return;
    const maps = window.google.maps;
    storeMarkerRef.current = new maps.Marker({
      map: mapRef.current,
      position: { lat: storeLocation.lat, lng: storeLocation.lng },
      title: 'Tienda',
      icon: badgeIcon(maps, '🏪', '#0ea5e9', 40),
    });
    boundsRef.current.extend(storeMarkerRef.current.getPosition());
    mapRef.current.fitBounds(boundsRef.current, 60);
  }, [state, hasOrigin, storeLocation]);

  // Place destination marker — from saved coordinates when available (the
  // taxi-style picker stores them), otherwise geocode the address text.
  useEffect(() => {
    if (state !== 'ready' || !mapRef.current || destMarkerRef.current) return;
    const maps = window.google.maps;
    // Accepts either a Google LatLng instance (geocoder result) or a plain
    // { lat, lng } object (saved picker coordinates) and normalizes it.
    const dropMarker = (latlng) => {
      const lat = typeof latlng.lat === 'function' ? latlng.lat() : latlng.lat;
      const lng = typeof latlng.lng === 'function' ? latlng.lng() : latlng.lng;
      const position = { lat, lng };
      destMarkerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
        title: 'Destino',
        icon: badgeIcon(maps, '📍', '#ef4444', 40),
      });
      destLatLngRef.current = position;
      setDestGeocoded(true);
      boundsRef.current.extend(destMarkerRef.current.getPosition());
      mapRef.current.fitBounds(boundsRef.current, 60);
    };

    if (destCoords && isNum(destCoords.lat) && isNum(destCoords.lng)) {
      dropMarker({ lat: destCoords.lat, lng: destCoords.lng });
      return;
    }
    if (!destAddress) return;

    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address: destAddress }, (results, status) => {
      if (status === 'OK' && results && results[0] && mapRef.current) {
        dropMarker(results[0].geometry.location);
      }
    });
  }, [state, destAddress, destCoords]);

  // Suggested route: store → destination (dashed). Requested once so the
  // customer immediately sees the planned route before the rider shares GPS.
  useEffect(() => {
    if (state !== 'ready' || hasDriver || !hasOrigin || !destGeocoded || !destLatLngRef.current) return;
    if (plannedRouteRef.current) return;
    plannedRouteRef.current = true;
    const maps = window.google.maps;
    const origin = { lat: storeLocation.lat, lng: storeLocation.lng };
    const dest = destLatLngRef.current;

    const drawSuggested = (path) => {
      ensurePolyline(maps, '#94a3b8', true);
      polylineRef.current.setPath(path);
    };

    // Road-following route via the Routes API (New) — falls back to the
    // legacy DirectionsService internally. Only a straight dashed line is
    // drawn as a last resort when routing is completely unavailable.
    computeRoadRoute(origin, dest).then((result) => {
      if (!mapRef.current || driverMarkerRef.current) return; // live mode won
      if (result && result.path) {
        ensurePolyline(maps, '#94a3b8', true);
        polylineRef.current.setPath(result.path);
        if (result.distance) setRouteInfo({ distance: result.distance, duration: result.duration });
      } else {
        drawSuggested([origin, dest]);
      }
    });
  }, [state, hasDriver, hasOrigin, destGeocoded, storeLocation]);

  // Draw / redraw the LIVE route: rider → destination, following real roads
  // when the Directions API is available. The viewport is only re-fitted the
  // first time the rider appears so the map doesn't keep zooming out on polls.
  useEffect(() => {
    if (state !== 'ready' || !mapRef.current || !hasDriver) return;
    const maps = window.google.maps;

    const pos = { lat: driverPos.lat, lng: driverPos.lng };
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(pos);
    } else {
      // Transitioning to live mode: clear the planned-route chip so the
      // distance/duration shown is the live one (not the planned one).
      setRouteInfo(null);
      driverMarkerRef.current = new maps.Marker({
        map: mapRef.current,
        position: pos,
        title: 'Repartidor',
        icon: badgeIcon(maps, '🛵', '#6366f1', 50),
      });
      boundsRef.current.extend(pos);
      mapRef.current.fitBounds(boundsRef.current, 60);
    }

    const dest = destLatLngRef.current;
    if (!dest) return;
    const destPos = { lat: dest.lat, lng: dest.lng };

    // Only re-request the road route when the rider moved meaningfully
    // (>= 50 m) to avoid paying for a Directions API call on every poll.
    const last = lastRoutePosRef.current;
    const moved = !last || distanceMeters(last, pos) >= 50;
    if (!moved) return;
    lastRoutePosRef.current = pos;

    // Live route replaces the planned dashed line with the solid live line
    // (only restyled on meaningful movement — the marker itself keeps moving
    // on every poll above).
    ensurePolyline(maps, '#6366f1', false);

    // Interim: straight line to the new position while Directions is in flight
    // (keeps the placeholder correct on the very first request).
    if (!hasRoadRouteRef.current) {
      polylineRef.current.setPath([pos, destPos]);
    }

    const seq = ++directionsSeqRef.current;
    const updateWithDirections = (result) => {
      if (directionsSeqRef.current !== seq || !result || !result.path || !polylineRef.current) return;
      hasRoadRouteRef.current = true;
      polylineRef.current.setPath(result.path);
      if (result.distance) setRouteInfo({ distance: result.distance, duration: result.duration });
    };

    // Road-following live route via the Routes API (New) with legacy
    // fallback. The straight-line interim (set above) only stays if routing
    // is completely unavailable.
    computeRoadRoute(pos, destPos).then(updateWithDirections);
  }, [state, hasDriver, driverPos]);

  if (state === 'error') {
    return (
      <div className="delivery-map delivery-map-error">
        <div className="delivery-map-error-content">
          <span className="delivery-map-error-title">Mapa no disponible</span>
          <span className="delivery-map-error-sub">
            Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa en tiempo real.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-map">
      <div
        ref={containerRef}
        className="delivery-map-canvas"
        style={{ width: '100%', height: 320 }}
      />
      {routeInfo && state === 'ready' && (
        <div className="delivery-map-chip">
          <span className="delivery-map-chip-dot" />
          <span>{hasDriver ? 'Ruta en vivo' : 'Ruta sugerida'}</span>
          {routeInfo.distance && (
            <>
              <span className="delivery-map-chip-sep">·</span>
              <span>{routeInfo.distance}</span>
            </>
          )}
          {routeInfo.duration && (
            <>
              <span className="delivery-map-chip-sep">·</span>
              <span>~{routeInfo.duration}</span>
            </>
          )}
        </div>
      )}
      {state === 'loading' && (
        <div className="delivery-map-loading">Cargando mapa...</div>
      )}
    </div>
  );
}
