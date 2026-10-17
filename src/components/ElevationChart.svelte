<script lang="ts">
  import type { ItineraryDay } from '../lib/routes-data';

  interface Props {
    days: ItineraryDay[];
    activeDay: number;
    liveDistanceKm: number;
    onSelectDay: (day: number) => void;
    onScrub?: (km: number) => void;
  }

  let {
    days = [],
    activeDay = 1,
    liveDistanceKm = 0,
    onSelectDay,
    onScrub
  }: Props = $props();

  // Compute points with cumulative km
  let dataPoints = $derived.by(() => {
    let runningKm = 0;
    const pts = [
      {
        day: 1,
        title: days[0]?.fromPlace || 'Gate',
        alt: days[0]?.startAlt || 1800,
        km: 0
      }
    ];

    days.forEach((d) => {
      runningKm += d.distanceKm;
      pts.push({
        day: d.day,
        title: d.title.split(' to ').pop() || `Day ${d.day}`,
        alt: d.endAlt,
        km: runningKm
      });
    });

    return pts;
  });

  let totalKm = $derived(dataPoints[dataPoints.length - 1]?.km || 62);
  let minAlt = 1500;
  let maxAlt = 6000;

  // Chart dimensions
  const width = 560;
  const height = 110;
  const padX = 24;
  const padY = 16;

  function getX(km: number): number {
    return padX + (km / totalKm) * (width - 2 * padX);
  }

  function getY(alt: number): number {
    const norm = (alt - minAlt) / (maxAlt - minAlt);
    return height - padY - norm * (height - 2 * padY);
  }

  let linePath = $derived.by(() => {
    if (dataPoints.length === 0) return '';
    return dataPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.km).toFixed(1)} ${getY(p.alt).toFixed(1)}`)
      .join(' ');
  });

  let areaPath = $derived.by(() => {
    if (dataPoints.length === 0) return '';
    const firstX = getX(dataPoints[0].km).toFixed(1);
    const lastX = getX(dataPoints[dataPoints.length - 1].km).toFixed(1);
    const bottomY = (height - padY).toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  });

  let currentX = $derived(getX(Math.min(liveDistanceKm, totalKm)));

  function handleSvgClick(e: MouseEvent) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clickX - padX) / (width - 2 * padX)));
    const targetKm = Number((ratio * totalKm).toFixed(1));
    onScrub?.(targetKm);

    // Find closest day
    let closestDay = 1;
    let minDiff = Infinity;
    for (const pt of dataPoints) {
      const diff = Math.abs(pt.km - targetKm);
      if (diff < minDiff) {
        minDiff = diff;
        closestDay = pt.day;
      }
    }
    onSelectDay(closestDay);
  }
</script>

<div class="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3.5 backdrop-blur-md">
  <div class="flex items-center justify-between mb-2 text-xs">
    <div class="flex items-center gap-2">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      <span class="font-mono text-zinc-300 font-medium">Elevation Profile (m)</span>
    </div>
    <div class="font-mono text-[11px] text-zinc-500">
      Peak: <span class="text-amber-400 font-semibold">5,895 m</span> · Total: <span class="text-emerald-400 font-semibold">{totalKm} km</span>
    </div>
  </div>

  <div class="relative w-full overflow-hidden select-none">
    <!-- SVG Area Chart -->
    <svg
      viewBox={`0 0 ${width} ${height}`}
      class="w-full h-auto cursor-crosshair"
      role="application"
      aria-label="Elevation profile chart"
      onclick={handleSvgClick}
      onkeydown={(e) => {
        if (e.key === 'ArrowRight') onScrub?.(Math.min(totalKm, liveDistanceKm + 1));
        if (e.key === 'ArrowLeft') onScrub?.(Math.max(0, liveDistanceKm - 1));
      }}
      tabindex="0"
    >
      <defs>
        <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#34d399" />
          <stop offset="85%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#fbbf24" />
        </linearGradient>
      </defs>

      <!-- Horizontal gridlines -->
      <line x1={padX} y1={getY(2000)} x2={width - padX} y2={getY(2000)} stroke="#27272a" stroke-dasharray="3 3" stroke-width="0.8" />
      <text x={padX - 4} y={getY(2000) + 3} fill="#52525b" font-size="8" font-family="monospace" text-anchor="end">2k</text>

      <line x1={padX} y1={getY(4000)} x2={width - padX} y2={getY(4000)} stroke="#27272a" stroke-dasharray="3 3" stroke-width="0.8" />
      <text x={padX - 4} y={getY(4000) + 3} fill="#52525b" font-size="8" font-family="monospace" text-anchor="end">4k</text>

      <line x1={padX} y1={getY(5895)} x2={width - padX} y2={getY(5895)} stroke="#3f3f46" stroke-dasharray="2 2" stroke-width="0.8" />
      <text x={width - padX - 4} y={getY(5895) - 3} fill="#f59e0b" font-size="8" font-family="monospace" text-anchor="end">Uhuru Peak (5,895m)</text>

      <!-- Area fill -->
      <path d={areaPath} fill="url(#elevationGrad)" />

      <!-- Elevation line -->
      <path d={linePath} fill="none" stroke="url(#lineGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Current scrub position indicator -->
      <line
        x1={currentX}
        y1={padY - 4}
        x2={currentX}
        y2={height - padY}
        stroke="#10b981"
        stroke-width="1.5"
      />
      <circle cx={currentX} cy={padY - 4} r="2.5" fill="#10b981" />

      <!-- Waypoint node markers -->
      {#each dataPoints as pt}
        {@const px = getX(pt.km)}
        {@const py = getY(pt.alt)}
        {@const isCurrent = pt.day === activeDay}
        <g
          class="transition-transform duration-150 cursor-pointer"
          role="button"
          tabindex="0"
          aria-label={`Select Day ${pt.day}: ${pt.title} at ${pt.alt} meters`}
          onclick={(e) => {
            e.stopPropagation();
            onSelectDay(pt.day);
          }}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectDay(pt.day);
            }
          }}
        >
          <circle
            cx={px}
            cy={py}
            r={isCurrent ? 4.5 : 2.5}
            fill={isCurrent ? '#fbbf24' : '#18181b'}
            stroke={isCurrent ? '#fef08a' : '#10b981'}
            stroke-width={isCurrent ? 2 : 1.2}
          />
        </g>
      {/each}
    </svg>
  </div>
</div>
