export function billingInterval(
  metadata: Record<string, any> = {},
): "month" | "year" {
  const value = String(metadata.interval ?? metadata.billing ?? "month")
    .toLowerCase();
  if (value === "year" || value === "annual") return "year";
  if (value === "month" || value === "monthly") return "month";
  throw new Error("Invalid billing interval");
}
