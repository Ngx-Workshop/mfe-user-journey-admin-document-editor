/** Fit public panel content within its viewport or assigned workspace. */
export function observePanelBody(
  host: HTMLElement,
  body: HTMLElement,
  setHeight: (height: number | null) => void,
  mode: 'viewport' | 'container' = 'viewport',
): () => void {
  const viewport = host.ownerDocument.defaultView!;
  const panel = body.closest('ngx-panel')!;
  let frame = 0;
  const measure = () => {
    if (mode === 'viewport' && viewport.innerWidth <= 900) {
      setHeight(null);
      return;
    }
    const bounds = host.getBoundingClientRect();
    const chrome = panel.getBoundingClientRect().height - body.getBoundingClientRect().height;
    const available = mode === 'container' ? bounds.height : viewport.innerHeight - bounds.top - 16;
    setHeight(Math.max(0, Math.floor(available - chrome)));
  };
  const schedule = () => {
    viewport.cancelAnimationFrame(frame);
    frame = viewport.requestAnimationFrame(measure);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(host);
  observer.observe(panel);
  observer.observe(body);
  viewport.addEventListener('resize', schedule);
  viewport.addEventListener('scroll', schedule, { capture: true, passive: true });
  measure();
  return () => {
    observer.disconnect();
    viewport.cancelAnimationFrame(frame);
    viewport.removeEventListener('resize', schedule);
    viewport.removeEventListener('scroll', schedule, true);
  };
}

/** Reserve only the visible space below the toolbar; lists scroll inside it. */
export function observeWorkspaceHeight(host: HTMLElement, setHeight: (height: number) => void): () => void {
  const viewport = host.ownerDocument.defaultView!;
  let frame = 0;
  const measure = () => setHeight(Math.max(0, Math.floor(viewport.innerHeight - host.getBoundingClientRect().top - 16)));
  const schedule = () => {
    viewport.cancelAnimationFrame(frame);
    frame = viewport.requestAnimationFrame(measure);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(host);
  observer.observe(host.parentElement!);
  // Toolbar height can change without changing the workspace's own width.
  const toolbar = host.closest('main')?.parentElement?.querySelector('ngx-action-bar');
  if (toolbar) observer.observe(toolbar);
  viewport.addEventListener('resize', schedule);
  measure();
  return () => {
    observer.disconnect();
    viewport.cancelAnimationFrame(frame);
    viewport.removeEventListener('resize', schedule);
  };
}
