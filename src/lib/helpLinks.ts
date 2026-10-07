import { getWhatsAppContactLink } from "@/lib/whatsapp";

type HelpLinksOptions = {
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  liveChatHref?: string;
};

export function getHelpLinks({
  supportEmail,
  supportPhone,
  whatsappNumber,
  liveChatHref = "/live-chat",
}: HelpLinksOptions) {
  return [
    { label: "All Help", href: "/help", external: false },
    { label: "Visit Shop", href: "/", external: false },
    { label: "Live Chat", href: liveChatHref, external: true },
    {
      label: "WhatsApp",
      href: getWhatsAppContactLink(whatsappNumber),
      external: true,
    },
    { label: "Email", href: `mailto:${supportEmail}`, external: false },
    {
      label: "Call Support",
      href: `tel:${supportPhone.replace(/[^\d+]/g, "")}`,
      external: false,
    },
    { label: "Contact Form", href: "/contact", external: false },
    { label: "FAQs", href: "/faqs", external: false },
    { label: "Track Order", href: "/track", external: false },
    { label: "My Orders", href: "/orders", external: false },
  ];
}
