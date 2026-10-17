<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '../../../lib/utils';

  type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'emerald' | 'amber' | 'destructive';
  type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

  interface Props extends HTMLButtonAttributes {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  const variantClasses: Record<ButtonVariant, string> = {
    default: 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm font-medium',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60 shadow-sm',
    outline: 'bg-transparent text-zinc-300 border border-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-700',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
    emerald: 'bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-[0.98]',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 active:scale-[0.98]',
    destructive: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
  };

  const sizeClasses: Record<ButtonSize, string> = {
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 rounded-lg px-3 text-xs',
    lg: 'h-11 rounded-xl px-6 text-base font-semibold',
    icon: 'h-9 w-9 p-0'
  };
</script>

<button
  class={cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
  {...restProps}
>
  {@render children?.()}
</button>
