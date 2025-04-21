"use client";
import Script from "next/script";

const ThreeDmolLoader = () => {
  return (
    <Script
      src="https://3dmol.org/build/3Dmol-min.js"
      strategy="lazyOnload"
      onLoad={() => {
        console.log("[3Dmol.js] załadowano poprawnie!");
        (window as any).$3DmolReady = true;
      }}
      onError={(e) => {
        console.error("[3Dmol.js] błąd ładowania:", e);
      }}
    />
  );
};

export default ThreeDmolLoader;
