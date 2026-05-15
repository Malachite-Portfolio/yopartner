export function formatINRPrice(value?: number, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value)) return "₹—";
  return `₹${value}${suffix}`;
}
