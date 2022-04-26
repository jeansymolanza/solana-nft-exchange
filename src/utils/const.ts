import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { ConsoleHelper, toPublicKey } from "./helper";
import BN from "bn.js";
import * as anchor from '@project-serum/anchor';

export type Cluster = 'devnet' | 'testnet' | 'mainnet';

export const CLUSTER: Cluster =
  // eslint-disable-next-line no-nested-ternary
  process.env.NEXT_PUBLIC_CLUSTER === `mainnet`
    ? `mainnet`
    : process.env.NEXT_PUBLIC_CLUSTER === `devnet`
    ? `devnet`
    : `testnet`;

export const SOLANA_HOST = process.env.REACT_APP_SOLANA_API_URL
  ? process.env.REACT_APP_SOLANA_API_URL
  : // eslint-disable-next-line no-nested-ternary
  CLUSTER === `mainnet`
  ? clusterApiUrl('mainnet-beta')
  : clusterApiUrl('devnet');

export const getAssociatedTokenAddress = async (
  mintKey: PublicKey | string,
  ownerKey: PublicKey | string,
): Promise<PublicKey> =>
  Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    toPublicKey(mintKey),
    toPublicKey(ownerKey),
  );

export const hasNft = async (
  solanaConnection: Connection,
  walletAccount: string | PublicKey,
  nftAddress: string | PublicKey,
  tokenAccount: null | string | PublicKey,
) => {
  if (!solanaConnection) {
    return false;
  }

  const associatedKey = await getAssociatedTokenAddress(
    toPublicKey(nftAddress),
    toPublicKey(walletAccount),
  );
  ConsoleHelper(
    `isEnoughNft -> associatedKey: ${pubkeyToString(associatedKey)}`,
  );

  try {
    const nftAmount = await getTokenBalance(solanaConnection, associatedKey);
    if (nftAmount.eq(new BN(1))) {
      return true;
    }
  } catch (e) {
    ConsoleHelper(`isEnoughNftOnSolana: ${e}`);
  }
  if (!tokenAccount) {
    return false;
  }
  try {
    const nftAmount = await getTokenBalance(
      solanaConnection,
      toPublicKey(tokenAccount),
    );
    if (nftAmount.eq(new BN(1))) {
      return true;
    }
  } catch (e) {
    ConsoleHelper(`isEnoughNftOnSolana: ${e}`);
  }

  return false;
};

export const getTokenBalance = async (
  connection: Connection,
  pubkey: PublicKey | string,
) =>
  new anchor.BN(
    (await connection.getTokenAccountBalance(toPublicKey(pubkey))).value.amount,
  );

export const pubkeyToString = (key: PublicKey | null | string = ``) =>
  typeof key === `string` ? key : key?.toBase58() || ``;
