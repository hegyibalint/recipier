import "../styles/globals.css";

import type { AppProps } from "next/app";

function Reciper({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default Reciper;
