import "../styles/globals.css"; // Import Tailwind CSS

import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageSwitcher />
        {children}
      </body>
    </html>
  );
}
