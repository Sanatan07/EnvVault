import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const UPSTREAM = process.env.INTERNAL_API_URL || "http://localhost:8080";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const session = await getServerSession(authOptions);
  const path = params.path.join("/");
  const url = `${UPSTREAM}/api/v1/${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("Content-Type") || "application/json",
  };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.text();
  }

  const res = await fetch(url, { method: req.method, headers, body });
  const contentType = res.headers.get("Content-Type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  return NextResponse.json(data, { status: res.status });
}
