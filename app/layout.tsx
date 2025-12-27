import type { Metadata } from "next";
import "./globals.css";
import { ConsoleWarningFilter } from "@/components/ConsoleWarningFilter";

export const metadata: Metadata = {
  title: "Coachify - Real coaches. Real progress. From anywhere.",
  description: "A sports coaching marketplace where students discover verified coaches, learn from videos and courses, and book 1:1 online coaching sessions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ConsoleWarningFilter />
        {children}
      </body>
    </html>
  );
}



