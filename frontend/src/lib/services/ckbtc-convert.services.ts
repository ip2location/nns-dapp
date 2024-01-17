import { NANO_SECONDS_IN_MINUTE } from "$lib/constants/constants";
import { loadCkBTCWithdrawalAccount } from "$lib/services/ckbtc-withdrawal-accounts.services";
import { bitcoinConvertBlockIndexes } from "$lib/stores/bitcoin.store";
import type { Account } from "$lib/types/account";
import type { CanisterId } from "$lib/types/canister";
import type { CkBTCAdditionalCanisters } from "$lib/types/ckbtc-canisters";
import { ConvertBtcStep } from "$lib/types/ckbtc-convert";
import type { UniverseCanisterId } from "$lib/types/universe";
import { nowInBigIntNanoSeconds } from "$lib/utils/date.utils";
import {
  MinterAlreadyProcessingError,
  MinterAmountTooLowError,
  MinterGenericError,
  MinterInsufficientFundsError,
  MinterMalformedAddressError,
  MinterTemporaryUnavailableError,
} from "@dfinity/ckbtc";
import { nonNullish } from "@dfinity/utils";
import {
  retrieveBtc as retrieveBtcAPI,
  retrieveBtcWithApproval,
} from "../api/ckbtc-minter.api";
import { approveTransfer } from "../api/icrc-ledger.api";
import { toastsError } from "../stores/toasts.store";
import { numberToE8s } from "../utils/token.utils";
import { getAuthenticatedIdentity } from "./auth.services";
import { loadCkBTCAccounts } from "./ckbtc-accounts.services";
import type { IcrcTransferTokensUserParams } from "./icrc-accounts.services";
import { loadWalletTransactions } from "./wallet-transactions.services";

export type ConvertCkBTCToBtcParams = {
  destinationAddress: string;
  amount: number;
  universeId: UniverseCanisterId;
  canisters: CkBTCAdditionalCanisters;
  updateProgress: (step: ConvertBtcStep) => void;
};

/**
 * Convert ckBTC to BTC with ICRC-2
 *
 * 1. Approve transfer (ledger.icrc2_approve).
 * 2. Request BTC (minter.retrieve_btc_with_approval).
 */
export const convertCkBTCToBtcIcrc2 = async ({
  destinationAddress,
  amount,
  source,
  universeId,
  canisters: { minterCanisterId, indexCanisterId },
  updateProgress,
}: ConvertCkBTCToBtcParams &
  Pick<IcrcTransferTokensUserParams, "source">): Promise<{
  success: boolean;
}> => {
  try {
    const identity = await getAuthenticatedIdentity();

    updateProgress(ConvertBtcStep.APPROVE_TRANSFER);

    await approveTransfer({
      identity,
      canisterId: universeId,
      amount: numberToE8s(amount),
      // 5 minutes should be long enough to perform the transfer but if it
      // doesn't succeed we don't want the approval to remain valid
      // indefinitely.
      expiresAt: nowInBigIntNanoSeconds() + BigInt(5 * NANO_SECONDS_IN_MINUTE),
      spender: minterCanisterId,
    });

    updateProgress(ConvertBtcStep.SEND_BTC);

    await retrieveBtcWithApproval({
      identity,
      canisterId: minterCanisterId,
      address: destinationAddress,
      amount: numberToE8s(amount),
    });
  } catch (err: unknown) {
    toastsError(toastRetrieveBtcError(err));

    return { success: false };
  } finally {
    await reload({
      source,
      universeId,
      indexCanisterId,
      loadAccounts: true,
      updateProgress,
    });
  }

  updateProgress(ConvertBtcStep.DONE);

  return { success: true };
};

/**
 * Call retrieve BTC after a transfer to ledger (ckBTC -> BTC) or if previous conversion failed half-way.
 *
 * 1. get_withdrawal_account -> get ckBTC address (account)
 * 2. icrc1_transfer(account)
 * 3. retrieve_btc <----------------------- here
 *
 */
