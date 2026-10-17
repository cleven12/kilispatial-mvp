<script lang="ts">
  import { onMount } from 'svelte';
  import { KiliSpatialBridge, type KiliEvent, type RouteId } from '../lib/kilispatial';
  import { KILIMANJARO_ROUTES } from '../lib/routes-data';
  import EmbedModal from './EmbedModal.svelte';
  import ElevationChart from './ElevationChart.svelte';
  import NativeMap3D from './NativeMap3D.svelte';
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
    Terminal,
    AlertTriangle,
    RefreshCw,
    MapPin,
    Flame,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal
  } from 'lucide-svelte';

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
  let showElevationProfile = $state<boolean>(true);
  let lastEventLog = $state<string>('KiliSpatial 3D Studio Engine Active.');

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
    lastEventLog = `Route changed to ${KILIMANJARO_ROUTES[routeKey].name}`;
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
    lastEventLog = `Day ${dayNum}: ${placeId} (${endAlt}m)`;
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
    lastEventLog = droneActive ? 'Drone orbit active' : 'Drone orbit stopped';
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
    lastEventLog = 'Reset camera to full overview';
  }

  function handleScrub(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    liveDistanceKm = val;
    bridge?.send({ type: 'scrub', km: val });
    lastEventLog = `Scrubbed to ${val} km`;
  }
</script>

