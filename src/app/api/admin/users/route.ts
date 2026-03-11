import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAdminClient(authHeader: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!supabaseUrl || !serviceKey) throw new Error("Missing env vars");

  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Unauthorized");

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: me, error } = await adminClient.auth.getUser(token);
  if (error || !me?.user) throw new Error("Unauthorized");

  const { data: profile } = await adminClient
    .from("users")
    .select("user_type")
    .eq("id", me.user.id)
    .single();

  if (profile?.user_type !== "admin") throw new Error("Forbidden");
  return { client: adminClient, meId: me.user.id };
}

// GET /api/admin/users - list all users
export async function GET(req: Request) {
  try {
    const { client } = await getAdminClient(req.headers.get("authorization"));

    const { data, error } = await client
      .from("users")
      .select("id, name, surname, email, user_type, created_at, location")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    return NextResponse.json({ users: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// POST /api/admin/users - suspend or delete a user
export async function POST(req: Request) {
  try {
    const { client, meId } = await getAdminClient(req.headers.get("authorization"));
    const body = await req.json().catch(() => ({}));
    const { userId, action } = body as { userId: string; action: "suspend" | "delete" };

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }
    if (userId === meId) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    if (action === "suspend") {
      const { error } = await client
        .from("users")
        .update({ user_type: "pending" })
        .eq("id", userId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await client.from("users").delete().eq("id", userId);
      const { error } = await client.auth.admin.deleteUser(userId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
