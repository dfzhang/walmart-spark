import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support | Spark Driver™ Help Center",
  description:
    "Need more help? Contact the Spark Driver support team with your question or issue.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
