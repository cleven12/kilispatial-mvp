<script lang="ts">
  import { onMount } from 'svelte';
  import { KiliSpatialBridge, type KiliEvent, type RouteId } from '../lib/kilispatial';
  import { KILIMANJARO_ROUTES } from '../lib/routes-data';
  import EmbedModal from './EmbedModal.svelte';

  const DEFAULT_ORIGIN = (import.meta.env.PUBLIC_KILI_ORIGIN as string) || 'https://kili.xenohuru.com';

  // Reactive Svelte 5 Runes State
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
  let lastEventLog = $state<string>('Initializing KiliSpatial 3D Engine...');

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

    bridge?.send({ type: 'focusDay', day: dayNum });
    bridge?.send({ type: 'focusPlace', id: placeId });
    lastEventLog = `Host sent: focusDay(${dayNum}) & focusPlace('${placeId}')`;
  }

  function toggleDrone() {
    droneActive = !droneActive;
    bridge?.send({ type: 'drone', on: droneActive });
    lastEventLog = `Host sent: drone(${droneActive})`;
  }

  function togglePlayRoute() {
    tourPlaying = !tourPlaying;
    bridge?.send({ type: 'play', on: tourPlaying });
    lastEventLog = `Host sent: play(${tourPlaying})`;
  }

  function resetOverview() {
    droneActive = false;
    tourPlaying = false;
    bridge?.send({ type: 'showRoute' });
    lastEventLog = `Host sent: showRoute()`;
  }

  function handleScrub(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    liveDistanceKm = val;
    bridge?.send({ type: 'scrub', km: val });
    lastEventLog = `Host sent: scrub(${val} km)`;
  }
</script>

