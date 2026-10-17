<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../lib/utils';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div
  class={cn(
    'rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md text-zinc-100 shadow-xl shadow-black/40',
    className
  )}
>
  {@render children?.()}
</div>
