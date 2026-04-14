export function get() {
  return Response.json({
    ok: true,
    resource: "products",
    action: "list"
  });
}

export function post() {
  return Response.json({
    ok: true,
    resource: "products",
    action: "create"
  });
}