<!-- Top Route Switcher & B2B Action Bar -->
<div class="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-white/10">
  <div class="flex flex-wrap items-center gap-2">
    {#each Object.values(KILIMANJARO_ROUTES) as routeItem}
      <button
        onclick={() => switchRoute(routeItem.id)}
        class={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
          selectedRouteId === routeItem.id
            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
            : 'bg-[#0e1610] text-neutral-300 border border-white/10 hover:border-emerald-500/40'
        }`}
      >
        <span>{routeItem.name}</span>
        <span
          class={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
            selectedRouteId === routeItem.id
              ? 'bg-black/20 text-black font-bold'
              : 'bg-white/5 text-emerald-400'
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
      class="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center gap-2 cursor-pointer"
    >
      <span>&lt;/&gt; Embed 3D Map on Your Tour Site</span>
    </button>
  </div>
</div>

<!-- Package Hero Summary Strip -->
<div class="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
  <div class="p-3.5 rounded-xl bg-[#0e1610]/90 border border-white/10">
    <div class="text-[11px] font-mono uppercase text-neutral-400">Route Nickname</div>
    <div class="text-sm font-bold text-white mt-0.5">{currentPackage.nickname}</div>
  </div>
  <div class="p-3.5 rounded-xl bg-[#0e1610]/90 border border-white/10">
    <div class="text-[11px] font-mono uppercase text-neutral-400">Duration / Distance</div>
    <div class="text-sm font-bold text-white mt-0.5">{currentPackage.durationDays} Days · {currentPackage.totalDistanceKm} km</div>
  </div>
  <div class="p-3.5 rounded-xl bg-[#0e1610]/90 border border-white/10">
    <div class="text-[11px] font-mono uppercase text-neutral-400">Summit Success</div>
    <div class="text-sm font-bold text-emerald-400 mt-0.5">{currentPackage.successRate} Verified</div>
  </div>
  <div class="p-3.5 rounded-xl bg-[#0e1610]/90 border border-white/10">
    <div class="text-[11px] font-mono uppercase text-neutral-400">Accommodation</div>
    <div class="text-sm font-bold text-white mt-0.5">{currentPackage.accommodation}</div>
  </div>
  <div class="p-3.5 rounded-xl bg-[#0e1610]/90 border border-white/10">
    <div class="text-[11px] font-mono uppercase text-neutral-400">Active Camp Elevation</div>
    <div class="text-sm font-bold text-amber-400 font-mono mt-0.5">{liveElevation.toLocaleString()} m</div>
  </div>
  <div class="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col justify-between">
    <div class="text-[11px] font-mono uppercase text-emerald-300">Package Starting At</div>
    <div class="text-lg font-extrabold text-white">${currentPackage.startingPriceUsd.toLocaleString()} <span class="text-xs font-normal text-neutral-400">/pp</span></div>
  </div>
</div>

<!-- Main Split Showcase: Left Itinerary | Right Sticky 3D Engine -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
  <!-- LEFT COLUMN: Interactive Day-by-Day Operator Itinerary -->
  <div class="lg:col-span-5 space-y-3">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold tracking-tight">Day-by-Day Expedition Itinerary</h2>
      <span class="text-xs font-mono text-emerald-400">Click any day to fly 3D camera</span>
    </div>

    <div class="space-y-3 max-h-[680px] overflow-y-auto pr-1.5">
      {#each currentPackage.days as item (item.day)}
        {@const isSelected = activeDay === item.day}
        <div
          role="button"
          tabindex="0"
          onclick={() => selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm)}
          onkeydown={(e) => e.key === 'Enter' && selectDayStep(item.day, item.toPlaceId, item.endAlt, item.distanceKm)}
          class={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            isSelected
              ? 'bg-[#122117] border-emerald-500/60 shadow-lg shadow-emerald-950/50'
              : 'bg-[#0e1610]/70 border-white/10 hover:border-white/25 hover:bg-[#0e1610]'
          }`}
        >
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-2">
              <span
                class={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-emerald-500 text-black' : 'bg-white/10 text-neutral-300'
                }`}
              >
                DAY {item.day}
              </span>
              <span class="text-xs font-mono text-neutral-400">{item.zone}</span>
            </div>

            <div class="text-xs font-mono text-emerald-400">
              {item.startAlt}m → <strong>{item.endAlt}m</strong>
            </div>
          </div>

          <h3 class="text-base font-bold text-white">{item.title}</h3>

          <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-400 font-mono">
            <span>🥾 {item.distanceKm} km</span>
            <span>⏱ {item.hikingHours}</span>
            {#if item.peakAlt}
              <span class="text-amber-400">▲ Max Alt: {item.peakAlt}m</span>
            {/if}
          </div>

          {#if isSelected}
            <p class="mt-3 text-sm text-neutral-300 leading-relaxed border-t border-white/10 pt-3">
              {item.summary}
            </p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              {#each item.highlights as chip}
                <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  ✓ {chip}
                </span>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- RIGHT COLUMN: Sticky Embedded KiliSpatial 3D Engine & Telemetry Control Deck -->
  <div class="lg:col-span-7 lg:sticky lg:top-6 space-y-4">
    <!-- 3D Viewer Frame Container -->
    <div class="relative rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
      <!-- Top Floating HUD Bar -->
      <div class="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div class="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
          <span class="w-2 h-2 rounded-full {bridgeReady ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse"></span>
          <span class="text-xs font-mono text-white">
            DAY {activeDay}: <strong class="text-emerald-400">{currentDayObj.title}</strong>
          </span>
        </div>

        <div class="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-xs font-mono text-amber-300">
          Elevation: <strong>{liveElevation}m</strong> ({Math.round(liveElevation * 3.28084).toLocaleString()} ft)
        </div>
      </div>

      {#if !bridgeReady && isCspBlocked}
        <div class="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md text-left">
          <div class="max-w-lg w-full bg-[#111c14] border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-3.5">
            <div class="flex items-start gap-3">
              <span class="text-2xl">⚠️</span>
              <div>
                <h4 class="text-sm font-bold text-amber-300">Remote Engine Refused Connection (CSP Block)</h4>
                <p class="text-xs text-neutral-300 mt-1 leading-relaxed">
                  Your browser blocked the iframe because <code class="text-emerald-400 font-mono">http://localhost:4321</code> is not yet whitelisted on the remote <code class="text-emerald-400 font-mono">{deployOrigin}</code> server.
                </p>
              </div>
            </div>

            <div class="bg-black/60 rounded-xl p-3 border border-white/10 font-mono text-[11px] text-neutral-300 space-y-2">
              <div class="text-neutral-400 font-sans font-semibold">Whitelist localhost in your engine repo:</div>
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
                class="flex-1 bg-black/70 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <button
                onclick={() => setOrigin(deployOrigin)}
                class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition cursor-pointer"
              >
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
        style="width: 100%; aspect-ratio: 16/10; min-height: 460px; border: 0;"
      ></iframe>
    </div>

    <!-- Bidirectional postMessage Control Deck -->
    <div class="p-4 rounded-2xl bg-[#0e1610] border border-white/10 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            onclick={togglePlayRoute}
            class={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              tourPlaying
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            {tourPlaying ? '⏸ Pause 3D Flythrough' : '▶ Play Route Flythrough'}
          </button>

          <button
            onclick={toggleDrone}
            class={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              droneActive
                ? 'bg-emerald-500 text-black'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            🚁 {droneActive ? 'Stop Drone Orbit' : 'Orbit Drone Camera'}
          </button>

          <button
            onclick={resetOverview}
            class="px-3.5 py-2 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition cursor-pointer"
          >
            🗺️ Full Route Overview
          </button>
        </div>

        <!-- Quick Checkpoint Jump -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-mono text-neutral-400">Quick Jump:</span>
          <button
            onclick={() => bridge?.send({ type: 'focusPlace', id: 'lava-tower' })}
            class="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border border-white/10 cursor-pointer"
          >
            Lava Tower
          </button>
          <button
            onclick={() => bridge?.send({ type: 'focusPlace', id: 'barranco-camp' })}
            class="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border border-white/10 cursor-pointer"
          >
            Barranco
          </button>
          <button
            onclick={() => bridge?.send({ type: 'focusPlace', id: 'uhuru-peak' })}
            class="text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer"
          >
            Uhuru Peak (5,895m)
          </button>
        </div>
      </div>

      <!-- Interactive Distance Scrubber (tests `scrub` command) -->
      <div class="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1">
          <div class="flex justify-between text-xs font-mono text-neutral-400 mb-1">
            <span>Scrub Trail Distance (`scrub` API)</span>
            <span class="text-emerald-400">{liveDistanceKm} km / {currentPackage.totalDistanceKm} km</span>
          </div>
          <input
            type="range"
            min="0"
            max={currentPackage.totalDistanceKm}
            step="0.5"
            value={liveDistanceKm}
            oninput={handleScrub}
            class="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <!-- Live postMessage Telemetry Status -->
        <div class="sm:w-64 px-3 py-2 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-neutral-400 truncate">
          <span class="text-emerald-400">⚡ Bridge:</span> {lastEventLog}
        </div>
      </div>
    </div>

    <!-- High-Conversion Operator Booking Callout -->
    <div class="p-5 rounded-2xl bg-gradient-to-r from-[#112217] to-[#0e1610] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">KPAP Ethical Partner</span>
          <span class="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">TALA Licensed</span>
        </div>
        <h4 class="text-base font-bold text-white mt-1.5">
          Ready to trek the {currentPackage.name}?
        </h4>
        <p class="text-xs text-neutral-300">
          Guaranteed 2026/2027 departures · Pulse oximeters &amp; emergency oxygen included on every climb.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <a
          href="#inquire"
          class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition"
        >
          Book This Route
        </a>
        <button
          onclick={() => (showEmbedModal = true)}
          class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/15 transition cursor-pointer"
        >
          Get 3D Widget
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
