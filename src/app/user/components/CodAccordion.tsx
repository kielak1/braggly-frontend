"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import type { CodCifData } from "./CodPollingResults";

interface GLViewer {
  addSphere: (spec: {
    center: { x: number; y: number; z: number };
    radius: number;
    color: string;
  }) => void;
  addCylinder: (spec: {
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
    radius: number;
    color: string;
  }) => void;
  addLabel: (
    text: string,
    options: {
      position: { x: number; y: number; z: number };
      fontColor: string;
      fontSize: number;
    }
  ) => void;
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

  const atomStyles: { [key: string]: { color: string; radius: number } } = {
    H: { color: "white", radius: 1.2 },
    C: { color: "gray", radius: 1.7 },
    N: { color: "blue", radius: 1.55 },
    O: { color: "red", radius: 1.52 },
    S: { color: "yellow", radius: 1.8 },
    P: { color: "orange", radius: 1.8 },
    default: { color: "pink", radius: 1.5 },
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const load3Dmol = async () => {
      if ((window as any).$3Dmol) {
        setIs3DmolLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/3dmol@2.1.0/build/3Dmol-min.js";
      script.async = true;
      script.onload = () => setIs3DmolLoaded(true);
      script.onerror = () => setIs3DmolLoaded(false);
      document.head.appendChild(script);
    };

    load3Dmol();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setWebGLError(
        translations?.["webgl_not_supported"] ||
          "WebGL is not supported by your browser."
      );
    }
  }, [translations]);

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
      setViewerError(
        translations?.["3dmol_load_failed"] || "Failed to load 3Dmol.js."
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
    if (containerRect.width === 0 || containerRect.height === 0) {
      setViewerError(
        translations?.["container_invisible"] ||
          "Viewer container is not visible."
      );
      return;
    }

    let viewer: GLViewer | null = null;
    const initViewer = setTimeout(() => {
      try {
        viewer = $3Dmol.createViewer(container, {
          backgroundColor: "black",
          glOptions: { antialias: true },
        });
      } catch (err) {
        setViewerError(
          translations?.["viewer_init_failed"] || "Failed to initialize viewer."
        );
        return;
      }

      if (!viewer || typeof viewer.addSphere !== "function") {
        setViewerError(
          translations?.["viewer_invalid"] || "Invalid viewer object."
        );
        return;
      }

      viewer.setWidth(containerRect.width);
      viewer.setHeight(containerRect.height);

      const atoms = data.atoms ?? [];
      const atomPositions: {
        x: number;
        y: number;
        z: number;
        element: string;
        radius: number;
      }[] = [];
      const scaleFactor = 5.0;
      for (const atom of atoms) {
        const x = parseFloat(atom.x) * scaleFactor;
        const y = parseFloat(atom.y) * scaleFactor;
        const z = parseFloat(atom.z) * scaleFactor;
        if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

        const style = atomStyles[atom.element] || atomStyles.default;
        viewer.addSphere({
          center: { x, y, z },
          radius: style.radius * 0.3,
          color: style.color,
        });
        atomPositions.push({
          x,
          y,
          z,
          element: atom.element,
          radius: style.radius,
        });
      }

      // const bondMargin = 0.4;
      // const minBondLength = 0.4 * scaleFactor; // np. 0.4 Å

      // let bondsAdded = 0;

      // for (let i = 0; i < atomPositions.length; i++) {
      //   for (let j = i + 1; j < atomPositions.length; j++) {
      //     const atom1 = atomPositions[i];
      //     const atom2 = atomPositions[j];

      //     const dx = atom1.x - atom2.x;
      //     const dy = atom1.y - atom2.y;
      //     const dz = atom1.z - atom2.z;
      //     const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      //     const maxLength =
      //       (atom1.radius + atom2.radius + bondMargin) * scaleFactor;

      //     if (distance > minBondLength && distance < maxLength) {
      //       viewer.addCylinder({
      //         start: { x: atom1.x, y: atom1.y, z: atom1.z },
      //         end: { x: atom2.x, y: atom2.y, z: atom2.z },
      //         radius: 0.03,
      //         color: "green",
      //       });
      //       bondsAdded++;
      //     }
      //   }
      // }
      // console.log(`Dodano ${bondsAdded} wiązań.`);

      const axisLength = 20;
      viewer.addCylinder({
        start: { x: 0, y: 0, z: 0 },
        end: { x: axisLength, y: 0, z: 0 },
        radius: 0.1,
        color: "red",
      });
      viewer.addCylinder({
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: axisLength, z: 0 },
        radius: 0.1,
        color: "green",
      });
      viewer.addCylinder({
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: axisLength },
        radius: 0.1,
        color: "blue",
      });
      viewer.addLabel("a", {
        position: { x: axisLength + 2, y: 0, z: 0 },
        fontColor: "red",
        fontSize: 12,
      });
      viewer.addLabel("b", {
        position: { x: 0, y: axisLength + 2, z: 0 },
        fontColor: "green",
        fontSize: 12,
      });
      viewer.addLabel("c", {
        position: { x: 0, y: 0, z: axisLength + 2 },
        fontColor: "blue",
        fontSize: 12,
      });

      viewer.zoomTo();
      viewer.render();
    }, 500);

    return () => {
      clearTimeout(initViewer);
      if (viewer) viewer.clear();
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
                className="w-full h-[32rem] border mt-4"
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
