import { writable } from 'svelte/store';

export type Route = {
  path: string;
  params?: Record<string, string>;
  roomHash?: string;
}

function createRouteStore() {
  // Parse initial state from URL
  const initialPath = window.location.pathname === '/' ? '/search' : window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const initialRoute: Route = {
    path: initialPath,
    roomHash: params.get('roomHash') || undefined
  };

  const { subscribe, set: innerSet } = writable<Route>(initialRoute);

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    innerSet({
      path: window.location.pathname,
      roomHash: params.get('roomHash') || undefined
    });
  });

  return {
    subscribe,
    set: (route: Route) => {
      const url = new URL(window.location.origin + route.path);
      if (route.roomHash) {
        url.searchParams.set('roomHash', route.roomHash);
      }
      window.history.pushState({}, '', url.toString());
      innerSet(route);
    }
  };
}

export const currentRoute = createRouteStore();
