import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({ user });
}
