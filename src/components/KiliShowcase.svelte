<script lang="ts">
  import { onMount } from 'svelte';
  import { KiliSpatialBridge, type KiliEvent, type RouteId } from '../lib/kilispatial';
  import { KILIMANJARO_ROUTES } from '../lib/routes-data';
  import EmbedModal from './EmbedModal.svelte';
  import ElevationChart from './ElevationChart.svelte';
  import {
    Compass,
    Footprints,
    Clock,
    Mountain,
    ShieldCheck,
    Tent,
    Play,
    Pause,
    RotateCw,
    Maximize2,
    Code2,
    CheckCircle2,
    Sparkles,
    Terminal,
    AlertTriangle,
    RefreshCw,
    MapPin,
    Flame,
    ArrowUpRight
  } from 'lucide-svelte';

  import NativeMap3D from './NativeMap3D.svelte';

  const DEFAULT_ORIGIN = (import.meta.env.PUBLIC_KILI_ORIGIN as string) || 'https://kili.xenohuru.com';

  // Reactive Svelte 5 Runes State
  let viewMode = $state<'native' | 'iframe'>('native');
  let nativeMapRef = $state<any>(null);
  let deployOrigin = $state<string>(DEFAULT_ORIGIN);
  let selectedRouteId = $state<string>('machame');
  let activeDay = $state<number>(1);
  let activePlace = $state<string>('machame-camp');
  let liveElevation = $state<number>(3021);
  let liveDistanceKm = $state<number>(0);
  let droneActive = $state<boolean>(false);
  let tourPlaying = $state<boolean>(false);
  let bridgeReady = $state<boolean>(false);
  let isCspBlocked = $state<boolean>(false);
  let showEmbedModal = $state<boolean>(false);
  let lastEventLog = $state<string>('KiliSpatial 3D Engine ready.');

  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let bridge = $state<KiliSpatialBridge | null>(null);

  let currentPackage = $derived(KILIMANJARO_ROUTES[selectedRouteId]);
  let currentDayObj = $derived(
    currentPackage.days.find((d) => d.day === activeDay) || currentPackage.days[0]
  );

  let timer: ReturnType<typeof setTimeout>;

  function initBridge() {
    if (!iframeEl) return;
    bridge = new KiliSpatialBridge(iframeEl, deployOrigin);

    const unsubscribe = bridge.listen((event: KiliEvent) => {
      if (event.type === 'ready') {
        bridgeReady = true;
        isCspBlocked = false;
        lastEventLog = `Engine Ready (${event.routes?.length ?? 7} routes loaded)`;
      } else if (event.type === 'route') {
        if (KILIMANJARO_ROUTES[event.id]) {
          selectedRouteId = event.id;
        }
        lastEventLog = `Viewer switched route → ${event.id}`;
      } else if (event.type === 'day') {
        activeDay = event.day;
        const matched = currentPackage.days.find((d) => d.day === event.day);
        if (matched) liveElevation = matched.endAlt;
        lastEventLog = `Viewer focused Day ${event.day}`;
      } else if (event.type === 'place') {
        activePlace = event.id;
        lastEventLog = `Viewer selected place → ${event.id}`;
      } else if (event.type === 'progress') {
        liveDistanceKm = Number(event.km.toFixed(1));
        liveElevation = Math.round(event.elevation);
        lastEventLog = `Scrubbing: ${liveDistanceKm}km @ ${liveElevation}m`;
      }
    });

    return unsubscribe;
  }

  onMount(() => {
    const unsub = initBridge();

    // Check if remote CSP or network blocked iframe connection
    timer = setTimeout(() => {
      if (!bridgeReady) {
        isCspBlocked = true;
        lastEventLog = `Waiting for connection from ${deployOrigin}...`;
      }
    }, 3500);

    return () => {
      clearTimeout(timer);
      unsub?.();
    };
  });

  function setOrigin(newUrl: string) {
    deployOrigin = newUrl.trim().replace(/\/$/, '');
    bridgeReady = false;
    isCspBlocked = false;
    lastEventLog = `Reconnecting to ${deployOrigin}...`;
    setTimeout(() => {
      initBridge();
    }, 100);
  }

  function switchRoute(routeKey: string) {
    selectedRouteId = routeKey;
    activeDay = 1;
    const firstDay = KILIMANJARO_ROUTES[routeKey].days[0];
    liveElevation = firstDay.endAlt;
    liveDistanceKm = firstDay.distanceKm;

    bridge?.send({ type: 'selectRoute', id: routeKey as RouteId });
    bridge?.send({ type: 'focusDay', day: 1 });
    lastEventLog = `Host sent: selectRoute('${routeKey}')`;
  }

  function selectDayStep(dayNum: number, placeId: string, endAlt: number, distKm: number) {
    activeDay = dayNum;
    activePlace = placeId;
    liveElevation = endAlt;
    liveDistanceKm = distKm;

    if (viewMode === 'native') {
      nativeMapRef?.flyToPlaceId(placeId);
    }
    bridge?.send({ type: 'focusDay', day: dayNum });
    bridge?.send({ type: 'focusPlace', id: placeId });
    lastEventLog = `Focused Day ${dayNum} (${placeId})`;
  }

  function jumpToPlace(placeId: string) {
    activePlace = placeId;
    if (viewMode === 'native') {
      nativeMapRef?.flyToPlaceId(placeId);
    }
    bridge?.send({ type: 'focusPlace', id: placeId });
    lastEventLog = `Camera focused on ${placeId}`;
  }

  function toggleDrone() {
    droneActive = !droneActive;
    bridge?.send({ type: 'drone', on: droneActive });
    lastEventLog = droneActive ? 'Drone camera orbit started' : 'Drone orbit stopped';
  }

  function togglePlayRoute() {
    tourPlaying = !tourPlaying;
    bridge?.send({ type: 'play', on: tourPlaying });
    lastEventLog = tourPlaying ? 'Flythrough started' : 'Flythrough paused';
  }

  function resetOverview() {
    droneActive = false;
    tourPlaying = false;
    if (viewMode === 'native') {
      nativeMapRef?.resetOverview();
    }
    bridge?.send({ type: 'showRoute' });
    lastEventLog = 'Reset camera to full mountain overview';
  }

  function handleScrub(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    liveDistanceKm = val;
    bridge?.send({ type: 'scrub', km: val });
    lastEventLog = `Scrubbed to ${val} km`;
  }
