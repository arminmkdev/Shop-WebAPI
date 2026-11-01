// If the answer of API will be an array or one of these keys, it'll return an array.
export function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  return (
    payload?.items ||
    payload?.data ||
    payload?.products ||
    payload?.categories ||
    payload?.orders ||
    []
  );
}
