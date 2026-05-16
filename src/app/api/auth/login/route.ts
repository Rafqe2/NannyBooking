import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Build the redirect from the incoming request URL so we never fall back to localhost in prod.
  return NextResponse.redirect(new URL("/login", req.url));
}
