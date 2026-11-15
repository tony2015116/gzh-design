export function isLocalOssDevelopment(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_APP_MODE === 'oss' && ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
}
