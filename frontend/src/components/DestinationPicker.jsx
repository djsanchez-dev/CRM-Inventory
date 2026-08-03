import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';
import { Search, MapPin, Loader } from '../components/Icons';

const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima (fallback)
const SEARCH_MIN = 3; // min chars before geocoding

function isNum(v) {
  return typeof v === 'number' && isFinite(v);
}

/**
 * DestinationPicker — taxi-app style destination selector (Uber/Didi/InDrive).
 *
 * The user types an address and presses search (or Enter) → the address is
 * geocoded and a pin is dropped on the map. The pin can also be dragged to
 * a precise spot; on release, reverse-geocoding fills the address text.
 *
 * Props:
 *  - value: current address text (string)
 *  - onChange(addressText, { lat, lng }): called whenever either changes
 *  - initialLat / initialLng: existing destination coordinates (when editing)
 *
 * Falls back to a simple text input when the Maps API key is missing.
 */
export default function DestinationPicker({ value, onChange, initialLat, initialLng }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const mapsRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [searching, setSearching] = useState(false);
  const [dragNotice, setDragNotice] = useState(false);

  // Load the map once (only for real location UX)
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        mapRef.current = new maps.Map(containerRef.current, {
          center: isNum(initialLat) && isNum(initialLng)
            ? { lat: initialLat, lng: initialLng }
            : DEFAULT_CENTER,
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
        });
        geocoderRef.current = new maps.Geocoder();

        // Existing destination → place the pin without geocoding
        if (isNum(initialLat) && isNum(initialLng)) {
          placeMarker(maps, { lat: initialLat, lng: initialLng });
        }
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeMarker = (maps, latlng) => {
    if (markerRef.current) {
      markerRef.current.setPosition(latlng);
      mapRef.current.panTo(latlng);
    } else {
      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position: latlng,
        title: 'Destino',
        draggable: true,
      });
      mapRef.current.panTo(latlng);
      // Dragging the pin → reverse geocode to fill the address
      markerRef.current.addListener('dragend', () => {
        const pos = markerRef.current.getPosition();
        setDragNotice(true);
        setTimeout(() => setDragNotice(false), 2500);
        geocoderRef.current?.geocode({ location: { lat: pos.lat(), lng: pos.lng() } }, (results, status) => {
          const address = status === 'OK' && results && results[0]
            ? results[0].formatted_address
            : '';
          onChange(address, { lat: pos.lat(), lng: pos.lng() });
        });
      });
    }
  };

  const handleSearch = () => {
    if (!value || value.trim().length < SEARCH_MIN || !geocoderRef.current) return;
    setSearching(true);
    geocoderRef.current.geocode({ address: value }, (results, status) => {
      setSearching(false);
      if (status === 'OK' && results && results[0] && mapRef.current) {
        const pos = results[0].geometry.location;
        placeMarker(mapsRef.current, { lat: pos.lat(), lng: pos.lng() });
        onChange(value, { lat: pos.lat(), lng: pos.lng() });
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // No API key → graceful plain text input (address only, no pin)
  if (state === 'error') {
    return (
      <div className="form-group">
        <label htmlFor="destination-input">Dirección de entrega *</label>
        <input
          id="destination-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, null)}
          placeholder="Ej: Av. Los Girasoles 123, San Juan"
        />
        <span className="destination-picker-hint">
          Configura VITE_GOOGLE_MAPS_API_KEY para seleccionar el punto en el mapa.
        </span>
      </div>
    );
  }

  return (
    <div className="destination-picker">
      <label htmlFor="destination-input">Dirección de entrega *</label>
      <div className="destination-picker-search">
        <input
          id="destination-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, null)}
          onKeyDown={handleKeyDown}
          placeholder="Busca la dirección o arrastra el pin en el mapa"
        />
        <button
          type="button"
          className="destination-picker-btn"
          onClick={handleSearch}
          disabled={searching || !value || value.trim().length < SEARCH_MIN}
          title="Buscar dirección"
        >
          {searching ? <Loader size={18} className="spin" /> : <Search size={18} />}
          <span>Buscar</span>
        </button>
      </div>
      <div className="destination-picker-map">
        <div ref={containerRef} className="destination-picker-canvas" />
        {state === 'loading' && <span className="destination-picker-overlay">Cargando mapa...</span>}
        <span className="destination-picker-tip">
          <MapPin size={13} />
          Arrastra el pin para ajustar el punto exacto
        </span>
        {dragNotice && <span className="destination-picker-drag">¡Punto ajustado! Dirección actualizada.</span>}
      </div>
    </div>
  );
}
