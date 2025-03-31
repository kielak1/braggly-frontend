
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';

export function getCookie(name: String) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

export function getServerCookie(cookies: RequestCookies, name: string): string | undefined {
  const cookie = cookies.get(name);
  return cookie?.value;
}
