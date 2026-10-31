export const MAX_INT = 2147483647;

export function isValidInt(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_INT
  );
}

export function parseIdParam(idStr: string): number | null {
  const num = Number(idStr);
  if (!isValidInt(num)) {
    return null;
  }
  return num;
}