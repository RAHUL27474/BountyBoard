import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";

const ESCROW_WALLET = new PublicKey("11111111111111111111111111111111"); // Placeholder — in production, use a PDA or multisig

export function getConnection() {
  return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export async function createEscrowTransaction(
  senderPubkey: PublicKey,
  amountSol: number
): Promise<Transaction> {
  const connection = getConnection();
  const transaction = new Transaction();

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: senderPubkey,
      toPubkey: ESCROW_WALLET,
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderPubkey;

  return transaction;
}

export async function createPaymentTransaction(
  senderPubkey: PublicKey,
  recipientAddress: string,
  amountSol: number
): Promise<Transaction> {
  const connection = getConnection();
  const recipientPubkey = new PublicKey(recipientAddress);
  const transaction = new Transaction();

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: senderPubkey,
      toPubkey: recipientPubkey,
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderPubkey;

  return transaction;
}

export function getSolanaExplorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
