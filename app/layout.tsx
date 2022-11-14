import { Unna } from "@next/font/google";
const unna = Unna({ weight: ["400", "700"], display: "optional" });

import "../styles/global.css";
import "@fortawesome/fontawesome-svg-core/styles.css";

import Footer from "../components/Footer";
import Header from "../components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={unna.className}>
      <body className="flex flex-col h-screen">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
