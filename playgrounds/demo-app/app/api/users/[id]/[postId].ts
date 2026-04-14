export function get() {
  return Response.json({
    ok: true,
    route: "users/[id]/[postId]"
  });
}
