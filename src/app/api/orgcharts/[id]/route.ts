import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate ID
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: "Invalid orgchart ID" }, { status: 400 });
        }

        // Check if db is initialized
        if (!db) {
            console.error("Firebase Firestore not initialized");
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        const docRef = doc(db, "orgcharts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return NextResponse.json({
                orgchart_id: docSnap.id,
                ...docSnap.data()
            });
        } else {
            // Return empty data instead of 404 to prevent UI errors
            return NextResponse.json({
                error: "Orgchart not found",
                orgchart_id: id,
                org_data: { data: [] }
            }, { status: 404 });
        }
    } catch (err) {
        const error = err as Error;
        console.error("GET Orgchart Error:", error.message, error.stack);
        return NextResponse.json({
            error: error.message || "Unknown error occurred",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const { org_data, orgchart_name, describe } = data;

        const docRef = doc(db, "orgcharts", id);
        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (org_data) updateData.org_data = org_data;
        if (orgchart_name) updateData.orgchart_name = orgchart_name;
        if (describe) updateData.describe = describe;

        await updateDoc(docRef, updateData);

        return NextResponse.json({ success: true, message: "Updated successfully" });
    } catch (err) {
        console.error("PUT Orgchart Error:", err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const docRef = doc(db, "orgcharts", id);
        await deleteDoc(docRef);
        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        console.error("DELETE Orgchart Error:", err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
