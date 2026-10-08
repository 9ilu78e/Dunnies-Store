const liveChatQuickQuestions = [
  {
    label: "Track an order",
    message: "How can I track my order?",
  },
  {
    label: "Delivery times",
    message: "How long does delivery take?",
  },
  {
    label: "Payment help",
    message: "What payment options do you accept?",
  },
  {
    label: "Returns",
    message: "How do returns and exchanges work?",
  },
  {
    label: "Product availability",
    message: "Can you help me check product availability?",
  },
  {
    label: "Delivery details",
    message: "How can I update my delivery details?",
  },
];

function getLiveChatAutoResponse(message) {
  const text = message.toLowerCase();

  if (/\b(order|track|tracking|delivery status)\b/.test(text)) {
    return "You can check the latest status and tracking details in My Orders. If you share your order number with our team, they can look into it for you.";
  }
  if (/\b(delivery|deliveries|deliver|shipping|ship|arrival)\b/.test(text)) {
    return "Delivery timing depends on your location and the item. Your order page shows the latest updates after checkout. Would you like a team member to check a specific order?";
  }
  if (/\b(pay|payment|card|wallet|refund)\b/.test(text)) {
    return "You can see the available payment methods at checkout. For help with a payment or refund already in progress, our team can review the details securely.";
  }
  if (/\b(returns?|exchanges?|cancel)\b/.test(text)) {
    return "Return and cancellation options can depend on the order status. Please check My Orders, or ask our team to review your specific order.";
  }
  if (/\b(product|stock|available|size|colour|color|gift)\b/.test(text)) {
    return "I can help with product questions. Open the product page for current options and availability, or ask our team to confirm a particular item.";
  }
  if (/\b(address|delivery details|recipient|phone number)\b/.test(text)) {
    return "You can manage saved delivery details from your profile. If an order is already placed, contact our team to check whether its address can still be updated.";
  }

  return "I can help with orders, delivery, payments, returns, product availability, and delivery details. Choose a topic below or ask to chat with our team.";
}

function getLiveChatReply(message) {
  if (message === liveChatHandoffMessage) return liveChatHandoffResponse;
  return `${getLiveChatAutoResponse(message)}\n\nWould you like to chat with our team? You can request a team member below.`;
}

const liveChatHandoffMessage =
  "I'd like to chat with a member of the Dunnis support team.";

const liveChatHandoffResponse =
  "I’ve passed your request to our support team. Please keep this chat open and wait here; a team member will join as soon as they’re available.";

exports.liveChatQuickQuestions = liveChatQuickQuestions;
exports.getLiveChatAutoResponse = getLiveChatAutoResponse;
exports.getLiveChatReply = getLiveChatReply;
exports.liveChatHandoffMessage = liveChatHandoffMessage;
exports.liveChatHandoffResponse = liveChatHandoffResponse;
