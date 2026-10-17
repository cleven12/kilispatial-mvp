<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../lib/utils';

  type BadgeVariant = 'default' | 'secondary' | 'outline' | 'emerald' | 'amber' | 'blue';

  interface Props {
    variant?: BadgeVariant;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'default',
    class: className = '',
    children
  }: Props = $props();

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-zinc-800 text-zinc-200 border-zinc-700/60',
    secondary: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    outline: 'border-zinc-700 text-zinc-300',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    blue: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  };
</script>

<span
  class={cn(
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors',
    variantClasses[variant],
    className
  )}
>
  {@render children?.()}
</span>
