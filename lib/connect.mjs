// Node's family auto-selection requests all addresses, even when we have
// already selected one validated IP. Preserve that pin in both callback forms.
export function pinnedLookup(ip) {
  return (_hostname, options, callback) => {
    if (options?.all) callback(null, [{ address:ip.address, family:ip.family }]);
    else callback(null, ip.address, ip.family);
  };
}

// Providers can rotate domains through an HTTP redirect. Follow the same
// Xtream endpoint only when all original login/action parameters survive.
export function isAllowedApiRedirect(source, destination) {
  if (!['http:', 'https:'].includes(destination.protocol) || destination.username || destination.password) return false;
  if (source.protocol === 'https:' && destination.protocol !== 'https:') return false;
  if (source.origin === destination.origin) return true;
  if (source.pathname !== destination.pathname || !/\/player_api\.php$/i.test(source.pathname)) return false;
  if (!source.searchParams.has('username') || !source.searchParams.has('password')) return false;
  return [...new Set(source.searchParams.keys())].every(key =>
    JSON.stringify(source.searchParams.getAll(key)) === JSON.stringify(destination.searchParams.getAll(key)));
}

/** Try all validated IP addresses in order, stopping on policy failures. */
export async function tryAddresses(addresses, open) {
  let lastFailure;
  for (const address of addresses) {
    try { return await open(address); }
    catch (error) {
      lastFailure = error;
      if (error?.publicCode) throw error;
    }
  }
  if (lastFailure) throw lastFailure;
  throw Object.assign(new Error('Nenhum endereço disponível.'), { code:'ENETUNREACH' });
}
