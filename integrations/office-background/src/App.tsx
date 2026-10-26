import { lazy, Suspense, useEffect, useState } from 'react';
const OfficeExperience = lazy(() => import('./office-3d/OfficeExperience').then(m => ({ default: m.OfficeExperience })));

export default function App() {
  const params = new URLSearchParams(location.search);
  const progress = params.has('progress') ? Number(params.get('progress')) : undefined;
  const background = !params.has('tour');
  const embedded = params.has('embed');
  const [hostPaused, setHostPaused] = useState(false);
  const [hostProgress, setHostProgress] = useState(0);
  useEffect(() => {
    if (!embedded) return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== parent) return;
      if (event.data?.type === 'office:visibility') setHostPaused(event.data.paused === true);
      if (event.data?.type === 'office:scroll' && typeof event.data.progress === 'number' && Number.isFinite(event.data.progress)) {
        setHostProgress(Math.max(0, Math.min(1, event.data.progress)));
      }
    };
    window.addEventListener('message', receive);
    parent.postMessage({ type: 'office:ready' }, location.origin);
    return () => window.removeEventListener('message', receive);
  }, [embedded]);
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#28312d' }} />}>
    {embedded && <style>{'.office-background-credit{display:none}'}</style>}
    <OfficeExperience mode={background ? 'background' : 'experience'} style={background ? { position: 'fixed', inset: 0 } : undefined} paused={params.has('paused') || hostPaused} overlayOpacity={embedded ? 0 : undefined} debugHUD={params.has('debug')} externalScrollProgress={embedded ? hostProgress : progress !== undefined && Number.isFinite(progress) ? progress : undefined} />
  </Suspense>;
}
