<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import {
    type Place,
    type RouteData,
    BUILTIN_ROUTES,
    BUILTIN_PLACES,
    PLACE_ALIASES,
    getBearingTowardsPeak,
    extractStageCoordinates,
    getCoordinatesBounds,
    KILIMANJARO_SUMMIT
  } from '../lib/geo';

  interface Props {
    selectedRoute: string;
    activeDay: number;
    droneActive: boolean;
    onPlaceSelect?: (placeId: string, alt: number) => void;
  }

  let {
    selectedRoute = 'machame',
    activeDay = 1,
    droneActive = false,
    onPlaceSelect
  }: Props = $props();

  let mapContainer: HTMLDivElement | null = $state(null);
  let mapInstance: MapLibreMap | null = $state(null);
  let isMapReady = $state<boolean>(false);
  let markers: Marker[] = [];
  let animFrameId: number | null = null;

  // Initialize with built-in instant data
  const initialPlacesMap = new Map<string, Place>();
  BUILTIN_PLACES.forEach((p) => initialPlacesMap.set(p.id, p));

  let placesMap = $state<Map<string, Place>>(initialPlacesMap);
  let currentRouteData = $state<RouteData | null>(BUILTIN_ROUTES[selectedRoute] || null);

  const HOME_VIEW = {
    center: [37.355, -3.075] as [number, number],
    zoom: 11.2,
    pitch: 62,
    bearing: -24
  };

  function resolvePlace(id: string): Place | undefined {
    const canonical = PLACE_ALIASES[id] || id;
    return placesMap.get(canonical) || placesMap.get(id);
  }

  async function getRouteData(routeId: string): Promise<RouteData | null> {
    if (BUILTIN_ROUTES[routeId]) {
      return BUILTIN_ROUTES[routeId];
    }
    try {
      const res = await fetch(`/data/routes/${routeId}.json`);
      if (res.ok) {
        const data: RouteData = await res.json();
        return data;
      }
    } catch (err) {
      console.warn(`Could not load route ${routeId}:`, err);
    }
    return null;
  }

  onMount(async () => {
    if (!mapContainer) return;

    const maplibregl = await import('maplibre-gl');

    const map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          imagery: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 17,
            attribution: '© Esri Satellite'
          },
          terrainSource: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 14,
            encoding: 'terrarium'
          }
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#09090b' } },
          {
            id: 'imagery',
            type: 'raster',
            source: 'imagery',
            paint: {
              'raster-brightness-max': 0.88,
              'raster-saturation': -0.15,
              'raster-contrast': 0.12
            }
          }
        ]
      },
      center: HOME_VIEW.center,
      zoom: HOME_VIEW.zoom,
      pitch: HOME_VIEW.pitch,
      bearing: HOME_VIEW.bearing,
      maxPitch: 85,
      canvasContextAttributes: { antialias: true }
    });

    map.on('load', async () => {
      // Enable 3D Terrain
      map.setTerrain({ source: 'terrainSource', exaggeration: 1.35 });

      // Add Sources for Full Route and Active Stage
      initRouteSources(map);

      // Setup Initial Route Data
      const routeData = await getRouteData(selectedRoute);
      if (routeData) {
        currentRouteData = routeData;
        updateMapData(map, maplibregl, routeData, activeDay);
        flyToStage(activeDay, false);
      }

      mapInstance = map;
      isMapReady = true;
    });

    return () => {
      stopOrbit();
      markers.forEach((m) => m.remove());
      map.remove();
      mapInstance = null;
    };
  });

  function initRouteSources(map: MapLibreMap) {
    // 1. Full Route Base Source
    map.addSource('trek-route-full', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      }
    });

    // Full Route Shadow / Base Glow
    map.addLayer({
      id: 'full-route-glow',
      type: 'line',
      source: 'trek-route-full',
      paint: {
        'line-color': '#065f46',
        'line-width': 5,
        'line-blur': 2,
        'line-opacity': 0.35
      }
    });

    // Full Route Core Baseline
    map.addLayer({
      id: 'full-route-core',
      type: 'line',
      source: 'trek-route-full',
      paint: {
        'line-color': '#52525b',
        'line-width': 2,
        'line-dasharray': [2, 1],
        'line-opacity': 0.65
      }
    });

    // 2. Active Stage Segment Source
    map.addSource('trek-stage-active', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      }
    });

    // Active Stage Glowing Ribbon (Illuminates the segment between Point A and Point B)
    map.addLayer({
      id: 'active-stage-glow',
      type: 'line',
      source: 'trek-stage-active',
      paint: {
        'line-color': '#10b981',
        'line-width': 10,
        'line-blur': 4,
        'line-opacity': 0.85
      }
    });

    // Active Stage Core Bright Line
    map.addLayer({
      id: 'active-stage-core',
      type: 'line',
      source: 'trek-stage-active',
      paint: {
        'line-color': '#ffffff',
        'line-width': 3.5,
        'line-opacity': 0.95
      }
    });

    // Active Stage Inner Accent Line
    map.addLayer({
      id: 'active-stage-accent',
      type: 'line',
      source: 'trek-stage-active',
      paint: {
        'line-color': '#34d399',
        'line-width': 2,
        'line-opacity': 1.0
      }
    });
  }

  function updateMapData(
    map: MapLibreMap,
    maplibregl: any,
    routeData: RouteData,
    dayNum: number
  ) {
    if (!map || !routeData) return;

    // 1. Update Full Route Coordinates
    const fullCoords = routeData.coordinates.map((c) => [c[0], c[1]]);
    const fullSource = map.getSource('trek-route-full') as any;
    if (fullSource) {
      fullSource.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: fullCoords }
      });
    }

    // 2. Update Active Stage Segment Coordinates
    const currentDayData = routeData.days.find((d) => d.day === dayNum) || routeData.days[0];
    if (currentDayData) {
      const stageCoords = extractStageCoordinates(
        routeData.coordinates,
        currentDayData.startKm,
        currentDayData.endKm
      ).map((c) => [c[0], c[1]]);

      const stageSource = map.getSource('trek-stage-active') as any;
      if (stageSource) {
        stageSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: stageCoords }
        });
      }
    }

    // 3. Render High-Contrast 3D Waypoint Markers
    renderWaypoints(map, maplibregl, routeData, currentDayData);
  }

  function renderWaypoints(
    map: MapLibreMap,
    maplibregl: any,
    routeData: RouteData,
    currentDayData?: any
  ) {
    markers.forEach((m) => m.remove());
    markers = [];

    const activeFromId = currentDayData?.from;
    const activeToId = currentDayData?.to;

    const marks = routeData.marks || [];

    marks.forEach((mark) => {
      const place = resolvePlace(mark.place);
      if (!place) return;

      const isStart = mark.place === activeFromId || PLACE_ALIASES[mark.place] === activeFromId;
      const isDestination = mark.place === activeToId || PLACE_ALIASES[mark.place] === activeToId;
      const isUhuru = mark.place === 'uhuru-peak';

      const el = document.createElement('div');
      el.className = 'group cursor-pointer transform -translate-x-1/2 -translate-y-full';

      if (isStart) {
        // Point A: Departure Pin
        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xl whitespace-nowrap bg-emerald-500 text-zinc-950 border border-emerald-300 ring-2 ring-emerald-400/50 scale-105 transition-transform duration-150">
              START: ${place.name} (${place.elevation}m)
            </div>
            <div class="relative w-3 h-3 mt-1 flex items-center justify-center">
              <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </div>
          </div>
        `;
      } else if (isDestination) {
        // Point B: Destination Camp Pin
        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xl whitespace-nowrap bg-amber-400 text-zinc-950 border border-amber-200 ring-2 ring-amber-300/50 scale-105 transition-transform duration-150">
              CAMP: ${place.name} (${place.elevation}m)
            </div>
            <div class="relative w-3 h-3 mt-1 flex items-center justify-center">
              <span class="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </div>
          </div>
        `;
      } else if (isUhuru) {
        // Roof of Africa Summit Pin
        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xl whitespace-nowrap bg-amber-500 text-zinc-950 ring-2 ring-amber-200">
              SUMMIT: UHURU PEAK (5,895m)
            </div>
            <div class="relative w-3 h-3 mt-1 flex items-center justify-center">
              <span class="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </div>
          </div>
        `;
      } else {
        // Standard Waypoint Node
        el.innerHTML = `
          <div class="flex flex-col items-center opacity-85 group-hover:opacity-100 transition-opacity">
            <div class="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium shadow-md whitespace-nowrap bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 backdrop-blur-md transition-transform duration-150 group-hover:scale-110 group-hover:border-emerald-400">
              ${place.name} · ${place.elevation}m
            </div>
            <div class="w-1.5 h-1.5 rounded-full mt-0.5 bg-zinc-400 group-hover:bg-emerald-400"></div>
          </div>
        `;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        flyToPlaceId(mark.place);
        onPlaceSelect?.(mark.place, place.elevation);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(place.coordinates)
        .addTo(map);

      markers.push(marker);
    });
  }

  // Reactive Effect when selectedRoute changes
  $effect(() => {
    const route = selectedRoute;
    if (!mapInstance || !isMapReady) return;

    getRouteData(route).then((data) => {
      if (data && mapInstance) {
        currentRouteData = data;
        import('maplibre-gl').then((maplibregl) => {
          updateMapData(mapInstance!, maplibregl, data, activeDay);
          flyToStage(activeDay, false);
        });
      }
    });
  });

  // Reactive Effect when activeDay changes
  $effect(() => {
    const day = activeDay;
    if (!mapInstance || !isMapReady || !currentRouteData) return;

    import('maplibre-gl').then((maplibregl) => {
      updateMapData(mapInstance!, maplibregl, currentRouteData!, day);
      flyToStage(day, true);
    });
  });

  // Effect for drone orbit
  $effect(() => {
    if (droneActive) {
      startOrbit();
    } else {
      stopOrbit();
    }
  });

  /**
   * High-zoom camera fly to a specific place coordinate with dynamic summit-facing bearing
   */
  export function flyToCoordinate(
    lng: number,
    lat: number,
    zoom = 15.0,
    pitch = 70,
    bearing?: number
  ) {
    if (!mapInstance) return;
    const finalBearing = bearing !== undefined ? bearing : getBearingTowardsPeak(lng, lat);
    mapInstance.flyTo({
      center: [lng, lat],
      zoom,
      pitch,
      bearing: finalBearing,
      duration: 2000,
      essential: true
    });
  }

  /**
   * Fly directly to a named waypoint with high zoom (~15.0) and steep 3D terrain pitch
   */
  export function flyToPlaceId(placeId: string) {
    const place = resolvePlace(placeId);
    if (place) {
      flyToCoordinate(place.coordinates[0], place.coordinates[1], 15.0, 70);
    }
  }

  /**
   * Locates and frames the active stage segment between Point A and Point B with high-zoom 3D perspective
   */
  export function flyToStage(dayNum: number, animate = true) {
    if (!mapInstance || !currentRouteData) return;
    const dayData = currentRouteData.days.find((d) => d.day === dayNum) || currentRouteData.days[0];
    if (!dayData) return;

    const stageCoords = extractStageCoordinates(
      currentRouteData.coordinates,
      dayData.startKm,
      dayData.endKm
    );

    if (stageCoords.length === 0) return;

    const bounds = getCoordinatesBounds(stageCoords);
    if (!bounds) return;

    const centerLng = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLat = (bounds[0][1] + bounds[1][1]) / 2;
    const bearing = getBearingTowardsPeak(centerLng, centerLat);

    mapInstance.flyTo({
      center: [centerLng, centerLat],
      zoom: 14.3,
      pitch: 68,
      bearing,
      duration: animate ? 2200 : 0,
      essential: true
    });
  }

  export function resetOverview() {
    stopOrbit();
    if (!mapInstance) return;
    mapInstance.flyTo({
      center: HOME_VIEW.center,
      zoom: HOME_VIEW.zoom,
      pitch: HOME_VIEW.pitch,
      bearing: HOME_VIEW.bearing,
      duration: 2000,
      essential: true
    });
  }

  function startOrbit() {
    stopOrbit();
    if (!mapInstance) return;

    function step() {
      if (!mapInstance) return;
      const curBearing = mapInstance.getBearing();
      mapInstance.setBearing(curBearing + 0.15);
      animFrameId = requestAnimationFrame(step);
    }
    animFrameId = requestAnimationFrame(step);
  }

  function stopOrbit() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  onDestroy(() => {
    stopOrbit();
  });
</script>

<div class="relative w-full h-full overflow-hidden bg-zinc-950 select-none">
  <div bind:this={mapContainer} class="w-full h-full absolute inset-0"></div>

  {#if !isMapReady}
    <div
      class="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10 pointer-events-none"
    >
      <div
        class="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Loading Mount Kilimanjaro 3D Elevation Mesh & Trail Segments...</span>
      </div>
    </div>
  {/if}
</div>