export const retrieveBtc = async ({
  destinationAddress,
  amount,
  universeId,
  canisters: { minterCanisterId, indexCanisterId },
  updateProgress,
}: ConvertCkBTCToBtcParams): Promise<{
  success: boolean;
}> => {
  updateProgress(ConvertBtcStep.INITIALIZATION);

  return await retrieveBtcAndReload({
    destinationAddress,
    amount,
    universeId,
    canisters: { minterCanisterId, indexCanisterId },
    updateProgress,
  });
};

const retrieveBtcAndReload = async ({
  destinationAddress: bitcoinAddress,
  amount,
  source,
  universeId,
  canisters: { minterCanisterId, indexCanisterId },
  updateProgress,
  blockIndex,
}: {
  source?: Account;
  destinationAddress: string;
  amount: number;
  universeId: UniverseCanisterId;
  canisters: CkBTCAdditionalCanisters;
  updateProgress: (step: ConvertBtcStep) => void;
  blockIndex?: bigint;
}): Promise<{
  success: boolean;
}> => {
  updateProgress(ConvertBtcStep.SEND_BTC);

  const identity = await getAuthenticatedIdentity();

  try {
    await retrieveBtcAPI({
      identity,
      address: bitcoinAddress,
      amount: numberToE8s(amount),
      canisterId: minterCanisterId,
    });
  } catch (err: unknown) {
    toastsError(toastRetrieveBtcError(err));

    return { success: false };
  } finally {
    // Regardless if success or error, the UI is still active therefore we can remove the flag with blockIndex if provided
    if (nonNullish(blockIndex)) {
      bitcoinConvertBlockIndexes.removeBlockIndex(blockIndex);
    }

    await reload({
      source,
      universeId,
      indexCanisterId,
      loadAccounts: false,
      updateProgress,
    });
  }

  updateProgress(ConvertBtcStep.DONE);

  return { success: true };
};

const reload = async ({
  source,
  universeId,
  indexCanisterId,
  loadAccounts,
  updateProgress,
}: {
  source?: Account;
  universeId: UniverseCanisterId;
  indexCanisterId: CanisterId;
  loadAccounts: boolean;
  updateProgress: (step: ConvertBtcStep) => void;
}): Promise<void> => {
  updateProgress(ConvertBtcStep.RELOAD);

  // Reload:
  // - if provided, the transactions of the account for which the transfer was executed
  // - the balance of the withdrawal account to display an information if some funds - from this transaction or another - are stuck and not been converted yet
  await Promise.all([
    ...(loadAccounts ? [loadCkBTCAccounts({ universeId })] : []),
    ...(nonNullish(source)
      ? [
          loadWalletTransactions({
            account: source,
            canisterId: universeId,
            indexCanisterId,
          }),
        ]
      : []),
    loadCkBTCWithdrawalAccount({
      universeId,
    }),
  ]);
};

const toastRetrieveBtcError = (
  err: unknown
): { labelKey: string; err: unknown } => {
  if (err instanceof MinterTemporaryUnavailableError) {
    return {
      labelKey: "error__ckbtc.temporary_unavailable",
      err,
    };
  }

  if (err instanceof MinterAlreadyProcessingError) {
    return {
      labelKey: "error__ckbtc.already_process",
      err,
    };
  }

  if (err instanceof MinterMalformedAddressError) {
    return {
      labelKey: "error__ckbtc.malformed_address",
      err,
    };
  }

  if (err instanceof MinterAmountTooLowError) {
    return {
      labelKey: "error__ckbtc.amount_too_low",
      err,
    };
  }

  if (err instanceof MinterInsufficientFundsError) {
    return {
      labelKey: "error__ckbtc.insufficient_funds",
      err,
    };
  }

  if (err instanceof MinterGenericError) {
    return {
      labelKey: "error__ckbtc.retrieve_btc",
      err,
    };
  }

  return {
    labelKey: "error__ckbtc.retrieve_btc_unknown",
    err,
  };
};
