import { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * Rendered when React Router cannot match the current URL to any defined route.
 * Immediately redirects to the dashboard ("/") so users never see a raw 404.
 */
export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}
