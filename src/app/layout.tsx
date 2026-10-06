import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ubuntu = localFont({
  src: [
    { path: "./fonts/Ubuntu-Regular.ttf", weight: "400" },
    { path: "./fonts/Ubuntu-Medium.ttf", weight: "500" },
    { path: "./fonts/Ubuntu-Bold.ttf", weight: "700" },
  ],
  variable: "--font-ubuntu",
});

export const metadata: Metadata = {
  title: { default: "BongoMaker Control", template: "%s · BongoMaker Control" },
  description: "Control panel for BongoMaker smart devices.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ubuntu.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
