// src/app/api/xrd/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req: NextRequest) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const authHeader = req.headers.get("Authorization"); // Pobierz nagłówek Authorization z żądania

  const response = await fetch(`${backendUrl}/api/xrd/analyze`, {
    method: "POST",
    headers: authHeader ? { Authorization: authHeader } : {}, // Przekaż nagłówek, jeśli istnieje
    body: formData,
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to analyze file" }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}