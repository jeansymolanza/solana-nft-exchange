import type { NextPage } from 'next';
import { useSolanaWallet } from '@/contexts/SolanaWalletProvider';
import { ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { ConsoleHelper, toPublicKey } from '@/utils/helper';
import { AnchorProvider, Idl, Program } from '@project-serum/anchor';
import { useCallback, useMemo } from 'react';
import { getAssociatedTokenAddress, hasNft, SOLANA_HOST } from '@/utils/const';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const NFT_EXCHANGE_PROGRAM_IDL = require('../idl/nft_exchange.json');
const NFT_EXCHANGE_PROGRAM_ID = '3aVJtfRnDJqdAxtxu9VE1arfjPSpkrKwAvzBxfgQBodE';
const NFT_HASH = '8cXNxSgM81HdnNxtikSnSgegBCg1Hy29BTZ4WyKk4VVW';
const NFT_TOKEN_ACCOUNT = 'EkyhxdkD6K3CDwKQiTfBynV1cTsMF6mK3jytZKCJPJYf';
const EXCHANGE_PDA_SEED = `exchange`;
const LOCKED_PDA_SEED = `locked`;

const Index: NextPage = () => {
  const wallet = useSolanaWallet();
  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, `confirmed`),
    [],
  );
  const getAnchorProvider = useCallback(async () => {
    const opts = {
      preflightCommitment: `confirmed`,
    };
    return new AnchorProvider(
      solanaConnection,
      wallet as unknown as AnchorWallet,
      opts.preflightCommitment as unknown as ConfirmOptions,
    );
  }, [solanaConnection, wallet]);

  const programId = toPublicKey(NFT_EXCHANGE_PROGRAM_ID);

  const handleLockButtonClick = useCallback(async () => {
    if (!solanaConnection || !wallet || !wallet.publicKey) {
      return;
    }

    const provider = await getAnchorProvider();
    const programIdl = NFT_EXCHANGE_PROGRAM_IDL;
    if (!provider) {
      return;
    }

    const program = new Program(
      programIdl as unknown as Idl,
      programId,
      provider,
    );
    ConsoleHelper(`lockNft -> program id: ${programId.toString()}`);

    const selectedNftAddress = toPublicKey(NFT_HASH);

    const [exchangePubkey, exchangeBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          selectedNftAddress.toBuffer(),
          Buffer.from(anchor.utils.bytes.utf8.encode(EXCHANGE_PDA_SEED)),
        ],
        programId,
      );

    const [lockedNftAccountPubkey, lockedNftAccountNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          selectedNftAddress.toBuffer(),
          Buffer.from(anchor.utils.bytes.utf8.encode(LOCKED_PDA_SEED)),
        ],
        programId,
      );

    let nftTokenAccount = await getAssociatedTokenAddress(
      NFT_HASH,
      wallet.publicKey,
    );

    const [configKey, configNonce] = await PublicKey.findProgramAddress(
      [Buffer.from(EXCHANGE_PDA_SEED)],
      programId,
    );

    ConsoleHelper(`nftTokenAccount`, nftTokenAccount.toString());
    ConsoleHelper(`nftAddress`, selectedNftAddress.toString());
    ConsoleHelper(`exchangePubkey`, exchangePubkey.toString());
    ConsoleHelper(`configKey`, configKey.toString());
    ConsoleHelper(`lockedNftAccountPubkey`, lockedNftAccountPubkey.toString());

    if (
      !(await hasNft(
        solanaConnection,
        wallet.publicKey,
        selectedNftAddress,
        null,
      ))
    ) {
      try {
        const txId = await program.methods
          .lock(configNonce, exchangeBump, lockedNftAccountNonce)
          .accounts({
            signer: provider.wallet.publicKey,
            nftAccount: toPublicKey(NFT_TOKEN_ACCOUNT),
            nftMint: NFT_HASH,
            exchangeAccount: exchangePubkey,
            configuration: configKey,
            lockedNftTokenAccount: lockedNftAccountPubkey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        return { success: true, tx_id: txId };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
    }
  }, [getAnchorProvider, programId, solanaConnection, wallet]);

  const handleUnlockButtonClick = () => {};

  return (
    <div>
      <WalletMultiButton />
      {wallet && wallet.publicKey && (
        <div>
          <button onClick={() => handleLockButtonClick()}>Lock</button>
          &nbsp;
          <button onClick={handleUnlockButtonClick}>Unlock</button>
        </div>
      )}
    </div>
  );
};

export default Index;
