import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': '何宗翰 — Full-Stack Developer & Journal',
  '/projects': 'Projects — 何宗翰',
  '/blog': 'Journal — 何宗翰',
  '/contact': 'Contact — 何宗翰',
  '/login': 'Log in — 何宗翰',
  '/register': 'Create account — 何宗翰',
  '/admin': 'Admin workspace — 何宗翰'
};

/**
 * Route-level side effects: reset the scroll position on navigation and keep the
 * browser tab title in sync with the current page. Blog detail pages refine the
 * title themselves once the post has loaded.
 */
export default function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    if (PAGE_TITLES[pathname]) {
      document.title = PAGE_TITLES[pathname];
      return;
    }
    document.title = /^\/blog\/[^/]+$/.test(pathname)
      ? 'Journal entry — 何宗翰'
      : 'Page not found — 何宗翰';
  }, [pathname]);

  return null;
}
