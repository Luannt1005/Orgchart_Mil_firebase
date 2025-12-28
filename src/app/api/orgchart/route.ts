import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept");

    const orgchartRef = collection(db, "Orgchart_data");
    const snapshot = await getDocs(query(orgchartRef));

    // Chuẩn hóa thành mảng
    let data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })).filter((n: any) => typeof n.dept === "string" && n.dept.trim() !== "");

    // Nếu có dept, chỉ trả về các node thuộc dept đó
    if (dept && dept !== "all") {
      data = data.filter((n: any) => n.dept === dept);
    }

    // Trả về response chuẩn
    const response = NextResponse.json(
      {
        data,
        success: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    return response;
  } catch (err: any) {
    console.error("Error loading orgchart:", err);
    return NextResponse.json(
      {
        data: [],
        success: false,
        error: err.message || "Failed to load data",
      },
      { status: 500 }
    );
  }
}
