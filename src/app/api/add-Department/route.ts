import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.pid) {
      console.warn("Missing required fields in add-Department:", {
        name: !!body.name,
        pid: !!body.pid,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name and pid are required",
        },
        { status: 400 }
      );
    }

    console.log("Adding department to Firebase: ", {
      name: body.name,
      pid: body.pid,
    });

    // Create department object
    const departmentData = {
      id: body.id || `dept:${body.name}:${body.pid}`,
      pid: body.pid,
      stpid: null,
      name: body.name,
      title: "Department",
      image: null,
      tags: JSON.stringify(["group"]),
      orig_pid: body.pid,
      dept: body.name,
      BU: null,
      type: "group",
      location: null,
      description: body.description || `Department under manager ${body.pid}`,
      createdAt: new Date(),
    };

    // Save to Firestore
    const orgchartRef = collection(db, "Orgchart_data");
    const docRef = doc(orgchartRef, departmentData.id);

    const batch = writeBatch(db);
    batch.set(docRef, departmentData);
    await batch.commit();

    console.log("Department added successfully:", departmentData.id);

    return NextResponse.json(
      {
        success: true,
        data: departmentData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/add-Department failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to add department";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
