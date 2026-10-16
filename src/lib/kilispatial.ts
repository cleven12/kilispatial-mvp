export type RouteId =
  | 'marangu'
  | 'machame'
  | 'lemosho'
  | 'rongai'
  | 'umbwe'
  | 'northern-circuit'
  | 'shira'
  | 'all';

export type KiliCommand =
  | { type: 'selectRoute'; id: RouteId }
  | { type: 'focusDay'; day: number }
  | { type: 'focusPlace'; id: string }
  | { type: 'showRoute' }
  | { type: 'drone'; on: boolean }
  | { type: 'play'; on: boolean }
  | { type: 'scrub'; km: number };

export type KiliEvent =
  | { type: 'ready'; routes: Array<{ id: string; name: string; days: number }> }
  | { type: 'route'; id: RouteId }
  | { type: 'day'; day: number }
  | { type: 'place'; id: string }
  | { type: 'progress'; km: number; elevation: number };

export class KiliSpatialBridge {
  private iframe: HTMLIFrameElement;
  private origin: string;
  private isReady = false;
  private queue: KiliCommand[] = [];

  constructor(iframe: HTMLIFrameElement, origin = 'https://kili.xenohuru.com') {
    this.iframe = iframe;
    this.origin = origin.replace(/\/$/, '');
  }

  public send(cmd: KiliCommand): void {
    if (!this.iframe?.contentWindow) return;

    // Queue commands if the 3D viewer hasn't emitted 'ready' yet,
    // but allow immediate dispatch as fallback in case 'ready' already fired during initial load
    this.iframe.contentWindow.postMessage(
      { source: 'kilispatial', ...cmd },
      this.origin
    );

    if (!this.isReady) {
      this.queue.push(cmd);
    }
  }

  public listen(callback: (event: KiliEvent) => void): () => void {
    const handler = (e: MessageEvent) => {
      if (e.origin !== this.origin || e.data?.source !== 'kilispatial') return;

      const eventData = e.data as KiliEvent;

      if (eventData.type === 'ready') {
        this.isReady = true;
        this.flushQueue();
      }

      callback(eventData);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }

  private flushQueue(): void {
    while (this.queue.length > 0) {
      const cmd = this.queue.shift();
      if (cmd && this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage(
          { source: 'kilispatial', ...cmd },
          this.origin
        );
      }
    }
  }
}
