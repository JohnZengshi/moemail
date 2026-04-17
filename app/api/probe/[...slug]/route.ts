import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params
  return Response.json({
    ok: true,
    route: "probe-catch-all",
    pathname: request.nextUrl.pathname,
    slug: resolved.slug,
  }, {
    headers: { "x-catchall-probe": "1" },
  })
}
