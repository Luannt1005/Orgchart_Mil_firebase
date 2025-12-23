import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbyhiTwcOfP6G2Ys2xzFp7Wx7DCTRFfOgFAWvW-Rz9LgqdAUPhSbupQUcyAVm0-tF5cb/exec",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}
