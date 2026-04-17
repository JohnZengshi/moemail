export const runtime = "edge"

export async function GET() {
  return Response.json({ ok: true, route: "auth-test" }, {
    headers: { "x-auth-test": "1" },
  })
}
