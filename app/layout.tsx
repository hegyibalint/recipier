import { Roboto } from "@next/font/google";
const inter = Roboto({
  weight: "400",
});

import "../styles/global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
