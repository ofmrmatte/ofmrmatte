import { lazy, Suspense, useEffect, useState } from 'react';
const OfficeExperience = lazy(() => import('./office-3d/OfficeExperience').then(m => ({ default: m.OfficeExperience })));

export default function App() {
  const params = new URLSearchParams(location.search);
  const progress = params.has('progress') ? Number(params.get('progress')) : undefined;
  const background = !params.has('tour');
  const embedded = params.has('embed');
  const [hostPaused, setHostPaused] = useState(false);
  useEffect(() => {
    if (!embedded) return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'office:visibility') return;
      setHostPaused(event.data.paused === true);
    };
    window.addEventListener('message', receive);
    parent.postMessage({ type: 'office:ready' }, location.origin);
    return () => window.removeEventListener('message', receive);
  }, [embedded]);
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#28312d' }} />}>
    {embedded && <style>{'.office-background-credit{display:none}'}</style>}
    <OfficeExperience mode={background ? 'background' : 'experience'} style={background ? { position: 'fixed', inset: 0 } : undefined} paused={params.has('paused') || hostPaused} overlayOpacity={embedded ? 0 : undefined} debugHUD={params.has('debug')} externalScrollProgress={progress !== undefined && Number.isFinite(progress) ? progress : undefined} />
  </Suspense>;
}