<div class="h-screen w-screen flex flex-col overflow-hidden bg-zinc-950 text-zinc-100 select-none">
  <!-- Top Global Header (Fits on Screen) -->
  <header class="h-14 shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 z-30">
    <!-- Left: Brand & Route Tabs -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
          3D
        </div>
        <div class="flex items-baseline gap-1.5">
          <span class="font-bold text-white tracking-tight text-sm">KiliSpatial<span class="text-emerald-400">.</span></span>
          <span class="text-[10px] font-mono text-zinc-500 hidden xl:inline-block">Studio</span>
        </div>
      </div>

      <!-- Route Selector Segmented Pills -->
      <div class="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800/80">
        {#each Object.values(KILIMANJARO_ROUTES) as routeItem}
          {@const isSelected = selectedRouteId === routeItem.id}
          <button
            onclick={() => switchRoute(routeItem.id)}
            class={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>{routeItem.name.replace('Route', '').trim()}</span>
            <span
              class={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800/60 text-zinc-500'
              }`}
            >
              {routeItem.durationDays}D
            </span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Center: Key Telemetry Strip -->
    <div class="hidden md:flex items-center gap-3 text-xs font-mono">
      <div class="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-zinc-400">Elevation:</span>
        <span class="text-amber-300 font-bold">{liveElevation.toLocaleString()}m</span>
        <span class="text-zinc-500">({Math.round(liveElevation * 3.28084).toLocaleString()} ft)</span>
      </div>

      <div class="px-2.5 py-1 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400">
        <span>Summit Rate: <strong class="text-emerald-400">{currentPackage.successRate}</strong></span>
      </div>
    </div>

    <!-- Right: Quick Jumps & Action CTAs -->
    <div class="flex items-center gap-2">
      <!-- Quick Waypoint Jumps -->
      <div class="hidden lg:flex items-center gap-1">
        <button
          onclick={() => jumpToPlace('lava-tower')}
          class="text-[11px] font-mono px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
        >
          Lava Tower (4.6k)
        </button>
        <button
          onclick={() => jumpToPlace('barranco-camp')}
          class="text-[11px] font-mono px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
        >
          Barranco Wall
        </button>
        <button
          onclick={() => jumpToPlace('uhuru-peak')}
          class="text-[11px] font-mono px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-1 font-semibold"
        >
          <Flame class="w-3 h-3 text-amber-400" />
          Uhuru (5,895m)
        </button>
      </div>

      <button
        onclick={() => (showEmbedModal = true)}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
      >
        <Code2 class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Embed SDK</span>
      </button>

      <a
        href="#inquire"
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition shadow-sm cursor-pointer"
      >
        <span>Book Route</span>
        <ArrowUpRight class="w-3.5 h-3.5" />
      </a>
    </div>
  </header>

  <!-- Main Viewport Workspace: Full Height (No empty vertical scrolling) -->
  <div class="flex-1 flex overflow-hidden relative">
    <!-- Left Panel: Expedition Itinerary Drawer -->
    <div class="w-80 md:w-96 h-full flex flex-col bg-zinc-950 border-r border-zinc-800 shrink-0 z-20">
      <!-- Mini Summary Header -->
      <div class="p-3 border-b border-zinc-800/80 bg-zinc-900/30">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="font-bold text-white">{currentPackage.name}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {currentPackage.badge}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-zinc-400 mt-2">
          <div class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block">TRAIL</span>
            <span class="text-zinc-200 font-semibold">{currentPackage.totalDistanceKm} km</span>
          </div>
          <div class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block">ACCOM</span>
            <span class="text-zinc-200 font-semibold">{currentPackage.accommodation.split(' ')[0]}</span>
          </div>
          <div class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
            <span class="text-zinc-500 text-[10px] block">STARTING</span>
            <span class="text-emerald-400 font-semibold">${currentPackage.startingPriceUsd}</span>
          </div>
        </div>
      </div>

      <!-- Scrollable Day-by-Day List -->
      <div class="flex-1 overflow-y-auto p-2.5 space-y-2">
        {#each currentPackage.days as item (item.day)}
          {@const isSelected = activeDay === item.day}
          <div
            role="button"
            tabindex="0"
            onclick={() => selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm)}
            onkeydown={(e) => e.key === 'Enter' && selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm)}
            class={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-zinc-800/95 border-emerald-500/70 shadow-lg shadow-black/40 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div class="flex items-center justify-between gap-1 text-[11px] font-mono mb-1">
              <div class="flex items-center gap-1.5">
                <span
                  class={`px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  DAY {item.day}
                </span>
                <span class="text-zinc-400 text-[10px] truncate max-w-[110px]">{item.zone}</span>
              </div>

              <div class="text-emerald-400">
                <span class="text-zinc-500">{item.startAlt}m →</span>
                <strong class="text-white">{item.endAlt}m</strong>
              </div>
            </div>

            <h4 class="text-xs font-bold text-white">{item.title}</h4>

            <div class="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400 font-mono">
              <span class="flex items-center gap-1">
                <Footprints class="w-3 h-3 text-zinc-500" />
                {item.distanceKm} km
              </span>
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3 text-zinc-500" />
                {item.hikingHours}
              </span>
              {#if item.peakAlt}
                <span class="text-amber-400 flex items-center gap-0.5">
                  ▲ {item.peakAlt}m
                </span>
              {/if}
            </div>

            {#if isSelected}
              <div class="mt-2 text-[11px] text-zinc-300 leading-relaxed border-t border-zinc-700/60 pt-2">
                <p>{item.summary}</p>
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each item.highlights as chip}
                    <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <CheckCircle2 class="w-2.5 h-2.5 text-emerald-400" />
                      {chip}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Bottom Operator Accreditation Badge -->
      <div class="p-2.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span>KPAP Ethical Trek Partner</span>
        <span class="text-emerald-400 font-semibold">TALA Lic. 2026</span>
      </div>
    </div>

    <!-- Right Stage: Full Height 3D Viewport & Cockpit -->
    <div class="flex-1 h-full relative overflow-hidden bg-black flex flex-col">
      <!-- Top Floating Viewport Control Bar -->
      <div class="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div class="px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 flex items-center gap-2 shadow-lg">
          <span class="w-2 h-2 rounded-full {viewMode === 'native' || bridgeReady ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse"></span>
          <span class="text-xs font-mono text-zinc-200">
            DAY {activeDay}: <strong class="text-emerald-400">{currentDayObj.title}</strong>
          </span>
        </div>

        <div class="flex items-center gap-2 pointer-events-auto">
          <!-- Viewport Mode Toggle -->
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
              Iframe Sync Test
            </button>
          </div>

          <div class="px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 text-xs font-mono text-amber-300 shadow-lg flex items-center gap-1.5">
            <Mountain class="w-3.5 h-3.5" />
            <span><strong>{liveElevation}m</strong> ({Math.round(liveElevation * 3.28084).toLocaleString()} ft)</span>
          </div>
        </div>
      </div>

      <!-- 3D Canvas / Viewport Layer (Occupies 100% of the stage) -->
      <div class="flex-1 w-full h-full relative">
        {#if viewMode === 'native'}
          <NativeMap3D
            bind:this={nativeMapRef}
            selectedRoute={selectedRouteId}
            activeDay={activeDay}
            droneActive={droneActive}
            onPlaceSelect={(id, alt) => {
              activePlace = id;
              liveElevation = alt;
              lastEventLog = `Waypoint: ${id} (${alt}m)`;
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
            style="width: 100%; height: 100%; border: 0;"
          ></iframe>
        {/if}
      </div>

      <!-- Docked Bottom Flight Control Deck & Elevation Profile (Zero Wasted Space) -->
      <div class="shrink-0 p-3 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 space-y-2 z-20">
        <!-- Interactive Controls Row -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              onclick={togglePlayRoute}
              class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                tourPlaying
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
              }`}
            >
              {#if tourPlaying}
                <Pause class="w-3.5 h-3.5" />
                <span>Pause</span>
              {:else}
                <Play class="w-3.5 h-3.5 text-emerald-400" />
                <span>Play Flythrough</span>
              {/if}
            </button>

            <button
              onclick={toggleDrone}
              class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                droneActive
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
              }`}
            >
              <RotateCw class={`w-3.5 h-3.5 ${droneActive ? 'animate-spin' : 'text-emerald-400'}`} />
              <span>{droneActive ? 'Stop Orbit' : 'Drone Orbit'}</span>
            </button>

            <button
              onclick={resetOverview}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer"
            >
              <Maximize2 class="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset Overview</span>
            </button>

            <button
              onclick={() => (showElevationProfile = !showElevationProfile)}
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 cursor-pointer"
            >
              <span>Profile</span>
              {#if showElevationProfile}
                <ChevronDown class="w-3 h-3" />
              {:else}
                <ChevronUp class="w-3 h-3" />
              {/if}
            </button>
          </div>

          <!-- Trail Scrubber & Telemetry Line -->
          <div class="flex items-center gap-4 flex-1 max-w-md">
            <div class="flex-1 flex items-center gap-2">
              <span class="text-[10px] font-mono text-zinc-400 shrink-0">{liveDistanceKm} km</span>
              <input
                type="range"
                min="0"
                max={currentPackage.totalDistanceKm}
                step="0.5"
                value={liveDistanceKm}
                oninput={handleScrub}
                class="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
              <span class="text-[10px] font-mono text-zinc-400 shrink-0">{currentPackage.totalDistanceKm} km</span>
            </div>

            <div class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 shrink-0 max-w-[200px] truncate">
              <Terminal class="w-3 h-3 text-emerald-400 shrink-0" />
              <span class="truncate">{lastEventLog}</span>
            </div>
          </div>
        </div>

        <!-- Collapsible Elevation Profile SVG Chart -->
        {#if showElevationProfile}
          <div class="pt-1">
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
                lastEventLog = `Scrubbed to ${km} km`;
              }}
            />
          </div>
        {/if}
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
