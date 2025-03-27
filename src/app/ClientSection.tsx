"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  translations: Record<string, string>;
};

// Komponent Accordion do rozwijanych sekcji
const Accordion = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left text-lg font-semibold text-white hover:text-yellow-400 transition-colors"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="py-4 text-gray-300">
          {children}
        </div>
      )}
    </div>
  );
};

// Komponent po stronie klienta
export default function ClientSection({ translations }: Props) {
  return (
    <div className="relative bg-black/60 text-white px-6 py-10 max-w-4xl min-w-[900px] mx-auto mt-10 mb-10 rounded-lg backdrop-blur-md">
      <h2 className="text-3xl font-bold mb-6 text-center">
        {translations.legal_info || "Legal Information"}
      </h2>

      {/* Polityka prywatności */}
      <Accordion title={translations.title || "Privacy Policy"}>
        <p>{translations.admin || "The data controller is the owner of the application. Contact details are provided below."}</p>
        <p className="mt-2">{translations.scope || "The application collects and stores only the data necessary for login: username and password (encrypted)."}</p>
        <p className="mt-2">{translations.purpose || "Personal data is used solely to enable the user to log into the application."}</p>
        <p className="mt-2">{translations.legal || "The legal basis for data processing is the legitimate interest of the controller – ensuring functionality and security."}</p>
        <p className="mt-2">{translations.sharing || "Data is not shared with third parties, except as required by law."}</p>
        <p className="mt-2">{translations.rights || "Users have the right to access, correct, delete, and restrict the processing of their data."}</p>
        <p className="mt-2">{translations.security || "Passwords are stored in encrypted form using secure mechanisms."}</p>
        <p className="mt-2">{translations.cookies || "The application does not use tracking mechanisms."}</p>
        <p className="mt-2">{translations.contact || "For data-related matters, contact us at: tadeusz@kielak.com"}</p>
      </Accordion>

      {/* Warunki użytkowania */}
      <Accordion title={translations.terms_title || "Terms of Service"}>
        <p>{translations.general || "By using Braggly, you agree to the following terms and conditions."}</p>
        <p className="mt-2">{translations.storage || "Users are responsible for the content they upload, including ensuring it does not violate any laws or third-party rights."}</p>
        <p className="mt-2">{translations.liability || "Braggly reserves the right to remove any content that violates these terms."}</p>
        <p className="mt-2">{translations.payments || "The application is provided 'as is' without warranties of any kind."}</p>
        <p className="mt-2">{translations.changes || "Braggly is not liable for any damages resulting from the use of the application."}</p>
        <p className="mt-2">{translations.terms_contact || "For any questions, contact us at: tadeusz@kielak.com"}</p>
      </Accordion>
    </div>
  );
}