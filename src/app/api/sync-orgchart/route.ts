import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  query,
  setDoc
} from "firebase/firestore";

const IMAGE_BASE_URL = "https://raw.githubusercontent.com/Luannt1005/test-images/main/"; // Thay đổi URL của bạn

interface Employee {
  id: string;
  [key: string]: any;
}

// Hàm trim leading zeros
const trimLeadingZeros = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = String(value).replace(/^0+/, '') || '0';
  return trimmed === '0' ? null : trimmed;
};

// Hàm tạo hash để so sánh thay đổi
const createHash = (obj: any): string => {
  return JSON.stringify(obj);
};

// Hàm format ngày từ ISO sang DD/MM/YYYY
const formatDate = (value: any): string => {
  if (!value) return "";
  
  try {
    // Xử lý số serial từ Excel
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
      const excelSerial = Number(value);
      if (excelSerial > 0) {
        // Excel epoch: 1/1/1900 = 1
        const date = new Date((excelSerial - 1) * 86400000 + new Date(1900, 0, 1).getTime());
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    
    // Xử lý ISO string
    if (typeof value === 'string' && value.includes('T')) {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Xử lý định dạng DD/MM/YYYY
    if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      return value;
    }
    
    return String(value);
  } catch (e) {
    return String(value);
  }
};

// Hàm kiểm tra nhân viên có trong thời gian thử việc (2 tháng)
const isProbationPeriod = (joiningDateStr: string): boolean => {
  if (!joiningDateStr) return false;
  
  try {
    // Parse DD/MM/YYYY format
    const [day, month, year] = joiningDateStr.split('/').map(Number);
    const joiningDate = new Date(year, month - 1, day);
    const now = new Date();
    
    // Tính số ngày chênh lệch
    const diffTime = now.getTime() - joiningDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // 2 tháng = ~60 ngày
    return diffDays <= 60 && diffDays >= 0;
  } catch (e) {
    return false;
  }
};

async function syncEmployeesToOrgchart() {
  try {
    // Lấy tất cả employees
    const employeesRef = collection(db, "employees");
    const snapshot = await getDocs(query(employeesRef));
    
    const employees: Employee[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Employee));

    if (employees.length === 0) {
      return { success: true, message: "No employees to sync" };
    }

    const output: any[] = [];
    const deptMap = new Map();

    // ===== EMPLOYEES =====
    employees.forEach((emp: Employee) => {
      const empId = String(emp["Emp ID"] || "").trim();
      if (!empId) return;

      const managerRaw = emp["Line Manager"];
      const managerId = managerRaw
        ? trimLeadingZeros(String(managerRaw).split(":")[0].trim())
        : null;

      const dept = typeof emp["Dept"] === "string" ? emp["Dept"] : "";
      const deptKey = `dept:${dept}:${managerId}`;

      deptMap.set(deptKey, { dept, managerId });

      const joiningDate = formatDate(emp["Joining\r\n Date"]) || "";
      const tags = ["emp"];
      
      // Kiểm tra nếu trong thời gian thử việc
      if (joiningDate && isProbationPeriod(joiningDate)) {
        tags.push("Emp_probation");
      }

      output.push({
        id: empId,
        pid: managerId,
        stpid: deptKey,
        name: typeof emp["FullName "] === "string" ? emp["FullName "] : "",
        title: typeof emp["Job Title"] === "string" ? emp["Job Title"] : "",
        image: `${IMAGE_BASE_URL}${empId}.jpg`,
        tags: JSON.stringify(tags),
        orig_pid: managerId,
        dept: dept || null,
        BU: emp["BU"] || null,
        type: emp["DL/IDL/Staff"] || null,
        location: emp["Location"] || null,
        description: emp["Employee Type"] || "",
        joiningDate: joiningDate
      });
    });

    // ===== DEPARTMENTS =====
    deptMap.forEach((v, deptKey) => {
      output.push({
        id: deptKey,
        pid: v.managerId,
        stpid: null,
        name: typeof v.dept === "string" ? v.dept : "",
        title: "Department",
        image: null,
        tags: JSON.stringify(["group"]),
        orig_pid: v.managerId,
        dept: typeof v.dept === "string" ? v.dept : "",
        BU: null,
        type: "group",
        location: null,
        description: `Dept under manager ${v.managerId}`,
        joiningDate: null
      });
    });

    // ===== COMPARE WITH EXISTING DATA =====
    const orgchartRef = collection(db, "Orgchart_data");
    const existingData = await getDocs(query(orgchartRef));
    
    const existingMap = new Map();
    existingData.docs.forEach(doc => {
      existingMap.set(doc.id, doc.data());
    });

    // Tìm dữ liệu thay đổi, mới và cũ
    const toUpdate: any[] = [];
    const toAdd: any[] = [];
    const toDelete: Set<string> = new Set(existingMap.keys());

    output.forEach(item => {
      toDelete.delete(item.id);
      const existing = existingMap.get(item.id);
      
      if (!existing) {
        // Dữ liệu mới
        toAdd.push(item);
      } else {
        // So sánh hash
        const existingHash = createHash(existing);
        const newHash = createHash(item);
        
        if (existingHash !== newHash) {
          // Dữ liệu thay đổi
          toUpdate.push(item);
        }
      }
    });

    let updateCount = 0;
    let addCount = 0;
    let deleteCount = 0;

    const batchSize = 500;

    // ===== UPDATE CHANGED ITEMS =====
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = writeBatch(db);
      const batch_data = toUpdate.slice(i, i + batchSize);

      batch_data.forEach(item => {
        const docRef = doc(orgchartRef, item.id);
        batch.set(docRef, item);
        updateCount++;
      });

      if (batch_data.length > 0) {
        await batch.commit();
      }
    }

    // ===== ADD NEW ITEMS =====
    for (let i = 0; i < toAdd.length; i += batchSize) {
      const batch = writeBatch(db);
      const batch_data = toAdd.slice(i, i + batchSize);

      batch_data.forEach(item => {
        const docRef = doc(orgchartRef, item.id);
        batch.set(docRef, item);
        addCount++;
      });

      if (batch_data.length > 0) {
        await batch.commit();
      }
    }

    // ===== DELETE REMOVED ITEMS =====
    const toDeleteArr = Array.from(toDelete);
    for (let i = 0; i < toDeleteArr.length; i += batchSize) {
      const batch = writeBatch(db);
      const batch_ids = toDeleteArr.slice(i, i + batchSize);

      batch_ids.forEach(id => {
        const docRef = doc(orgchartRef, id);
        batch.delete(docRef);
        deleteCount++;
      });

      if (batch_ids.length > 0) {
        await batch.commit();
      }
    }

    return {
      success: true,
      message: `Sync completed`,
      employees: employees.length,
      departments: deptMap.size,
      total: output.length,
      updated: updateCount,
      added: addCount,
      deleted: deleteCount
    };
  } catch (err: any) {
    console.error("Sync error:", err);
    return {
      success: false,
      error: err.message || "Sync failed"
    };
  }
}

export async function POST(req: Request) {
  const result = await syncEmployeesToOrgchart();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const result = await syncEmployeesToOrgchart();
  return NextResponse.json(result);
}
