<script lang="ts">
  import type { RouteId } from '../lib/kilispatial';

  let {
    isOpen = $bindable(false),
    currentRoute = 'machame' as RouteId,
    currentDay = 1,
    deployUrl = 'https://kili.xenohuru.com'
  } = $props();

  let selectedRoute = $state<RouteId>(currentRoute);
  let startDay = $state<number>(currentDay);
  let autoDrone = $state<boolean>(false);
  let showChart = $state<boolean>(true);
  let showDayChips = $state<boolean>(true);
  let activeTab = $state<'iframe' | 'sdk'>('iframe');
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
  title="Kilimanjaro ${selectedRoute} route in 3D"
  loading="lazy"
  allow="fullscreen"
  style="width:100%; aspect-ratio:16/10; min-height:420px; border:0; border-radius:16px;"
></iframe>`
  );

  let sdkSnippet = $derived(
`// 1. Send commands from your itinerary rows to KiliSpatial
const frame = document.getElementById('kilispatial-viewer');
const send = (msg) =>
  frame.contentWindow.postMessage({ source: 'kilispatial', ...msg }, '${deployUrl}');

// Example: When traveler clicks Day ${startDay} in your accordion
send({ type: 'selectRoute', id: '${selectedRoute}' });
send({ type: 'focusDay', day: ${startDay} });
send({ type: 'drone', on: ${autoDrone} });

// 2. Listen to 3D viewer events to highlight your page's itinerary row
window.addEventListener('message', (e) => {
  if (e.origin !== '${deployUrl}' || e.data?.source !== 'kilispatial') return;
  if (e.data.type === 'day') {
    console.log('Traveler selected Day:', e.data.day);
  }
  if (e.data.type === 'progress') {
    console.log('Distance:', e.data.km, 'km | Altitude:', e.data.elevation, 'm');
  }
});`
  );

  function copyCode() {
    const text = activeTab === 'iframe' ? iframeSnippet : sdkSnippet;
    navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div class="relative w-full max-w-2xl rounded-2xl bg-[#0e1610] border border-white/15 p-6 shadow-2xl text-[#f0ede6]">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <span class="text-xs font-mono uppercase tracking-wider text-emerald-400">B2B Tour Operator SDK</span>
          <h3 class="text-xl font-bold mt-0.5">Embed KiliSpatial 3D on Your Website</h3>
        </div>
        <button
          onclick={() => (isOpen = false)}
          class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <!-- URL Parameter Configurator -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 p-4 rounded-xl bg-black/40 border border-white/10">
        <div>
          <label class="block text-xs text-neutral-400 mb-1 font-mono" for="route-select">Route Parameter</label>
          <select
            id="route-select"
            bind:value={selectedRoute}
            class="w-full bg-[#142018] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="machame">machame</option>
            <option value="lemosho">lemosho</option>
            <option value="marangu">marangu</option>
            <option value="rongai">rongai</option>
            <option value="northern-circuit">northern-circuit</option>
            <option value="umbwe">umbwe</option>
            <option value="shira">shira</option>
            <option value="all">all (Overview)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-neutral-400 mb-1 font-mono" for="day-input">Initial Day (`day`)</label>
          <input
            id="day-input"
            type="number"
            min="1"
            max="9"
            bind:value={startDay}
            class="w-full bg-[#142018] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <div class="flex flex-col justify-center space-y-2 text-xs pt-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={autoDrone} class="accent-emerald-500" />
            <span>Auto Drone Orbit (`drone=1`)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={showChart} class="accent-emerald-500" />
            <span>Show Elevation Chart</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={showDayChips} class="accent-emerald-500" />
            <span>Show Day Chips</span>
          </label>
        </div>
      </div>

      <!-- Code Tabs -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex gap-2">
          <button
            onclick={() => (activeTab = 'iframe')}
            class={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'iframe'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            1. HTML &lt;iframe&gt;
          </button>
          <button
            onclick={() => (activeTab = 'sdk')}
            class={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'sdk'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            2. postMessage Sync API
          </button>
        </div>

        <button
          onclick={copyCode}
          class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition"
        >
          {copied ? '✓ Copied to Clipboard' : 'Copy Snippet'}
        </button>
      </div>

      <!-- Code Output Box -->
      <pre class="p-4 rounded-xl bg-black/90 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">{activeTab === 'iframe' ? iframeSnippet : sdkSnippet}</pre>

      <!-- Domain Whitelist Note -->
      <div class="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 flex items-center justify-between">
        <span>
          <strong>Security Note:</strong> Domain whitelisting via <code class="font-mono">frame-ancestors</code> &amp; <code class="font-mono">VITE_EMBED_ORIGINS</code> is enabled per partner domain.
        </span>
      </div>
    </div>
  </div>
{/if}
