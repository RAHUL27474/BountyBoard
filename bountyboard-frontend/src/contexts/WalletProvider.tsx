import { useMemo, type ReactNode, type ComponentType } from "react";
import {
  ConnectionProvider as _ConnectionProvider,
  WalletProvider as _SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as _WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ConnectionProvider = _ConnectionProvider as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SolanaWalletProvider = _SolanaWalletProvider as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WalletModalProvider = _WalletModalProvider as ComponentType<any>;

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