</script>

<!-- Top Route Switcher & B2B Action Bar -->
<div class="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-zinc-800">
  <div class="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
    {#each Object.values(KILIMANJARO_ROUTES) as routeItem}
      {@const isSelected = selectedRouteId === routeItem.id}
      <button
        onclick={() => switchRoute(routeItem.id)}
        class={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
          isSelected
            ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
        }`}
      >
        <MapPin class={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
        <span class="font-semibold">{routeItem.name}</span>
        <span
          class={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
            isSelected
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-zinc-900 text-zinc-400'
          }`}
        >
          {routeItem.badge}
        </span>
      </button>
    {/each}
  </div>

  <div class="flex items-center gap-3">
    <button
      onclick={() => (showEmbedModal = true)}
      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition shadow-sm cursor-pointer"
    >
      <Code2 class="w-3.5 h-3.5" />
      <span>&lt;/&gt; Embed 3D Map on Your Site</span>
    </button>
  </div>
</div>

<!-- Package Hero Summary Strip -->
<div class="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
    <div class="flex items-center gap-2 text-zinc-400 text-xs font-mono">
      <Compass class="w-3.5 h-3.5 text-zinc-400" />
      <span>ROUTE NICKNAME</span>
    </div>
    <div class="text-sm font-bold text-white mt-2">{currentPackage.nickname}</div>
  </div>

  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
    <div class="flex items-center gap-2 text-zinc-400 text-xs font-mono">
      <Footprints class="w-3.5 h-3.5 text-zinc-400" />
      <span>DURATION / TRAIL</span>
    </div>
    <div class="text-sm font-bold text-white mt-2 font-mono">
      {currentPackage.durationDays} Days · {currentPackage.totalDistanceKm} km
    </div>
  </div>

  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
    <div class="flex items-center gap-2 text-zinc-400 text-xs font-mono">
      <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
      <span>SUMMIT SUCCESS</span>
    </div>
    <div class="text-sm font-bold text-emerald-400 mt-2 font-mono">{currentPackage.successRate} Verified</div>
  </div>

  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
    <div class="flex items-center gap-2 text-zinc-400 text-xs font-mono">
      <Tent class="w-3.5 h-3.5 text-zinc-400" />
      <span>ACCOMMODATION</span>
    </div>
    <div class="text-sm font-bold text-white mt-2">{currentPackage.accommodation}</div>
  </div>

  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
    <div class="flex items-center gap-2 text-zinc-400 text-xs font-mono">
      <Mountain class="w-3.5 h-3.5 text-amber-400" />
      <span>ACTIVE ALTITUDE</span>
    </div>
    <div class="text-sm font-bold text-amber-400 font-mono mt-2">{liveElevation.toLocaleString()} m</div>
  </div>

  <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
    <div class="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
      <Sparkles class="w-3.5 h-3.5" />
      <span>PACKAGE STARTING AT</span>
    </div>
    <div class="text-lg font-bold text-white mt-1">
      ${currentPackage.startingPriceUsd.toLocaleString()} <span class="text-xs font-normal text-zinc-400">/pp</span>
    </div>
  </div>
