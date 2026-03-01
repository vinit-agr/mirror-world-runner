import { useState, useEffect } from 'react';

export type Route = '' | 'model-test' | 'open-world' | 'mirror-world-runner' | 'runner-world';

function parseHash(): Route {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const valid: Route[] = ['model-test', 'open-world', 'mirror-world-runner', 'runner-world'];
  return valid.includes(hash as Route) ? (hash as Route) : '';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(route: Route) {
  window.location.hash = route ? `#/${route}` : '#/';
}
