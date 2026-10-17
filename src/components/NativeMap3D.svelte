<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';

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

  // Key Coordinates on Mount Kilimanjaro [lng, lat, elevation]
  const WAYPOINTS: Record<string, { name: string; coords: [number, number]; alt: number; day: number; route: string }> = {
    'machame-gate': { name: 'Machame Gate', coords: [37.243, -3.175], alt: 1811, day: 1, route: 'machame' },
    'machame-camp': { name: 'Machame Camp', coords: [37.283, -3.125], alt: 3021, day: 1, route: 'machame' },
    'shira-cave': { name: 'Shira Cave Camp', coords: [37.288, -3.076], alt: 3839, day: 2, route: 'machame' },
    'lava-tower': { name: 'Lava Tower (4,630m)', coords: [37.319, -3.070], alt: 4630, day: 3, route: 'machame' },
    'barranco-camp': { name: 'Barranco Camp', coords: [37.342, -3.083], alt: 3976, day: 3, route: 'machame' },
    'karanga-camp': { name: 'Karanga Camp', coords: [37.375, -3.082], alt: 3995, day: 4, route: 'machame' },
    'barafu-camp': { name: 'Barafu High Camp', coords: [37.387, -3.077], alt: 4673, day: 5, route: 'machame' },
    'uhuru-peak': { name: 'Uhuru Peak (5,895m)', coords: [37.3533, -3.0758], alt: 5895, day: 6, route: 'all' },
    'mweka-camp': { name: 'Mweka Camp', coords: [37.362, -3.128], alt: 3080, day: 6, route: 'machame' },
    'mweka-gate': { name: 'Mweka Gate', coords: [37.348, -3.173], alt: 1640, day: 7, route: 'machame' },

    // Marangu
    'marangu-gate': { name: 'Marangu Gate', coords: [37.51765, -3.24365], alt: 1860, day: 1, route: 'marangu' },
    'mandara-hut': { name: 'Mandara Hut', coords: [37.509, -3.186], alt: 2700, day: 1, route: 'marangu' },
    'horombo-hut': { name: 'Horombo Hut', coords: [37.441, -3.136], alt: 3720, day: 2, route: 'marangu' },
    'zebra-rocks': { name: 'Zebra Rocks', coords: [37.435, -3.118], alt: 4020, day: 3, route: 'marangu' },
    'kibo-hut': { name: 'Kibo Hut', coords: [37.369, -3.078], alt: 4703, day: 4, route: 'marangu' },

    // Lemosho
    'londorossi-gate': { name: 'Londorossi Gate', coords: [37.147, -3.165], alt: 2100, day: 1, route: 'lemosho' },
    'mti-mkubwa': { name: 'Mti Mkubwa', coords: [37.195, -3.108], alt: 2650, day: 1, route: 'lemosho' },
    'shira-1-camp': { name: 'Shira 1 Camp', coords: [37.235, -3.075], alt: 3610, day: 2, route: 'lemosho' },
    'shira-2-camp': { name: 'Shira 2 Camp', coords: [37.275, -3.068], alt: 3850, day: 3, route: 'lemosho' }
  };

  const HOME_VIEW = {
    center: [37.355, -3.075] as [number, number],
    zoom: 11.2,
    pitch: 62,
    bearing: -24
  };

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

    map.on('load', () => {
      // Enable 3D Terrain
      map.setTerrain({ source: 'terrainSource', exaggeration: 1.35 });

      // Build Trail Polyline
      buildRouteLayers(map, maplibregl);

      // Add 3D Waypoint Markers
      renderMarkers(map, maplibregl);

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

  function buildRouteLayers(map: MapLibreMap, maplibregl: any) {
    // Generate route coordinates from waypoints
    const routeCoords = Object.values(WAYPOINTS)
      .filter((w) => w.route === selectedRoute || w.route === 'all')
      .map((w) => w.coords);

    map.addSource('trek-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoords
        }
      }
    });

    // Glowing Trail Shadow
    map.addLayer({
      id: 'trek-glow',
      type: 'line',
      source: 'trek-route',
      paint: {
        'line-color': '#10b981',
        'line-width': 8,
        'line-blur': 4,
        'line-opacity': 0.4
      }
    });

    // Sharp Core Trail
    map.addLayer({
      id: 'trek-core',
      type: 'line',
      source: 'trek-route',
      paint: {
        'line-color': '#ffffff',
        'line-width': 3,
        'line-dasharray': [2, 1]
      }
    });
  }

  function renderMarkers(map: MapLibreMap, maplibregl: any) {
    markers.forEach((m) => m.remove());
    markers = [];

    const activeWaypoints = Object.entries(WAYPOINTS).filter(
      ([_, w]) => w.route === selectedRoute || w.route === 'all'
    );

    activeWaypoints.forEach(([id, wp]) => {
      const el = document.createElement('div');
      el.className = 'group cursor-pointer transform -translate-x-1/2 -translate-y-full';

      const isUhuru = id === 'uhuru-peak';

      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-lg whitespace-nowrap transition-transform duration-150 group-hover:scale-110 ${
            isUhuru
              ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-200'
              : 'bg-zinc-900/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md'
          }">
            ${wp.name} · ${wp.alt}m
          </div>
          <div class="w-2 h-2 rounded-full mt-1 ${isUhuru ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}"></div>
        </div>
      `;

      el.addEventListener('click', () => {
        flyToCoordinate(wp.coords[0], wp.coords[1], 12.8, 65, map.getBearing() + 15);
        onPlaceSelect?.(id, wp.alt);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(wp.coords)
        .addTo(map);

      markers.push(marker);
    });
  }

  // Effect to update route
  $effect(() => {
    if (!mapInstance || !isMapReady) return;
    import('maplibre-gl').then((maplibregl) => {
      const routeCoords = Object.values(WAYPOINTS)
        .filter((w) => w.route === selectedRoute || w.route === 'all')
        .map((w) => w.coords);

      const source = mapInstance?.getSource('trek-route') as any;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoords
          }
        });
      }

      renderMarkers(mapInstance, maplibregl);
    });
  });

  // Effect to fly camera on activeDay change
  $effect(() => {
    if (!mapInstance || !isMapReady) return;
    const matched = Object.values(WAYPOINTS).find(
      (w) => (w.route === selectedRoute || w.route === 'all') && w.day === activeDay
    );
    if (matched) {
      flyToCoordinate(matched.coords[0], matched.coords[1], 12.2, 60, mapInstance.getBearing() + 10);
    }
  });

  // Effect for drone orbit
  $effect(() => {
    if (droneActive) {
      startOrbit();
    } else {
      stopOrbit();
    }
  });

  function flyToCoordinate(lng: number, lat: number, zoom = 12, pitch = 60, bearing = -20) {
    if (!mapInstance) return;
    mapInstance.flyTo({
      center: [lng, lat],
      zoom,
      pitch,
      bearing,
      duration: 2200,
      essential: true
    });
  }

  export function flyToPlaceId(placeId: string) {
    const wp = WAYPOINTS[placeId];
    if (wp) {
      flyToCoordinate(wp.coords[0], wp.coords[1], 13.0, 68, -15);
    }
  }

  export function resetOverview() {
    stopOrbit();
    flyToCoordinate(HOME_VIEW.center[0], HOME_VIEW.center[1], HOME_VIEW.zoom, HOME_VIEW.pitch, HOME_VIEW.bearing);
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

<div class="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden bg-zinc-950 select-none">
  <div bind:this={mapContainer} class="w-full h-full absolute inset-0"></div>

  {#if !isMapReady}
    <div class="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10">
      <div class="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Loading Mount Kilimanjaro 3D Elevation Mesh...</span>
      </div>
    </div>
  {/if}
</div>
