export function formatOrderNumber(orderNumber: number): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const suffixSpace = 36 ** 5;
  const codeSpace = 26 * suffixSpace;
  const multiplier = 104729;
  const offset = 987654321;
  const sequence = orderNumber - 1;

  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence >= codeSpace) {
    throw new RangeError("Order number is outside the six-character order code range.");
  }

  const encoded = (sequence * multiplier + offset) % codeSpace;
  const prefix = String.fromCharCode(65 + Math.floor(encoded / suffixSpace));
  let suffixValue = encoded % suffixSpace;
  let suffix = "";

  for (let i = 0; i < 5; i++) {
    suffix = alphabet[suffixValue % 36] + suffix;
    suffixValue = Math.floor(suffixValue / 36);
  }

  return `${prefix}${suffix}`;
}
