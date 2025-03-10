import "../styles/globals.css"; // Import Tailwind CSS

import LanguageSwitcher from "@/components/LanguageSwitcher";
import Navbar from "@/components/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
