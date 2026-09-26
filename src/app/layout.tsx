import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import "./globals.css";

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-gabarito",
});

export const metadata: Metadata = {
  title: "Halp",
  description: "PR risk scoring. Know what needs review.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className={gabarito.variable}>
      <body>{children}</body>
    </html>
  );
}
