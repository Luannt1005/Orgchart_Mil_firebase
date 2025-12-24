import { NextResponse } from "next/server";
import axios from "axios";
import { NEXT_PUBLIC_GAS_REMOVE_NODE_URL } from "@/constant/api";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    // Validate required field
    if (!id) {
      console.warn("Missing required field in Remove-Node: id");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: id is required",
        },
        { status: 400 }
      );
    }

    // Get GAS URL from environment
    const gasUrl = NEXT_PUBLIC_GAS_REMOVE_NODE_URL;
    if (!gasUrl) {
      console.error("GAS_REMOVE_NODE_URL is not configured");
      throw new Error("Remove-Node GAS URL is not configured");
    }

    console.log("Removing node via GAS:", { id });

    // Send to Google Apps Script
    const response = await axios.post(gasUrl, { id }, {
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = response.data || {};

    console.log("Remove-Node response:", result);

    return NextResponse.json(
      {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/Remove-Node failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to remove node";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}