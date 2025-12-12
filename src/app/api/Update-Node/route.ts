import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // 🔹 Validate cơ bản
    if (!data.id) {
      return NextResponse.json(
        { status: "error", message: "Missing id field" },
        { status: 400 }
      );
    }

    // 🔹 Gọi Google Apps Script WebApp của bạn
    const resp = await fetch(
      "https://script.google.com/macros/s/AKfycbypcbXZrBEehjlpMZuYKTALdKpz3squYGldxo8W9wpcdo2K_GGXX-TLHj-_bmevMjlEWA/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await resp.json();

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.toString() },
      { status: 500 }
    );
  }
}
