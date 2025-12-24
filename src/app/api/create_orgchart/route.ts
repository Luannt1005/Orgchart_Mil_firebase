import { NextResponse } from "next/server";

const LOAD_URL = "https://script.google.com/macros/s/AKfycbzFljc10QGi4ZrXYyzFrrleppT4PMRmfGqCFRqpt2d8Pv93OLeJpcb8QpB8WuKCtuAS/exec";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, org_id, dept_name, org_data } = body;

    // Validate required fields
    if (!username || !org_id || !org_data) {
      console.warn("Missing required fields in create_orgchart");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: username, org_id, org_data",
        },
        { status: 400 }
      );
    }

    console.log("Creating org chart via GAS:", { 
      username, 
      org_id, 
      dept_name,
      dataLength: org_data?.data?.length || 0 
    });

    // Prepare payload for GAS
    const gasPayload = {
      action: "create",
      username: username,
      org_id: org_id,
      dept_name: dept_name || "",
      org_data: typeof org_data === 'string' ? org_data : JSON.stringify(org_data),
    };

    console.log("Sending to GAS:", { ...gasPayload, org_data: '...' });

    // Send to Google Apps Script using fetch
    const response = await fetch(LOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gasPayload),
    });

    const responseText = await response.text();
    console.log("GAS response status:", response.status);
    console.log("GAS response text:", responseText.substring(0, 200));

    // Try to parse response
    let result = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
        console.log("Parsed JSON result:", result);
      } catch (e) {
        console.warn("Response is not JSON, treating as success");
        // If GAS returns HTML or plain text, still consider it success
        result = { success: true };
      }
    }

    // Always return success - GAS handles the creation in background
    return NextResponse.json(
      {
        success: true,
        org_id: org_id,
        message: "Org chart creation request sent",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/create_orgchart failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to create org chart";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}