import type { AppProps } from 'next/app';
import { SolanaWalletProvider } from "@/contexts/SolanaWalletProvider";
import { FC } from 'react';

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <SolanaWalletProvider>
      <Component {...pageProps} />
    </SolanaWalletProvider>
  );
};

export default App;
