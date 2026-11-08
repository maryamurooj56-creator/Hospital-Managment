import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CareWell Hospital | Appointments & E-Prescriptions",
    template: "%s | CareWell Hospital",
  },
  description:
    "Book appointments with trusted specialists, manage patient records and access secure digital prescriptions at CareWell Hospital.",
  keywords: ["hospital", "appointments", "e-prescription", "healthcare", "patient portal"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1657e5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
