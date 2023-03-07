import {
  addHotkey,
  autoStakeMaturity,
  claimOrRefreshNeuron,
  disburse,
  increaseDissolveDelay,
  joinCommunityFund,
  leaveCommunityFund,
  mergeMaturity,
  mergeNeurons,
  queryKnownNeurons,
  queryNeuron,
  queryNeurons,
  removeHotkey,
  setFollowees,
  spawnNeuron,
  splitNeuron,
  stakeMaturity,
  stakeNeuron,
  startDissolving,
  stopDissolving,
  type ApiAutoStakeMaturityParams,
  type ApiDisburseParams,
  type ApiIncreaseDissolveDelayParams,
  type ApiManageHotkeyParams,
  type ApiManageNeuronParams,
  type ApiMergeMaturityParams,
  type ApiMergeNeuronsParams,
  type ApiQueryNeuronParams,
  type ApiQueryParams,
  type ApiSetFolloweesParams,
  type ApiSpawnNeuronParams,
  type ApiSplitNeuronParams,
  type ApiStakeMaturityParams,
  type ApiStakeNeuronParams,
} from "$lib/api/governance.api";
import { SECONDS_IN_MINUTE } from "$lib/constants/constants";
import { nowInSeconds } from "$lib/utils/date.utils";
import type { Identity } from "@dfinity/agent";
import type { NeuronInfo } from "@dfinity/nns";
import { isNullish, nonNullish } from "@dfinity/utils";

const cacheExpirationDurationSeconds = 5 * SECONDS_IN_MINUTE;

interface NeuronsCache {
  neurons: NeuronInfo[];
  // When the neurons were cached.
  timestampSeconds: number;
  // The principal of the identity for which the neurons were cached.
  principalText: string;
}

let neuronsCache: NeuronsCache | null = null;

export const clearCache = () => {
  neuronsCache = null;
};

const hasValidCachedNeurons = (identity: Identity): boolean => {
  if (isNullish(neuronsCache)) {
    return false;
  }
  if (
    nowInSeconds() - neuronsCache.timestampSeconds >
    cacheExpirationDurationSeconds
  ) {
    return false;
  }
  return neuronsCache.principalText === identity.getPrincipal().toText();
};

const clearCacheAfter = async <R>(promise: Promise<R>) => {
  let result: R;
  try {
    result = await promise;
  } finally {
    clearCache();
  }
  return result;
};

// Should be called in between tests to clean up state.
export const resetNeuronsApiService = () => {
  clearCache();
};

export const governanceApiService = {
  // Read calls
  queryKnownNeurons(params: ApiQueryParams) {
    return queryKnownNeurons(params);
  },
  queryNeuron(params: ApiQueryNeuronParams) {
    return queryNeuron(params);
  },
  async queryNeurons(params: ApiQueryParams) {
    if (nonNullish(neuronsCache) && hasValidCachedNeurons(params.identity)) {
      return neuronsCache.neurons;
    }
    const promise = queryNeurons(params);
    if (!params.certified) {
      return promise;
    }
    neuronsCache = {
      neurons: await promise,
      timestampSeconds: nowInSeconds(),
      principalText: params.identity.getPrincipal().toText(),
    };
    return neuronsCache.neurons;
  },

  // Action calls
  async addHotkey(params: ApiManageHotkeyParams) {
    return clearCacheAfter(addHotkey(params));
  },
  autoStakeMaturity(params: ApiAutoStakeMaturityParams) {
    return clearCacheAfter(autoStakeMaturity(params));
  },
  claimOrRefreshNeuron(params: ApiManageNeuronParams) {
    return clearCacheAfter(claimOrRefreshNeuron(params));
  },
  disburse(params: ApiDisburseParams) {
    return clearCacheAfter(disburse(params));
  },
  increaseDissolveDelay(params: ApiIncreaseDissolveDelayParams) {
    return clearCacheAfter(increaseDissolveDelay(params));
  },
  joinCommunityFund(params: ApiManageNeuronParams) {
    return clearCacheAfter(joinCommunityFund(params));
  },
  leaveCommunityFund(params: ApiManageNeuronParams) {
    return clearCacheAfter(leaveCommunityFund(params));
  },
  // @deprecated
  mergeMaturity(params: ApiMergeMaturityParams) {
    return clearCacheAfter(mergeMaturity(params));
  },
  mergeNeurons(params: ApiMergeNeuronsParams) {
    return clearCacheAfter(mergeNeurons(params));
  },
  removeHotkey(params: ApiManageHotkeyParams) {
    return clearCacheAfter(removeHotkey(params));
  },
  setFollowees(params: ApiSetFolloweesParams) {
    return clearCacheAfter(setFollowees(params));
  },
  spawnNeuron(params: ApiSpawnNeuronParams) {
    return clearCacheAfter(spawnNeuron(params));
  },
  splitNeuron(params: ApiSplitNeuronParams) {
    return clearCacheAfter(splitNeuron(params));
  },
  stakeMaturity(params: ApiStakeMaturityParams) {
    return clearCacheAfter(stakeMaturity(params));
  },
  stakeNeuron(params: ApiStakeNeuronParams) {
    return clearCacheAfter(stakeNeuron(params));
  },
  startDissolving(params: ApiManageNeuronParams) {
    return clearCacheAfter(startDissolving(params));
  },
  stopDissolving(params: ApiManageNeuronParams) {
    return clearCacheAfter(stopDissolving(params));
  },
};