import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: Request) {
  // 🔴 DÒNG NÀY BẮT BUỘC
  const { searchParams } = new URL(req.url);

  const dept = searchParams.get("dept");
  console.log("DEPT =", dept);

  const res = await axios.get(
    "https://script.google.com/macros/s/AKfycbzXlPZTDuLdpfzivyVg-tXXV6bKsavMkb1JbgWIPwGNtyEmxvP-ar00J6l6MIysnjxbPg/exec"
  );

  let data = res.data.data;

  if (dept && dept !== "all") {
    data = data.filter((n: any) => n.dept === dept);
  }

  return NextResponse.json({ data });
}
