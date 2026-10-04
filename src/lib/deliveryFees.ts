export function summarizeDeliveryFees(
  items: ReadonlyArray<{ deliveryFee?: number; quantity: number }>
) {
  return items.reduce(
    (summary, item) => {
      const fee = item.deliveryFee;
      if (typeof fee !== "number" || !Number.isFinite(fee) || fee <= 0) {
        summary.pending = true;
      } else {
        summary.total += fee * item.quantity;
      }
      return summary;
    },
    { total: 0, pending: false }
  );
}
