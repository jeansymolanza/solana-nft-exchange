import {
  JSXElementConstructor,
  ReactChildren,
  ReactElement,
  useMemo,
} from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
require(`@solana/wallet-adapter-react-ui/styles.css`);

export const SolanaWalletProvider = ({
  children,
}: {
  children: ReactElement<
    ReactChildren,
    string | JSXElementConstructor<unknown>
  >;
}) => {
  const network =
    process.env.REACT_APP_CLUSTER === `mainnet`
      ? WalletAdapterNetwork.Mainnet
      : WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const useSolanaWallet = useWallet;
