import "@/styles/globals.css";
import { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import Foot from "@/components/Foot";

export const metadata: Metadata = {
  title: "Braggly App",
  description: "Aplikacja Braggly",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
          <Foot />
        </ClientLayout>
      </body>
    </html>
  );
}
