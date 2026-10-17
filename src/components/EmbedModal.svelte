<script lang="ts">
  import type { RouteId } from '../lib/kilispatial';
  import {
    Copy,
    Check,
    X,
    Code2,
    SlidersHorizontal,
    ShieldAlert,
    Terminal,
    Layers,
    FileCode2
  } from 'lucide-svelte';

  let {
    isOpen = $bindable(false),
    currentRoute = 'machame' as RouteId,
    currentDay = 1,
    deployUrl = 'https://kili.xenohuru.com'
  } = $props();

  let selectedRoute = $state<RouteId>('machame');
  let startDay = $state<number>(1);
  let autoDrone = $state<boolean>(false);
  let showChart = $state<boolean>(true);
  let showDayChips = $state<boolean>(true);
  let activeTab = $state<'iframe' | 'sdk' | 'react'>('iframe');
  let copied = $state<boolean>(false);

  $effect(() => {
    selectedRoute = currentRoute;
    startDay = currentDay;
  });

  let embedUrl = $derived.by(() => {
    const params = new URLSearchParams();
    params.set('route', selectedRoute);
    if (startDay > 1) params.set('day', String(startDay));
    if (autoDrone) params.set('drone', '1');
    if (!showChart) params.set('chart', '0');
    if (!showDayChips) params.set('days', '0');
    return `${deployUrl}/embed?${params.toString()}`;
  });

  let iframeSnippet = $derived(
`<iframe
  id="kilispatial-viewer"
  src="${embedUrl}"
  title="Kilimanjaro ${selectedRoute} 3D Route"
  loading="lazy"
  allow="fullscreen"
  style="width: 100%; aspect-ratio: 16/10; min-height: 480px; border: 0; border-radius: 16px;"
></iframe>`
  );

  let sdkSnippet = $derived(
`import { KiliSpatialBridge } from '@kilispatial/sdk';

// 1. Initialize the bridge on your tour page
const iframe = document.getElementById('kilispatial-viewer') as HTMLIFrameElement;
const bridge = new KiliSpatialBridge(iframe, '${deployUrl}');

// 2. Fly camera when traveler selects Day ${startDay} in your itinerary
bridge.send({ type: 'selectRoute', id: '${selectedRoute}' });
bridge.send({ type: 'focusDay', day: ${startDay} });
bridge.send({ type: 'drone', on: ${autoDrone} });

// 3. Listen to 3D waypoint clicks to highlight the active day
bridge.listen((event) => {
  if (event.type === 'day') {
    setActiveItineraryDay(event.day);
  } else if (event.type === 'progress') {
    console.log(\`Traveler at \${event.km} km, elevation \${event.elevation} m\`);
  }
});`
  );

  let reactSnippet = $derived(
`import { useEffect, useRef } from 'react';

export function KiliSpatialViewer({ route = '${selectedRoute}', day = ${startDay} }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== '${deployUrl}' || e.data?.source !== 'kilispatial') return;
      if (e.data.type === 'day') {
        console.log('Active Day:', e.data.day);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="${embedUrl}"
      title="Kilimanjaro 3D"
      className="w-full aspect-[16/10] min-h-[480px] rounded-2xl border-0"
      allow="fullscreen"
    />
  );
}`
  );

  function copyCode() {
    const text =
      activeTab === 'iframe'
        ? iframeSnippet
        : activeTab === 'sdk'
        ? sdkSnippet
        : reactSnippet;
    navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Card Container -->
    <div
      class="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-start justify-between pb-4 border-b border-zinc-800">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code2 class="w-3 h-3" />
              B2B Partner SDK
            </span>
            <span class="text-xs text-zinc-500">v2.4 Production</span>
          </div>
          <h3 class="text-lg font-bold text-white mt-1.5 tracking-tight">
            Configure &amp; Embed 3D Viewport
          </h3>
          <p class="text-xs text-zinc-400 mt-0.5">
            Integrate Mount Kilimanjaro interactive 3D trekking maps into your travel agency website.
          </p>
        </div>

        <button
          onclick={() => (isOpen = false)}
          class="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Configurator Controls -->
      <div class="my-5 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div class="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <SlidersHorizontal class="w-3.5 h-3.5 text-emerald-400" />
          <span>URL Parameters &amp; Initialization State</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1.5" for="route-param">
              Default Expedition Route
            </label>
            <select
              id="route-param"
              bind:value={selectedRoute}
              class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="machame">Machame Route (7 Days)</option>
              <option value="lemosho">Lemosho Route (8 Days)</option>
              <option value="marangu">Marangu Route (6 Days)</option>
              <option value="rongai">Rongai Route (7 Days)</option>
              <option value="northern-circuit">Northern Circuit (9 Days)</option>
              <option value="umbwe">Umbwe Route (6 Days)</option>
              <option value="shira">Shira Route (8 Days)</option>
              <option value="all">All Routes (Full Overview)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1.5" for="day-param">
              Initial Active Day (`day`)
            </label>
            <input
              id="day-param"
              type="number"
              min="1"
              max="9"
              bind:value={startDay}
              class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
          <label class="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60 cursor-pointer text-xs text-zinc-300 hover:text-white">
            <input type="checkbox" bind:checked={autoDrone} class="accent-emerald-500 rounded" />
            <span>Auto Drone Orbit</span>
          </label>
          <label class="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60 cursor-pointer text-xs text-zinc-300 hover:text-white">
            <input type="checkbox" bind:checked={showChart} class="accent-emerald-500 rounded" />
            <span>Elevation Profile</span>
          </label>
          <label class="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60 cursor-pointer text-xs text-zinc-300 hover:text-white">
            <input type="checkbox" bind:checked={showDayChips} class="accent-emerald-500 rounded" />
            <span>Day Waypoint Chips</span>
          </label>
        </div>
      </div>

      <!-- Code Output Header with Tabs -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
          <button
            onclick={() => (activeTab = 'iframe')}
            class={`px-3 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer ${
              activeTab === 'iframe'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            HTML &lt;iframe&gt;
          </button>
          <button
            onclick={() => (activeTab = 'sdk')}
            class={`px-3 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer ${
              activeTab === 'sdk'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            TypeScript SDK
          </button>
          <button
            onclick={() => (activeTab = 'react')}
            class={`px-3 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer ${
              activeTab === 'react'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            React / Next.js
          </button>
        </div>

        <button
          onclick={copyCode}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 transition cursor-pointer"
        >
          {#if copied}
            <Check class="w-3.5 h-3.5" />
            <span>Copied to Clipboard!</span>
          {:else}
            <Copy class="w-3.5 h-3.5" />
            <span>Copy Snippet</span>
          {/if}
        </button>
      </div>

      <!-- Code Editor Display -->
      <div class="relative rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
        <div class="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
            <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
            <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
            <span class="ml-1 text-zinc-500">{activeTab === 'iframe' ? 'embed.html' : activeTab === 'sdk' ? 'kilispatial-sync.ts' : 'KiliSpatialViewer.tsx'}</span>
          </div>
          <span>UTF-8</span>
        </div>
        <pre class="p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto leading-relaxed">{activeTab === 'iframe' ? iframeSnippet : activeTab === 'sdk' ? sdkSnippet : reactSnippet}</pre>
      </div>

      <!-- Enterprise Security Note -->
      <div class="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
        <ShieldAlert class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div class="leading-relaxed">
          <span class="text-zinc-200 font-medium">Domain Whitelisting Required:</span>
          Add your domain to <code class="font-mono text-emerald-400 text-[11px]">VITE_EMBED_ORIGINS</code> and <code class="font-mono text-emerald-400 text-[11px]">frame-ancestors</code> CSP header in your engine configuration before deploying to production.
        </div>
      </div>
    </div>
  </div>
{/if}
