export function normalizeMacId(macId) {
  if (!macId || typeof macId !== "string") return macId;
  return macId.replace(/[:\-\.\s]/g, "").toUpperCase();
}
