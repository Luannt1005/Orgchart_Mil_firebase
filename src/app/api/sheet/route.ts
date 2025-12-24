import { NextResponse } from "next/server";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzo9izXP8PAiLlg4YTuYwld_PGr4WG-KJMoT12LDLpImLbLGL8V3Nz3nmM_Yr2izp90bA/exec";
const SYNC_URL = "https://script.google.com/macros/s/AKfycbw1cil3hwmJU0BaHRpLr-xzzBSfSaxDh0eMWmVd73KMbeF8CmfMex658sTJZJBHXWKF9w/exec";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "get";

    const response = await fetch(`${GAS_URL}?action=${action}`);
    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rowId, data } = body;

    console.log("POST /api/sheet - action:", action, "rowId:", rowId, "data:", data);

    if (!action || !data) {
      console.error("Missing action or data", { action, data });
      return NextResponse.json(
        { success: false, error: "Missing action or data" },
        { status: 400 }
      );
    }

    // Cách 1: Gửi qua URL parameter + body
    const payload = {
      rowId: rowId,
      data: data,
    };

    console.log("Sending to GAS with URL parameter action=" + action);
    console.log("Payload:", JSON.stringify(payload));

    const response = await fetch(`${GAS_URL}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("GAS response:", responseText);

    let result = {};
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse GAS response:", responseText);
      result = { success: false, error: "Invalid response from GAS" };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    console.log("Calling sync API...");

    const response = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    console.log("Sync API response:", result);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync API error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
