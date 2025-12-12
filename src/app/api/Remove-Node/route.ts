import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Replace with your Google Apps Script Web App URL
    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbx7hj4pWsjxLcbDkV3KOVsYicil6Z_Pg2DUj_jyvZLSZFRHk37gizyi0AQveV9l1s6xiQ/exec";

    const response = await axios.post(googleScriptUrl, { id });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error in Remove-Node API:", error);
    return NextResponse.json({ error: "Failed to remove node" }, { status: 500 });
  }
}