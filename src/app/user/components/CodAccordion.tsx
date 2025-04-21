"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import type { CodCifData } from "./CodPollingResults";

// Deklaracja typu dla GLViewer
interface GLViewer {
  addSphere: (spec: { center: { x: number; y: number; z: number }; radius: number; color: string }) => void;
  addCylinder: (spec: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; radius: number; color: string }) => void;
  addLabel: (text: string, options: { position: { x: number; y: number; z: number }; fontColor: string; fontSize: number }) => void;
  zoomTo: () => void;
  render: () => void;
  clear: () => void;
  setBackgroundColor: (color: string) => void;
  setView: (view: number[]) => void;
  WIDTH: number;
  HEIGHT: number;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}

// Rozszerzenie typu window o $3Dmol
declare global {
  interface Window {
    $3Dmol: {
      createViewer: (
        element: HTMLElement | string,
        config?: { backgroundColor: string; glOptions?: { antialias: boolean } }
      ) => GLViewer;
    };
  }
}

const CodAccordion = ({
  data,
  expanded,
  onToggle,
}: {
  data: CodCifData;
  expanded: string | null;
  onToggle: (id: string) => void;
}) => {
  const { translations } = useTranslations();
  const [is3DmolLoaded, setIs3DmolLoaded] = useState(false);
  const [webGLError, setWebGLError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Mapowanie kolorów i promieni atomów (zgodnie z CPK i promieniami van der Waalsa)
  const atomStyles: { [key: string]: { color: string; radius: number } } = {
    H: { color: "white", radius: 1.2 }, // Wodór
    C: { color: "gray", radius: 1.7 },  // Węgiel
    N: { color: "blue", radius: 1.55 }, // Azot
    O: { color: "red", radius: 1.52 },  // Tlen
    S: { color: "yellow", radius: 1.8 }, // Siarka
    P: { color: "orange", radius: 1.8 }, // Fosfor
    default: { color: "pink", radius: 1.5 }, // Domyślne dla nieznanych atomów
  };

  // Dynamiczne ładowanie 3Dmol.js
  useEffect(() => {
    if (typeof window === "undefined") return;

    const load3Dmol = async () => {
      if ((window as any).$3Dmol) {
        console.log("3Dmol.js już załadowany.");
        setIs3DmolLoaded(true);
        return;
      }

      try {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/3dmol@2.1.0/build/3Dmol-min.js";
        script.async = true;
        script.onload = () => {
          console.log("3Dmol.js załadowany pomyślnie.");
          setIs3DmolLoaded(true);
        };
        script.onerror = () => {
          console.error("Błąd podczas ładowania 3Dmol.js.");
          setIs3DmolLoaded(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error("Błąd podczas ładowania 3Dmol.js:", err);
        setIs3DmolLoaded(false);
      }
    };

    load3Dmol();
  }, []);

  // Sprawdzenie wsparcia WebGL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setWebGLError(
        translations?.["webgl_not_supported"] ||
          "Twoja przeglądarka nie obsługuje WebGL, co jest wymagane do wyświetlenia modelu 3D."
      );
    }
  }, [translations]);

  // Inicjalizacja widoku 3Dmol.js
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      expanded !== data.codId ||
      !data.atoms ||
      !is3DmolLoaded ||
      !viewerRef.current
    ) {
      return;
    }

    const $3Dmol = (window as any).$3Dmol;
    if (!$3Dmol) {
      console.error("3Dmol.js nie jest załadowany mimo prób ładowania.");
      setViewerError(
        translations?.["3dmol_load_failed"] || "Nie udało się załadować 3Dmol.js."
      );
      return;
    }

    const container = viewerRef.current;
    if (!container) {
      console.error("Kontener nie istnieje w DOM-ie.");
      setViewerError(
        translations?.["container_not_found"] ||
          "Nie znaleziono kontenera do wyświetlenia modelu 3D."
      );
      return;
    }

    // Sprawdzenie wymiarów kontenera
    const containerRect = container.getBoundingClientRect();
    console.log("Wymiary kontenera:", containerRect);
    if (containerRect.width === 0 || containerRect.height === 0) {
      console.error("Kontener ma zerowe wymiary, 3Dmol.js może nie działać.");
      setViewerError(
        translations?.["container_invisible"] ||
          "Kontener nie jest widoczny (zerowe wymiary)."
      );
      return;
    }

    console.log("Inicjalizacja widoku dla COD ID:", data.codId);

    let viewer: GLViewer | null = null;
    const initViewer = setTimeout(() => {
      try {
        viewer = $3Dmol.createViewer(container, {
          backgroundColor: "black", // Czarne tło jak w JSMol
          glOptions: { antialias: true },
        });
      } catch (err) {
        console.error("Błąd podczas tworzenia widoku 3Dmol.js:", err);
        setViewerError(
          translations?.["viewer_init_failed"] ||
            "Nie udało się zainicjalizować widoku 3D."
        );
        return;
      }

      console.log("Zwrócony obiekt viewer:", viewer);
      if (!viewer || typeof viewer.addSphere !== "function" || typeof viewer.addCylinder !== "function") {
        console.error(
          "[3Dmol.js] createViewer zwrócił niepoprawny obiekt:",
          viewer
        );
        setViewerError(
          translations?.["viewer_invalid"] ||
            "Zwrócony obiekt widoku jest nieprawidłowy."
        );
        return;
      }

      // Ręczne ustawienie wymiarów w viewer
      viewer.setWidth(containerRect.width);
      viewer.setHeight(containerRect.height);
      console.log("Wymiary viewer po ustawieniu:", {
        WIDTH: viewer.WIDTH,
        HEIGHT: viewer.HEIGHT,
      });

      // Przetwarzanie atomów
      const atoms = data.atoms ?? [];
      console.log("Przetwarzane atomy:", atoms);

      // Lista atomów z ich pozycjami (do późniejszego obliczania wiązań)
      const atomPositions: { x: number; y: number; z: number; element: string; radius: number }[] = [];

      // Skalowanie współrzędnych
      const scaleFactor = 5.0; // Zmniejszamy skalę, aby sprawdzić, czy to pomaga
      for (const atom of atoms) {
        const x = parseFloat(atom.x) * scaleFactor;
        const y = parseFloat(atom.y) * scaleFactor;
        const z = parseFloat(atom.z) * scaleFactor;
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
          console.error("Nieprawidłowe współrzędne atomu:", atom);
          continue;
        }

        console.log(`Dodawanie atomu ${atom.element} na pozycji: x=${x}, y=${y}, z=${z}`);

        const style = atomStyles[atom.element] || atomStyles.default;
        viewer.addSphere({
          center: { x, y, z },
          radius: style.radius * 0.3, // Zmniejszamy promień dla lepszej proporcji
          color: style.color,
        });

        atomPositions.push({ x, y, z, element: atom.element, radius: style.radius });
      }

      // Obliczanie i dodawanie wiązań
      const bondTolerance = 2.0; // Tolerancja dla wiązań
      let bondsAdded = 0;
      for (let i = 0; i < atomPositions.length; i++) {
        for (let j = i + 1; j < atomPositions.length; j++) {
          const atom1 = atomPositions[i];
          const atom2 = atomPositions[j];

          // Obliczanie odległości między atomami
          const dx = atom1.x - atom2.x;
          const dy = atom1.y - atom2.y;
          const dz = atom1.z - atom2.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Maksymalna odległość wiązania = suma promieni + tolerancja
          const maxBondDistance = (atom1.radius + atom2.radius) * bondTolerance;

          console.log(`Odległość między atomami ${i} (${atom1.element}) i ${j} (${atom2.element}): ${distance}, maxBondDistance: ${maxBondDistance}`);

          if (distance < maxBondDistance && distance > 0) {
            viewer.addCylinder({
              start: { x: atom1.x, y: atom1.y, z: atom1.z },
              end: { x: atom2.x, y: atom2.y, z: atom2.z },
              radius: 0.3, // Grubość wiązania
              color: "green",
            });
            bondsAdded++;
          }
        }
      }
      console.log(`Dodano ${bondsAdded} wiązań.`);

      // Dodanie osi krystalograficznych
      const axisLength = 20;
      viewer.addCylinder({ start: { x: 0, y: 0, z: 0 }, end: { x: axisLength, y: 0, z: 0 }, radius: 0.1, color: "red" }); // Oś a
      viewer.addCylinder({ start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: axisLength, z: 0 }, radius: 0.1, color: "green" }); // Oś b
      viewer.addCylinder({ start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: axisLength }, radius: 0.1, color: "blue" }); // Oś c

      // Dodanie etykiet do osi
      viewer.addLabel("a", { position: { x: axisLength + 2, y: 0, z: 0 }, fontColor: "red", fontSize: 12 });
      viewer.addLabel("b", { position: { x: 0, y: axisLength + 2, z: 0 }, fontColor: "green", fontSize: 12 });
      viewer.addLabel("c", { position: { x: 0, y: 0, z: axisLength + 2 }, fontColor: "blue", fontSize: 12 });

      // Ustawienie widoku kamery
      viewer.zoomTo();
      console.log("Po zoomTo, renderowanie sceny...");
      viewer.render();
    }, 500);

    // Cleanup
    return () => {
      clearTimeout(initViewer);
      if (viewer) {
        viewer.clear();
      }
    };
  }, [expanded, data, is3DmolLoaded, translations]);

  return (
    <div key={data.codId} className="border rounded overflow-hidden">
      <button
        onClick={() => onToggle(data.codId)}
        className="w-full text-left px-4 py-2 bg-gray-100 font-semibold"
      >
        COD ID: {data.codId} {data.name ? `– ${data.name}` : " – ?"}
      </button>

      {expanded === data.codId && (
        <div className="grid grid-cols-2 gap-4 p-4 text-sm bg-white">
          <div>
            <strong>{translations?.["cod_polling_formula"] || "Wzór"}:</strong>{" "}
            {data.formula}
          </div>
          <div>
            <strong>
              {translations?.["cod_polling_space_group"] ||
                "Grupa przestrzenna"}
              :
            </strong>{" "}
            {data.spaceGroup}
          </div>
          <div>
            <strong>{translations?.["cod_polling_author"] || "Autor"}:</strong>{" "}
            {data.author}
          </div>
          <div>
            <strong>{translations?.["cod_polling_year"] || "Rok"}:</strong>{" "}
            {data.year}
          </div>
          <div>
            <strong>a:</strong> {data.a}
          </div>
          <div>
            <strong>b:</strong> {data.b}
          </div>
          <div>
            <strong>c:</strong> {data.c}
          </div>
          <div>
            <strong>
              {translations?.["cod_polling_volume"] || "Objętość"}:
            </strong>{" "}
            {data.volume}
          </div>
          <div className="col-span-2">
            {webGLError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                ❗ {webGLError}
              </div>
            ) : viewerError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                ❗ {viewerError}
              </div>
            ) : !is3DmolLoaded ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-yellow-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                {translations?.["loading_3dmol"] || "Ładowanie 3Dmol.js..."}
              </div>
            ) : (
              <div
                ref={viewerRef}
                id={`molviewer-${data.codId}`}
                className="w-full h-64 border mt-4"
                style={{ position: "relative" }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodAccordion;