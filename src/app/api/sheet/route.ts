import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { getCachedData, invalidateCachePrefix } from "@/lib/cache";

// Cache TTL: 5 minutes for employee list
const EMPLOYEES_CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log("GET /api/sheet - id:", id);

    // If specific ID requested, fetch single doc (no cache for single docs)
    if (id) {
      const docRef = doc(db, "employees", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      });
    }

    // Use cached data for full employee list - reduces Firebase reads significantly
    const cachedResult = await getCachedData(
      'employees_all',
      async () => {
        console.log("📡 [Cache MISS] Fetching employees from Firebase...");
        const employeesRef = collection(db, "employees");
        const q = query(employeesRef);
        const querySnapshot = await getDocs(q);

        const employees: any[] = [];
        const headersSet = new Set<string>();

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          employees.push(data);
          Object.keys(data).forEach((key) => headersSet.add(key));
        });

        console.log(`✅ Loaded ${employees.length} employees from Firebase`);
        return { employees, headers: Array.from(headersSet) };
      },
      EMPLOYEES_CACHE_TTL
    );

    const response = NextResponse.json({
      success: true,
      total: cachedResult.employees.length,
      headers: cachedResult.headers,
      data: cachedResult.employees
    });

    // Add cache control headers for browser caching
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    return response;
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
    const { action, data } = body;

    console.log("POST /api/sheet - action:", action);

    if (!action || !data) {
      return NextResponse.json(
        { success: false, error: "Missing action or data" },
        { status: 400 }
      );
    }

    if (action === "add") {
      const employeesRef = collection(db, "employees");
      const newDoc = await addDoc(employeesRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Invalidate cache after adding new employee
      invalidateCachePrefix('employees');

      return NextResponse.json({
        success: true,
        id: newDoc.id,
        message: "Employee added successfully"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
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
    const body = await req.json();
    const { id, data } = body;

    console.log("PUT /api/sheet - id:", id);

    if (!id || !data) {
      return NextResponse.json(
        { success: false, error: "Missing id or data" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "employees", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });

    // Invalidate cache after updating employee
    invalidateCachePrefix('employees');

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log("DELETE /api/sheet - id:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "employees", id);
    await deleteDoc(docRef);

    // Invalidate cache after deleting employee
    invalidateCachePrefix('employees');

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}