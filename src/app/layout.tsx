import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "/styles/vendor/globals.css"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kahop - Dev Job Interview with AI",
  description:
    "Prepare your dev job interviews with our artificial intelligence platform. Generate personalized interviews based on your CV and improve your skills to stand out in the selection process.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body className={inter.className}>{children}</body>

    </html>
  );
}
