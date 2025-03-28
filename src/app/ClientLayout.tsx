"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as gtag from "@/lib/gtag";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (gtag.GA_ID) {
      gtag.pageview(pathname);
    }
  }, [pathname]);

  return (
    <SessionProvider>
      <Navbar />
      {children}
    </SessionProvider>
  );
}