</div>

<!-- Main Split Showcase: Left Itinerary | Right Sticky 3D Engine -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
  <!-- LEFT COLUMN: Interactive Day-by-Day Operator Itinerary -->
  <div class="lg:col-span-5 space-y-3">
    <div class="flex items-center justify-between pb-2">
      <div>
        <h2 class="text-base font-bold text-white tracking-tight">Expedition Waypoints</h2>
        <p class="text-xs text-zinc-400 mt-0.5">Click any stage to fly the 3D camera</p>
      </div>
      <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        {currentPackage.days.length} Stages
      </span>
    </div>

    <!-- Timeline List with Connected Vertical Border -->
    <div class="space-y-3 max-h-[720px] overflow-y-auto pr-2 relative">
      {#each currentPackage.days as item (item.day)}
        {@const isSelected = activeDay === item.day}
        <div
          role="button"
          tabindex="0"
          onclick={() => selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm)}
          onkeydown={(e) => e.key === 'Enter' && selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm)}
          class={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            isSelected
              ? 'bg-zinc-800/90 border-emerald-500/60 shadow-lg shadow-black/40 ring-1 ring-emerald-500/30'
              : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40'
          }`}
        >
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-2">
              <span
                class={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                DAY {item.day}
              </span>
              <span class="text-xs font-mono text-zinc-400">{item.zone}</span>
            </div>

            <div class="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span>{item.startAlt}m</span>
              <span class="text-zinc-500">→</span>
              <strong class="text-white font-semibold">{item.endAlt}m</strong>
            </div>
          </div>

          <h3 class="text-sm font-bold text-white mt-1">{item.title}</h3>

          <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400 font-mono">
            <span class="flex items-center gap-1.5">
              <Footprints class="w-3.5 h-3.5 text-zinc-500" />
              {item.distanceKm} km
            </span>
            <span class="flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-zinc-500" />
              {item.hikingHours}
            </span>
            {#if item.peakAlt}
              <span class="flex items-center gap-1.5 text-amber-400">
                <Mountain class="w-3.5 h-3.5" />
                Max Alt: {item.peakAlt}m
              </span>
            {/if}
          </div>

          {#if isSelected}
            <div class="mt-3 text-xs text-zinc-300 leading-relaxed border-t border-zinc-700/60 pt-3">
              <p>{item.summary}</p>
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#each item.highlights as chip}
                  <span class="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                    {chip}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- RIGHT COLUMN: Sticky Embedded KiliSpatial 3D Engine & Telemetry Control Deck -->
  <div class="lg:col-span-7 lg:sticky lg:top-6 space-y-4">
    <!-- 3D Viewer Frame Container -->
    <div class="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl min-h-[480px]">
      <!-- Top Floating HUD Bar -->
      <div class="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div class="px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 flex items-center gap-2.5 shadow-lg">
          <span class="w-2 h-2 rounded-full {viewMode === 'native' || bridgeReady ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse"></span>
          <span class="text-xs font-mono text-zinc-200">
            DAY {activeDay}: <strong class="text-emerald-400">{currentDayObj.title}</strong>
          </span>
        </div>

        <div class="flex items-center gap-2 pointer-events-auto">
          <!-- Viewport Mode Switcher -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 shadow-lg text-[11px] font-mono">
            <button
              onclick={() => (viewMode = 'native')}
              class={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'native'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Native 3D Studio
            </button>
            <button
              onclick={() => (viewMode = 'iframe')}
              class={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'iframe'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Iframe Embed Sync
            </button>
          </div>

          <div class="px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 text-xs font-mono text-amber-300 shadow-lg flex items-center gap-1.5">
            <Mountain class="w-3.5 h-3.5" />
            <span><strong>{liveElevation}m</strong> ({Math.round(liveElevation * 3.28084).toLocaleString()} ft)</span>
          </div>
        </div>
      </div>

      {#if viewMode === 'native'}
        <!-- Native MapLibre 3D WebGL Mountain -->
        <NativeMap3D
          bind:this={nativeMapRef}
          selectedRoute={selectedRouteId}
          activeDay={activeDay}
          droneActive={droneActive}
          onPlaceSelect={(id, alt) => {
            activePlace = id;
            liveElevation = alt;
            lastEventLog = `3D Waypoint selected: ${id} (${alt}m)`;
          }}
        />
      {:else}
        {#if !bridgeReady && isCspBlocked}
          <div class="absolute inset-0 z-10 flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md text-left">
            <div class="max-w-lg w-full bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-3.5 text-zinc-100">
              <div class="flex items-start gap-3">
                <AlertTriangle class="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 class="text-sm font-bold text-amber-300">Remote Engine Refused Connection (CSP Block)</h4>
                  <p class="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Your browser blocked the iframe because <code class="text-emerald-400 font-mono">http://localhost:4321</code> is not yet whitelisted on the remote <code class="text-emerald-400 font-mono">{deployOrigin}</code> server.
                  </p>
                </div>
              </div>

              <div class="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-2">
                <div class="text-zinc-400 font-sans font-semibold">Whitelist localhost in your engine repo:</div>
                <div>
                  <span class="text-amber-400">1. static/_headers:</span>
                  <pre class="text-emerald-300 text-[10px] mt-0.5 overflow-x-auto whitespace-pre-wrap">Content-Security-Policy: frame-ancestors 'self' http://localhost:4321 https://*.vercel.app https://xenohuru.com</pre>
                </div>
                <div>
                  <span class="text-amber-400">2. .env:</span>
                  <pre class="text-emerald-300 text-[10px] mt-0.5 overflow-x-auto">VITE_EMBED_ORIGINS=http://localhost:4321,https://your-domain.com</pre>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Custom Engine URL (e.g. http://localhost:5173)"
                  bind:value={deployOrigin}
                  class="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onclick={() => setOrigin(deployOrigin)}
                  class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition cursor-pointer"
                >
                  <RefreshCw class="w-3.5 h-3.5" />
                  Reconnect
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- KiliSpatial 3D Iframe -->
        <iframe
          bind:this={iframeEl}
          src={`${deployOrigin}/embed?route=${selectedRouteId}&day=1`}
          title="Mount Kilimanjaro 3D Route Simulator"
          loading="lazy"
          allow="fullscreen"
          style="width: 100%; aspect-ratio: 16/10; min-height: 480px; border: 0;"
        ></iframe>
      {/if}
    </div>

    <!-- Interactive Elevation Profile SVG Chart -->
    <ElevationChart
      days={currentPackage.days}
      activeDay={activeDay}
      liveDistanceKm={liveDistanceKm}
      onSelectDay={(dayNum) => {
        const item = currentPackage.days.find((d) => d.day === dayNum);
        if (item) {
          selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm);
        }
      }}
      onScrub={(km) => {
        liveDistanceKm = km;
        bridge?.send({ type: 'scrub', km });
        lastEventLog = `Host sent: scrub(${km} km)`;
      }}
    />

    <!-- Bidirectional postMessage Control Deck -->
    <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            onclick={togglePlayRoute}
            class={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              tourPlaying
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
            }`}
          >
            {#if tourPlaying}
              <Pause class="w-3.5 h-3.5" />
              <span>Pause Flythrough</span>
            {:else}
              <Play class="w-3.5 h-3.5 text-emerald-400" />
              <span>Play Flythrough</span>
            {/if}
          </button>

          <button
            onclick={toggleDrone}
            class={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
              droneActive
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
            }`}
          >
            <RotateCw class={`w-3.5 h-3.5 ${droneActive ? 'animate-spin' : 'text-emerald-400'}`} />
            <span>{droneActive ? 'Stop Orbit' : 'Orbit Camera'}</span>
          </button>

          <button
            onclick={resetOverview}
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition cursor-pointer"
          >
            <Maximize2 class="w-3.5 h-3.5 text-zinc-400" />
            <span>Overview</span>
          </button>
        </div>

        <!-- Quick Checkpoint Jump -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-mono text-zinc-400">Quick Jump:</span>
          <button
            onclick={() => jumpToPlace('lava-tower')}
            class="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition cursor-pointer"
          >
            Lava Tower (4,630m)
          </button>
          <button
            onclick={() => jumpToPlace('barranco-camp')}
            class="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition cursor-pointer"
          >
            Barranco Wall
          </button>
          <button
            onclick={() => jumpToPlace('uhuru-peak')}
            class="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer font-semibold flex items-center gap-1"
          >
            <Flame class="w-3 h-3 text-amber-400" />
            Uhuru Peak (5,895m)
          </button>
        </div>
      </div>

      <!-- Interactive Distance Scrubber -->
      <div class="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1">
          <div class="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span class="flex items-center gap-1.5">
              <Footprints class="w-3.5 h-3.5 text-emerald-400" />
              Scrub Trail Distance (`scrub` API)
            </span>
            <span class="text-emerald-400 font-semibold">{liveDistanceKm} km / {currentPackage.totalDistanceKm} km</span>
          </div>
          <input
            type="range"
            min="0"
            max={currentPackage.totalDistanceKm}
            step="0.5"
            value={liveDistanceKm}
            oninput={handleScrub}
            class="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
          />
        </div>

        <!-- Live postMessage Telemetry Status -->
        <div class="sm:w-72 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 flex items-center gap-2 truncate">
          <Terminal class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span class="truncate">{lastEventLog}</span>
        </div>
      </div>
    </div>

    <!-- High-Conversion Operator Booking Callout -->
    <div class="p-5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            KPAP Ethical Partner
          </span>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            TALA Licensed
          </span>
        </div>
        <h4 class="text-sm font-bold text-white mt-2">
          Expedition Departures for {currentPackage.name}
        </h4>
        <p class="text-xs text-zinc-400 mt-0.5">
          Guaranteed 2026/2027 departures · Pulse oximeters &amp; emergency oxygen included on every climb.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <a
          href="#inquire"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <span>Book Route</span>
          <ArrowUpRight class="w-3.5 h-3.5" />
        </a>
        <button
          onclick={() => (showEmbedModal = true)}
          class="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition cursor-pointer"
        >
          Embed Widget
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Embed Snippet Generator Modal -->
<EmbedModal
  bind:isOpen={showEmbedModal}
  currentRoute={selectedRouteId as RouteId}
  currentDay={activeDay}
  deployUrl={deployOrigin}
/>
