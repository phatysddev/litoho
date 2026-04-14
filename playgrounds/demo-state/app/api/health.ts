export function get() {
  return Response.json({
    ok: true,
    framework: "Lito",
    area: "demo-state"
  });
}
