export function validateAmount(amount) {
  const parsed = typeof amount === "number" ? amount : parseFloat(amount);
  if (typeof parsed !== "number" || isNaN(parsed) || !isFinite(parsed)) {
    return { valid: false, message: "Invalid amount" };
  }
  if (parsed <= 0) {
    return { valid: false, message: "Amount must be greater than zero" };
  }
  return { valid: true, value: parsed };
}
