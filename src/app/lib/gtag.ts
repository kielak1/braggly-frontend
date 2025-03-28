// lib/gtag.ts
declare global {
    interface Window {
      gtag: (...args: any[]) => void;
    }
  }
  

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_ID, {
      page_path: url,
    });
  }
};
