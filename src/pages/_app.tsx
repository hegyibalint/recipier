import '../../styles/global.css';

import { Unna } from '@next/font/google';
import '@fortawesome/fontawesome-svg-core/styles.css';

import Footer from '../components/Footer';
import Header from '../components/Header';
import { AppProps } from 'next/dist/shared/lib/router/router';
import { trpc } from '../utils/trpc';

const unna = Unna({ weight: ['400', '700'], display: 'optional' });

function AppLayout({ Component, pageProps }: AppProps) {
  return (
    <div className={`flex-grow flex flex-col ${unna.className}`}>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}

export default trpc.withTRPC(AppLayout);
