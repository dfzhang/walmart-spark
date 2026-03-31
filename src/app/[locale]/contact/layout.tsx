import type { Metadata } from "next";
import { buildHreflangAlternates } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Contact Support | Spark Driver™ Help Center",
  description:
    "Need more help? Contact the Spark Driver support team with your question or issue.",
  alternates: {
    languages: buildHreflangAlternates("/contact"),
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
