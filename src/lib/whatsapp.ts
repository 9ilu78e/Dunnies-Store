export interface WhatsAppOrderMessage {
  productName: string;
  productPrice: number;
  productQuantity: number;
  productImage?: string;
  productLink: string;
  customerName?: string;
  whatsappNumber: string;
}

export function generateWhatsAppOrderMessage(
  order: WhatsAppOrderMessage
): string {
  const customer = order.customerName
    ? `\n\nCustomer name: ${order.customerName}`
    : "";
  const message = `Hello Dunnis Stores, I would like to order:

📦 *${order.productName}*
💰 Unit price: ₦${order.productPrice.toLocaleString()}
📊 Quantity: ${order.productQuantity}
🧾 Total: ₦${(order.productPrice * order.productQuantity).toLocaleString()}
🖼️ Product image: ${order.productImage || "Not available"}
🔗 Product link: ${order.productLink}${customer}

Please confirm availability and delivery details.`;

  return encodeURIComponent(message);
}

export function getWhatsAppLink(
  whatsappNumber: string,
  order: WhatsAppOrderMessage
): string {
  const message = generateWhatsAppOrderMessage(order);
  const digits = whatsappNumber.replace(/\D/g, "");
  const cleanNumber = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${cleanNumber}?text=${message}`;
}

export function generateWhatsAppAPIMessage(
  whatsappNumber: string,
  order: WhatsAppOrderMessage
): {
  phone: string;
  message: string;
} {
  const customer = order.customerName
    ? `\n\nCustomer name: ${order.customerName}`
    : "";
  return {
    phone: whatsappNumber,
    message: `Hello Dunnis Stores, I would like to order:

📦 *${order.productName}*
💰 Unit price: ₦${order.productPrice.toLocaleString()}
📊 Quantity: ${order.productQuantity}
🧾 Total: ₦${(order.productPrice * order.productQuantity).toLocaleString()}
🖼️ Product image: ${order.productImage || "Not available"}
🔗 Product link: ${order.productLink}${customer}

Please confirm availability and delivery details.`,
  };
}
