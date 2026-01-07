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
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import { getCachedData, invalidateCachePrefix, getPaginatedCacheKey } from "@/lib/cache";

// Cache TTL: 5 minutes for employee list
const EMPLOYEES_CACHE_TTL = 5 * 60 * 1000;
const PAGINATED_CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "0");

    console.log("GET /api/sheet - id:", id, "page:", page, "limit:", limit);

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

    // ======= PAGINATED & FILTERED FETCH =======
    if (page > 0 && limit > 0) {
      try {
        // First, get or create the cached full dataset (this happens once every 5 minutes)
        const fullDataset = await getCachedData(
          'employees_all_for_pagination',
          async () => {
            console.log(`📡 [Cache MISS] Fetching all employees for pagination...`);
            const employeesRef = collection(db, "employees");
            const allSnapshot = await getDocs(query(employeesRef));

            const employees = allSnapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            }));

            // Extract headers from first employee
            const headers = employees.length > 0
              ? Object.keys(employees[0])
              : [];

            console.log(`✅ Cached ${employees.length} employees for pagination`);
            return { employees, headers, total: employees.length };
          },
          PAGINATED_CACHE_TTL
        );

        // --- Server-Side Filtering Logic ---
        let filteredData = fullDataset.employees;

        // Extract filtering params (everything except known pagination/system params)
        const excludedParams = ['page', 'limit', 'id', 'preventCache'];
        const filters: { [key: string]: string } = {};

        searchParams.forEach((value, key) => {
          if (!excludedParams.includes(key) && value.trim() !== '') {
            filters[key] = value.toLowerCase();
          }
        });

        // Apply filters if any exist
        if (Object.keys(filters).length > 0) {
          filteredData = filteredData.filter((emp: any) => {
            return Object.entries(filters).every(([key, filterValue]) => {
              // Handle "denormalized" keys if necessary, or assume exact match from client
              const empValue = String(emp[key] || '').toLowerCase();
              return empValue.includes(filterValue);
            });
          });
        }

        // Calculate pagination from FILTERED data
        const total = filteredData.length;
        const totalPages = Math.ceil(total / limit);
        const startIdx = (page - 1) * limit;
        const endIdx = startIdx + limit;
        const paginatedData = filteredData.slice(startIdx, endIdx);

        console.log(`📄 Page ${page}: serving ${paginatedData.length} records (${startIdx}-${endIdx} of ${total}) | Filters: ${JSON.stringify(filters)}`);

        const response = NextResponse.json({
          success: true,
          headers: fullDataset.headers,
          data: paginatedData,
          page,
          limit,
          total,
          totalPages
        });

        // Dynamic cache control based on whether we are filtering
        const hasFilters = Object.keys(filters).length > 0;
        response.headers.set(
          "Cache-Control",
          hasFilters
            ? "no-store" // Don't cache deeply filtered search results to avoid exploding cache
            : "public, s-maxage=60, stale-while-revalidate=120"
        );

        return response;
      } catch (paginationError) {
        console.error("Pagination error, falling back to full fetch:", paginationError);
        // Fall through to full data fetch below
      }
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