import "@/styles/globals.css";
import { Metadata } from "next";
import Script from "next/script";
import ClientLayout from "./ClientLayout";
import Foot from "@/components/Foot";

const isProduction = process.env.NODE_ENV === "production";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "Braggly App",
  description: "Aplikacja Braggly",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {isProduction && GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <ClientLayout>
          {children}
          <Foot />
        </ClientLayout>
      </body>
    </html>
  );
}
