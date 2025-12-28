import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import {
  collection,
  writeBatch,
  doc,
  getDocs,
  query
} from "firebase/firestore";

async function getExistingEmpIds() {
  const employeesRef = collection(db, "employees");
  const snapshot = await getDocs(query(employeesRef));
  
  const empIds = new Map();
  snapshot.docs.forEach((doc) => {
    const empId = doc.data()["Emp ID"];
    if (empId) {
      empIds.set(empId, doc.ref);
    }
  });
  
  return empIds;
}

async function deleteEmployeesByEmpIds(empIdsToDelete: string[]) {
  const employeesRef = collection(db, "employees");
  const snapshot = await getDocs(query(employeesRef));
  
  const batchSize = 500;
  let deletedCount = 0;
  
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const batch_docs = snapshot.docs.slice(i, i + batchSize);

    batch_docs.forEach((doc) => {
      const empId = doc.data()["Emp ID"];
      if (empIdsToDelete.includes(empId)) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (batch_docs.some(doc => empIdsToDelete.includes(doc.data()["Emp ID"]))) {
      await batch.commit();
    }
  }
  
  return deletedCount;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: "Invalid Excel file" },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    // Lấy danh sách Emp ID hiện có
    const existingEmpIds = await getExistingEmpIds();
    
    // Lấy danh sách Emp ID từ file import
    const newEmpIds = new Set(rows.map((row: any) => row["Emp ID"]).filter(Boolean));
    
    // Tìm Emp ID cần xóa (có trong database nhưng không có trong file mới)
    const empIdsToDelete: string[] = [];
    existingEmpIds.forEach((ref, empId) => {
      if (!newEmpIds.has(empId)) {
        empIdsToDelete.push(empId);
      }
    });

    // Xóa các Emp ID không còn trong file import
    let deletedCount = 0;
    if (empIdsToDelete.length > 0) {
      deletedCount = await deleteEmployeesByEmpIds(empIdsToDelete);
    }

    // Import chỉ các Emp ID mới
    const employeesRef = collection(db, "employees");
    let savedCount = 0;
    let skippedCount = 0;

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = writeBatch(db);
      const batch_rows = rows.slice(i, i + batchSize);

      batch_rows.forEach((row: any) => {
        const empId = row["Emp ID"];
        
        // Nếu Emp ID đã tồn tại, bỏ qua
        if (existingEmpIds.has(empId)) {
          skippedCount++;
          return;
        }

        const docRef = doc(employeesRef);
        batch.set(docRef, {
          ...row,
          importedAt: new Date(),
          batchIndex: Math.floor(i / batchSize)
        });
        savedCount++;
      });

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      saved: savedCount,
      skipped: skippedCount,
      deleted: deletedCount
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to import file" },
      { status: 500 }
    );
  }
}