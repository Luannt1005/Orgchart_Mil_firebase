import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { getCachedData } from "@/lib/cache";

// Cache TTL: 5 minutes for orgchart data
const ORGCHART_CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept");

    // Use cached data for orgchart collection - reduces Firebase reads significantly
    let data = await getCachedData(
      'orgchart_all',
      async () => {
        console.log("📡 [Cache MISS] Fetching Orgchart_data from Firebase...");
        const orgchartRef = collection(db, "Orgchart_data");
        const snapshot = await getDocs(query(orgchartRef));

        const nodes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })).filter((n: any) => typeof n.dept === "string" && n.dept.trim() !== "");

        console.log(`✅ Loaded ${nodes.length} nodes from Orgchart_data`);
        return nodes;
      },
      ORGCHART_CACHE_TTL
    );

    // Filter by department if requested (client-side filter on cached data)
    if (dept && dept !== "all") {
      data = data.filter((n: any) => n.dept === dept);
    }

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
