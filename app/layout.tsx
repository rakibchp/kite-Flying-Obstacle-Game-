import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghuddi — A Rooftop Kite-Flying Adventure",
  description:
    "Take to the Dhaka rooftops for a Shakrain kite-flying adventure. Dodge crows, steer your ghuddi, and see how long you can stay in the sky.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
