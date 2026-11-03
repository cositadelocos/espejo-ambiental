/**
 * locationMap.js — Componente de Mapa estilo Apple Maps Dark Mode
 *
 * Utiliza Geolocation API para obtener la ubicación real del computador / celular,
 * y renderiza un mapa oscuro ultra-estilizado (CartoDB Dark Matter + Leaflet)
 * con el punto azul pulsante característico de Apple (Find My / Apple Maps),
 * junto a las estaciones oficiales de monitoreo de calidad del aire en Puente Aranda.
 */

window.LocationMap = (() => {

  // Coordenadas base de Puente Aranda, Bogotá (si el usuario no da permiso)
  const DEFAULT_COORDS = {
    lat: 4.6325,
    lon: -74.1186,
    label: 'Puente Aranda, Bogotá D.C.',
    isLive: false,
  };

  // Estaciones oficiales RMCAB en el área de Puente Aranda y suroccidente
  const STATIONS = [
    {
      id: 'sevillana',
      name: 'Carvajal - Sevillana',
      coords: [4.5962, -74.1481],
      type: 'Tráfico pesado e Industrial',
    },
    {
      id: 'puentearanda',
      name: 'Puente Aranda Central',
      coords: [4.6320, -74.1180],
      type: 'Industrial / Mixto',
    },
    {
      id: 'kennedy',
      name: 'Estación Kennedy',
      coords: [4.6253, -74.1612],
      type: 'Residencial / Comercial',
    },
  ];

  let _userCoords = { ...DEFAULT_COORDS };
  let _mapInstance = null;
  let _userMarker   = null;
  let _stationLayer = null;

  /**
   * Intenta obtener la geolocalización real del navegador
   */
  function requestCurrentLocation(onLocationFound) {
    if (!('geolocation' in navigator)) {
      if (onLocationFound) onLocationFound(_userCoords);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        _userCoords = {
          lat,
          lon,
          label: 'Tu ubicación actual detectada',
          accuracy: Math.round(pos.coords.accuracy),
          isLive: true,
        };
        console.info('[LocationMap] Ubicación GPS obtenida:', lat, lon);
        if (_mapInstance) {
          _updateMapCenter();
        }

        // Consultar calidad de aire en tiempo real para esta ubicación exacta
        if (window.ENVIRONMENTAL_DATA?.fetchLiveEnvironmentalData) {
          const liveData = await window.ENVIRONMENTAL_DATA.fetchLiveEnvironmentalData(lat, lon);
          if (liveData && window.App?.setLiveRecord) {
            window.App.setLiveRecord(liveData);
          }
        }

        if (onLocationFound) onLocationFound(_userCoords);
      },
      (err) => {
        console.warn('[LocationMap] Geolocalización no concedida o no disponible:', err.message);
        if (onLocationFound) onLocationFound(_userCoords);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  /**
   * Inicializa el mapa Leaflet en el contenedor DOM dado
   */
  function init(containerId, aqiColor = '#FFCC00') {
    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') return;

    // Si ya existe instancia previa, destruirla limpiamente
    if (_mapInstance) {
      _mapInstance.remove();
      _mapInstance = null;
    }

    _mapInstance = L.map(containerId, {
      center: [_userCoords.lat, _userCoords.lon],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
    });

    // Capa de teselas oscuras estilo Apple Maps Dark (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(_mapInstance);

    // Añadir marcador del usuario estilo Apple (punto azul con halo pulsante)
    const userPinHtml = `
      <div class="apple-map-pin">
        <div class="apple-pin-pulse"></div>
        <div class="apple-pin-dot"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userPinHtml,
      className: 'apple-pin-wrapper',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    _userMarker = L.marker([_userCoords.lat, _userCoords.lon], { icon: userIcon })
      .addTo(_mapInstance)
      .bindPopup(`<strong style="color:#0A84FF">📍 Tu Ubicación</strong><br>${_userCoords.label}`);

    // Añadir estaciones de Puente Aranda con sus círculos de cobertura
    _stationLayer = L.layerGroup().addTo(_mapInstance);
    STATIONS.forEach(st => {
      const stationIcon = L.divIcon({
        html: `
          <div class="apple-station-badge" style="border-color:${aqiColor}; box-shadow: 0 0 10px ${aqiColor}66;">
            <span class="st-dot" style="background:${aqiColor}"></span>
            <span class="st-name">${st.name.split(' ')[0]}</span>
          </div>
        `,
        className: 'apple-station-wrapper',
        iconSize: [80, 22],
        iconAnchor: [40, 11],
      });

      L.marker(st.coords, { icon: stationIcon })
        .addTo(_stationLayer)
        .bindPopup(`<strong>Estación ${st.name}</strong><br>${st.type}`);

      // Radio de influencia ambiental sutil
      L.circle(st.coords, {
        radius: 800,
        color: aqiColor,
        weight: 1,
        opacity: 0.35,
        fillColor: aqiColor,
        fillOpacity: 0.08,
      }).addTo(_stationLayer);
    });

    // Ajustar vista para abarcar al usuario y la estación más cercana
    setTimeout(() => {
      _mapInstance.invalidateSize();
    }, 250);
  }

  function _updateMapCenter() {
    if (!_mapInstance || !_userMarker) return;
    _mapInstance.setView([_userCoords.lat, _userCoords.lon], 14, { animate: true });
    _userMarker.setLatLng([_userCoords.lat, _userCoords.lon]);
  }

  /**
   * Calcula distancia en km usando fórmula de Haversine
   */
  function getNearestStationDistance() {
    let nearest = null;
    let minKm = Infinity;

    STATIONS.forEach(st => {
      const d = _haversine(_userCoords.lat, _userCoords.lon, st.coords[0], st.coords[1]);
      if (d < minKm) {
        minKm = d;
        nearest = st;
      }
    });

    if (minKm > 25) {
      return {
        station: { name: _userCoords.label || 'Monitoreo Local' },
        distanceKm: '0.0',
        isLocalSatellite: true,
      };
    }

    return {
      station: nearest,
      distanceKm: minKm.toFixed(1),
    };
  }

  function _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return {
    init,
    requestCurrentLocation,
    getUserCoords: () => _userCoords,
    getNearestStationDistance,
  };
})();
