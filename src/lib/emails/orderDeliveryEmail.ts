import type { OrderStatusEmailDetails } from "./shared";
import { generateUserUpdateEmail } from "./userUpdateEmail";

export function generateOrderDeliveryEmail(
  customerName: string,
  status: string,
  message: string,
  orderDetails: OrderStatusEmailDetails
): string {
  return generateUserUpdateEmail(
    customerName,
    `Order ${status} - #${orderDetails.orderNumber}`,
    message,
    orderDetails
  );
}
