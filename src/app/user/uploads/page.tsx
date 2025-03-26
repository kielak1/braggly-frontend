// src/app/user/uploads/page.tsx
"use client";

import { useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import "@/styles/globals.css";


const UploadUXD = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);

  useFetchTranslations(setTranslations, getCookie);
  if (!translations) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-700">
          Ładowanie..
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.upload_uxd_files || "Upload XRD Files"}
      </h1>
      <div className="flex items-center space-x-4 mb-4"></div>{" "}
    </div>
  );
};

export default UploadUXD;
