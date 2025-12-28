import { NextResponse } from 'next/server';
// Thêm Firebase Firestore
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ orgcharts: [] });
  }

  try {
    // Query Firestore collection "orgcharts" theo username
    const q = query(
      collection(db, "orgcharts"),
      where("username", "==", username)
    );
    const snapshot = await getDocs(q);
    const orgcharts: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orgcharts.push({
        orgchart_id: doc.id,
        orgchart_name: data.orgchart_name,
        describe: data.describe,
        org_data: data.org_data,
      });
    });
    return NextResponse.json({ orgcharts });
  } catch (err) {
    return NextResponse.json({ orgcharts: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { username, orgchart_name, describe, org_data } = data;

    if (!username || !orgchart_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "orgcharts"), {
      username,
      orgchart_name,
      describe: describe || "",
      org_data: org_data || { data: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      orgchart_id: docRef.id,
      message: "Orgchart created successfully"
    });
  } catch (err) {
    console.error("Error creating orgchart:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
