import { useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';

/**
 * Returns the current projectId if present in the URL (e.g. /projects/:id/*).
 * Falls back to `localStorage.currentProjectId` which is persisted whenever a project page is visited.
 * Keeps localStorage in sync when the URL contains a project id.
 */
export function useCurrentProjectId(): string | undefined {
  const location = useLocation();

  // Extract id from pathname: /projects/:id/...
  const projectIdInPath = useMemo(() => {
    const match = location.pathname.match(/\/projects\/(\w+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  // Persist into localStorage when found in path
  useEffect(() => {
    if (projectIdInPath) {
      localStorage.setItem('currentProjectId', projectIdInPath);
    }
  }, [projectIdInPath]);

  // Retrieve from storage if not in path
  const storedId = projectIdInPath || localStorage.getItem('currentProjectId') || undefined;

  return storedId ?? undefined;
} 