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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log("GET /api/sheet - id:", id);

    // Nếu có ID cụ thể, lấy 1 employee
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

    // Lấy tất cả employees
    const employeesRef = collection(db, "employees");
    const q = query(employeesRef);
    const querySnapshot = await getDocs(q);

    const employees: any[] = [];
    const headersSet = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      employees.push(data);

      // Collect all headers
      Object.keys(data).forEach((key) => headersSet.add(key));
    });

    const headers = Array.from(headersSet);

    console.log("Found employees:", employees.length);

    return NextResponse.json({
      success: true,
      total: employees.length,
      headers: headers,
      data: employees
    });
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