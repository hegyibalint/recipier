import { Unna } from "@next/font/google";
const unna = Unna({ weight: "400", display: "optional" });

import "../styles/global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={unna.className}>
      <body>{children}</body>
    </html>
  );
}
