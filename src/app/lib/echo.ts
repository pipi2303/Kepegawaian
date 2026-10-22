import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY || 'hcms-key',
  wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
  wsPort: parseInt(import.meta.env.VITE_PUSHER_PORT || '6001'),
  wssPort: parseInt(import.meta.env.VITE_PUSHER_PORT || '6001'),
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  authEndpoint: '/broadcasting/auth',
  auth: {
    headers: {
      // ponytail: reads XSRF-TOKEN cookie; upgrade to Authorization header if switching to token auth
      'X-XSRF-TOKEN': (() => {
        const token = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '';
        return decodeURIComponent(token);
      })(),
    },
  },
});

export default echo;
