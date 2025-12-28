import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("full_name", "asc"));
        const querySnapshot = await getDocs(q);

        const userList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: userList
        });
    } catch (error: any) {
        console.error("API Fetch Users Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch users"
        }, { status: 500 });
    }
}
