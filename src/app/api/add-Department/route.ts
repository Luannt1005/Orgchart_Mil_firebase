import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // gửi sang Google Apps Script
        const res = await fetch(
            "https://script.google.com/macros/s/AKfycbxxNzicVtDDPnLMFY5aoSCQ2ZxXGMC9gLtl18-UKVZkIgfPI2nHH8UfW8ZE8rf_GwmZlQ/exec",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }
        );

        const result = await res.json();

        return NextResponse.json({
            status: "ok",
            gs_response: result,
        });
    } catch (err) {
        return NextResponse.json(
            { status: "error", message: err },
            { status: 500 }
        );
    }
}
