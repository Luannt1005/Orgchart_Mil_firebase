import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbwOGNujKFaHZzPOvC62R1SpDJLDcr24WxQ7F62FhuOEWGl79zJwhwwUZfckSypLzRFM/exec",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
