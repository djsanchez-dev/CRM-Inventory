/**
 * googleMaps.js — tiny Promise-based loader for the Google Maps JavaScript API.
 *
 * Reads the API key from VITE_GOOGLE_MAPS_API_KEY (Vite env var).
 * If the key is missing, loadGoogleMaps() rejects so the UI can fall back
 * gracefully to the step-based tracking (no map).
 */

let mapsPromise = null;

export function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY no configurada'));
  }
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No se puede cargar Google Maps en el servidor'));
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    // Use the global callback so the API tells us when it's ready.
    window.__gmapsInit = () => {
      delete window.__gmapsInit;
      resolve(window.google.maps);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=__gmapsInit&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error('No se pudo cargar Google Maps'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}
