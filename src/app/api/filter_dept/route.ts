import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const groupName = searchParams.get("group"); // MFG

  const res = await axios.get(
    "https://script.google.com/macros/s/AKfycbzXlPZTDuLdpfzivyVg-tXXV6bKsavMkb1JbgWIPwGNtyEmxvP-ar00J6l6MIysnjxbPg/exec"
  );

  const allNodes = res.data.data || [];

  if (!groupName) {
    return NextResponse.json({ data: allNodes });
  }

  // 1️⃣ tìm root group
  const rootGroup = allNodes.find(
    (n: any) =>
      n.name === groupName &&
      Array.isArray(n.tags) &&
      n.tags.includes("group")
  );

  if (!rootGroup) {
    return NextResponse.json({ data: [] });
  }

  const result: any[] = [];
  const visited = new Set<string | number>();

  function dfs(nodeId: string | number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const current = allNodes.find((n: any) => n.id === nodeId);
    if (current) result.push(current);

    allNodes.forEach((n: any) => {
      // 🔹 GROUP → GROUP
      if (
        n.pid === nodeId &&
        Array.isArray(n.tags) &&
        n.tags.includes("group")
      ) {
        dfs(n.id);
      }

      // 🔹 GROUP → EMP
      if (
        n.pid === nodeId &&
        Array.isArray(n.tags) &&
        n.tags.includes("emp")
      ) {
        dfs(n.id);
      }

      // 🔹 EMP → EMP
      if (n.stpid === nodeId) {
        dfs(n.id);
      }
    });
  }

  dfs(rootGroup.id);

  return NextResponse.json({ data: result });
}
