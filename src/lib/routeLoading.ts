const ROUTE_LOADING_SUPPRESSION_TTL_MS = 1500;

let suppressedRoute:
  | {
      key: string;
      expiresAt: number;
    }
  | undefined;

export const normalizeRouteKey = (url: string) => {
  try {
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const parsedUrl = new URL(url, origin);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    let pathname = parsedUrl.pathname || '/';

    if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
      pathname = pathname.slice(basePath.length) || '/';
    }

    pathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    return `${pathname}${parsedUrl.search}`;
  } catch {
    const [pathnameWithSlash, search = ''] = url.split('?');
    const pathname = (pathnameWithSlash || '/').replace(/#.*$/, '');
    const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    return search ? `${normalizedPathname}?${search.split('#')[0]}` : normalizedPathname;
  }
};

export const suppressNextRouteLoading = (url: string) => {
  suppressedRoute = {
    key: normalizeRouteKey(url),
    expiresAt: Date.now() + ROUTE_LOADING_SUPPRESSION_TTL_MS,
  };
};

export const takeRouteLoadingSuppression = (url: string) => {
  if (!suppressedRoute) return false;

  if (Date.now() > suppressedRoute.expiresAt) {
    suppressedRoute = undefined;
    return false;
  }

  if (suppressedRoute.key !== normalizeRouteKey(url)) {
    suppressedRoute = undefined;
    return false;
  }

  suppressedRoute = undefined;
  return true;
};
