import type { DerEncodedBlob, Principal } from "@dfinity/agent";
import { Doms } from "../ledger/model";
import { Option } from "../option";

export type Action =
    { ExternalUpdate: ExternalUpdate } |
    { ManageNeuron: ManageNeuron } |
    { ApproveKyc: ApproveKyc } |
    { NetworkEconomics: NetworkEconomics } |
    { RewardNodeProvider: RewardNodeProvider } |
    { AddOrRemoveNodeProvider: AddOrRemoveNodeProvider } |
    { Motion: Motion };
export interface AddHotKey { newHotKey: Principal };
export interface AddOrRemoveNodeProvider { change: Change };
export interface ApproveKyc { principals: Array<Principal> };
export type AuthzChangeOp = { Authorize: { addSelf: boolean } } |
    { Deauthorize: null };
export interface Ballot { neuronId: bigint, vote: Vote, votingPower: bigint };
export interface BallotInfo {
    vote: Vote,
    proposalId: ProposalId,
};
export interface CanisterAuthzInfo { methodsAuthz: Array<MethodAuthzInfo> };
export type Change = { ToRemove: NodeProvider } |
    { ToAdd: NodeProvider };
export type Command = 
    { Spawn: Spawn } |
    { Split: Split } |
    { Follow: Follow } |
    { Configure: Configure } |
    { RegisterVote: RegisterVote } |
    { DisburseToNeuron: DisburseToNeuron } |
    { MakeProposal: Proposal } |
    { Disburse: Disburse };
export interface Configure { operation: Operation };
export interface Disburse {
    toSubaccountId: Option<number>,
    amount: Doms,
};
export interface DisburseResponse { transferBlockHeight: bigint };
export interface DisburseToNeuron {
    dissolveDelaySeconds: bigint,
    kycVerified: boolean,
    amount: Doms,
    newController: Option<Principal>,
    nonce: bigint,
};
export type DissolveState = { DissolveDelaySeconds: bigint } |
    { WhenDissolvedTimestampSeconds: bigint };
export interface ExternalUpdate {
    updateType: number,
    payload: ArrayBuffer,
};
export interface Follow { topic: Topic, followees: Array<NeuronId> };
export interface Followees { topic: Topic, followees: Array<NeuronId> };
export interface GovernanceError {
    errorMessage: string,
    errorType: number,
};
export interface IncreaseDissolveDelay {
    additionalDissolveDelaySeconds: number,
};
export interface ListProposalsRequest {
    // Limit on the number of [ProposalInfo] to return. If no value is
    // specified, or if a value greater than 100 is specified, 100
    // will be used.
    limit : number,

    // If specified, only return proposals that are stricty earlier than
    // the specified proposal according to the proposal ID. If not
    // specified, start with the most recent proposal.    
    beforeProposal : Option<ProposalId>,
    
    // Include proposals that have a reward status in this list (see
    // [ProposalRewardStatus] for more information). If this list is
    // empty, no restriction is applied. For example, many users listing
    // proposals will only be interested in proposals for which they can
    // receive voting rewards, i.e., with reward status
    // PROPOSAL_REWARD_STATUS_ACCEPT_VOTES.    
    includeRewardStatus : Array<ProposalRewardStatus>,

    // Exclude proposals with a topic in this list. This is particularly
    // useful to exclude proposals on the topics TOPIC_EXCHANGE_RATE and
    // TOPIC_KYC which most users are not likely to be interested in
    // seeing    
    excludeTopic : Array<Topic>,

    // Include proposals that have a status in this list (see
    // [ProposalStatus] for more information). If this list is empty, no
    // restriction is applied.    
    includeStatus : Array<ProposalStatus>,
};
export interface ListProposalsResponse {
    proposals : Array<ProposalInfo>,
};
export interface MakeProposalResponse { proposalId: ProposalId };
export interface ManageNeuron {
    id: NeuronId,
    command: Command,
};
export interface MethodAuthzChange {
    principal: Option<Principal>,
    methodName: string,
    canister: Principal,
    operation: AuthzChangeOp,
};
export interface MethodAuthzInfo {
    methodName: string,
    principalIds: Array<ArrayBuffer>,
};
export interface Motion { motionText: string };
export interface NetworkEconomics {
    rejectCost: Doms,
    manageNeuronCostPerProposal: Doms,
    neuronMinimumStake: Doms,
    maximumNodeProviderRewards : Doms,
    neuronSpawnDissolveDelaySeconds: bigint,
};
export interface Neuron {
    id: NeuronId,
    controller: Principal,
    recentBallots: Array<BallotInfo>,
    kycVerified: boolean,
    notForProfit: boolean,
    cachedNeuronStake: Doms,
    createdTimestampSeconds: bigint,
    maturityDomsEquivalent: bigint,
    agingSinceTimestampSeconds: bigint,
    neuronFees: Doms,
    hotKeys: Array<Principal>,
    accountPrincipal: ArrayBuffer,
    dissolveState: DissolveState,
    followees: Array<Followees>,
    transfer: NeuronStakeTransfer,
};
export type NeuronId = bigint;
export enum NeuronState {
	UNSPECIFIED = 0,
	LOCKED = 1,
	DISSOLVING = 2,
	DISSOLVED = 3
}
export interface NeuronInfo {
    neuronId: bigint,
    dissolveDelaySeconds: bigint,
    recentBallots: Array<BallotInfo>,
    createdTimestampSeconds: bigint,
    state: NeuronState,
    retrievedAtTimestampSeconds: bigint,
    votingPower: bigint,
    ageSeconds: bigint,
    fullNeuron: Neuron
};
export interface NeuronStakeTransfer {
    toSubaccount: ArrayBuffer,
    from: Option<Principal>,
    memo: bigint,
    neuronStake: Doms,
    fromSubaccount: ArrayBuffer,
    transferTimestamp: bigint,
    blockHeight: bigint,
};
export interface NodeProvider { id: Option<Principal> };
export type Operation = { RemoveHotKey: RemoveHotKey } |
    { AddHotKey: AddHotKey } |
    { StopDissolving: {} } |
    { StartDissolving: {} } |
    { IncreaseDissolveDelay: IncreaseDissolveDelay };
export interface Proposal {
    url: string,
    action: Option<Action>,
    summary: string,
};
export type ProposalId = bigint;

export interface ProposalInfo {
    id: ProposalId,
    ballots: Array<Ballot>,
    rejectCost: Doms,
    proposalTimestampSeconds: bigint,
    rewardEventRound: bigint,
    failedTimestampSeconds: bigint,
    decidedTimestampSeconds: bigint,
    latestTally: Tally,
    proposal: Proposal,
    proposer: NeuronId,
    executedTimestampSeconds: bigint,
};

// The proposal status, with respect to reward distribution.
// See also ProposalStatus.
export enum ProposalRewardStatus {
    PROPOSAL_REWARD_STATUS_UNKNOWN = 0,

    // The proposal still accept votes, for the purpose of
    // vote rewards. This implies nothing on the ProposalStatus.
    PROPOSAL_REWARD_STATUS_ACCEPT_VOTES = 1,

    // The proposal no longer accepts votes. It is due to settle
    // at the next reward event.
    PROPOSAL_REWARD_STATUS_READY_TO_SETTLE = 2,

    // The proposal has been taken into account in a reward event.
    PROPOSAL_REWARD_STATUS_SETTLED = 3,

    // The proposal is not eligible to be taken into account in a reward event.
    PROPOSAL_REWARD_STATUS_INELIGIBLE = 4
}

// The proposal status, with respect to decision making and execution.
// See also ProposalRewardStatus.
export enum ProposalStatus {
    PROPOSAL_STATUS_UNKNOWN = 0,
  
    // A decision (accept/reject) has yet to be made.
    PROPOSAL_STATUS_OPEN = 1,
  
    // The proposal has been rejected.
    PROPOSAL_STATUS_REJECTED = 2,
  
    // The proposal has been accepted. At this time, either execution
    // as not yet started, or it has but the outcome is not yet known.
    PROPOSAL_STATUS_ACCEPTED = 3,
  
    // The proposal was accepted and successfully executed.
    PROPOSAL_STATUS_EXECUTED = 4,
  
    // The proposal was accepted, but execution failed.
    PROPOSAL_STATUS_FAILED = 5
}

export enum Vote {
	UNSPECIFIED = 0,
	YES = 1,
	NO = 2
}  
export interface RegisterVote { vote: Vote, proposal: ProposalId };
export interface RemoveHotKey { hotKeyToRemove: Option<Principal> };

export type ClaimNeuronRequest = {
    publicKey: DerEncodedBlob,
    nonce: bigint,
    dissolveDelayInSecs: bigint
}

export type ClaimNeuronResponse = { Ok: bigint } |
    { Err: GovernanceError };
export type GetFullNeuronResponse = { Ok: Neuron } |
    { Err: GovernanceError };
export type GetNeuronInfoResponse = { Ok: NeuronInfo } |
    { Err: GovernanceError };
export interface RewardNodeProvider {
    nodeProvider : Option<NodeProvider>,
    amount : Doms,
};
export interface Spawn { newController: Option<Principal> };
export interface SpawnResponse { createdNeuronId: NeuronId };
export interface Split { amount: Doms };
export interface Tally {
    no: bigint,
    yes: bigint,
    total: bigint,
    timestampSeconds: bigint,
};
export enum Topic {
    // https://github.com/dfinity-lab/dfinity/blob/99289f7b58f22268d8575b94971655e8f4567a8a/rs/nns/governance/proto/ic_nns_governance/pb/v1/governance.proto#L26
    Unspecified = 0,
    ManageNeuron = 1,
    ExchangeRate = 2,
    NetworkEconomics = 3,
    Governance = 4,
    NodeAdmin = 5,
    ParticipantManagement = 6,
    SubnetManagement = 7,
    NetworkCanisterManagement = 8,
    Kyc = 9,
};

export interface AddHotKeyRequest {
    neuronId: NeuronId,
    principal: Principal
}

export interface RemoveHotKeyRequest {
    neuronId: NeuronId,
    principal: Principal
}

export interface StartDissolvingRequest {
    neuronId: NeuronId
}

export interface StopDissolvingRequest {
    neuronId: NeuronId
}

export interface IncreaseDissolveDelayRequest {
    neuronId: NeuronId,
    additionalDissolveDelaySeconds: number
}

export interface FollowRequest { 
    neuronId: NeuronId,
    topic: Topic, 
    followees: Array<NeuronId> 
};

export interface RegisterVoteRequest {
    neuronId: NeuronId,
    vote: Vote, 
    proposal: ProposalId
}

export interface SpawnRequest {
    neuronId: NeuronId,
    newController: Option<Principal>
}

export interface SplitRequest {
    neuronId: NeuronId,
    amount: Doms
}

export interface DisburseRequest {
    neuronId: NeuronId,
    amount: Doms
    // Should be an AccountIdentifier
    toSubaccountId: Option<number>,
}

export interface DisburseToNeuronRequest {
    neuronId: NeuronId,
    dissolveDelaySeconds: bigint,
    kycVerified: boolean,
    amount: Doms,
    newController: Option<Principal>,
    nonce: bigint
}

export interface MakeMotionProposalRequest {
    neuronId: NeuronId,
    url: string,
    text: string
    summary: string
}

export interface DisburseToNeuronResponse { createdNeuronId: NeuronId };
export interface SpawnResponse { createdNeuronId: NeuronId };
export type SpawnResult = { Ok: SpawnResponse } | { Err: GovernanceError };
export type DisburseResult = { Ok: DisburseResponse } | { Err: GovernanceError };
export type DisburseToNeuronResult = { Ok: DisburseToNeuronResponse } | { Err: GovernanceError };
export type MakeProposalResult = { Ok: MakeProposalResponse } | { Err: GovernanceError };

export type EmptyResponse = { Ok: null } | { Err: GovernanceError };

export default interface ServiceInterface {
    claimNeuron: (request: ClaimNeuronRequest) => Promise<ClaimNeuronResponse>,
    getNeurons: () => Promise<Array<NeuronInfo>>,
    getPendingProposals: () => Promise<Array<ProposalInfo>>,
    getProposalInfo: (proposalId: bigint) => Promise<Option<ProposalInfo>>,
    listProposals: (request: ListProposalsRequest) => Promise<ListProposalsResponse>,
    addHotKey: (request: AddHotKeyRequest) => Promise<EmptyResponse>,
    removeHotKey: (request: RemoveHotKeyRequest) => Promise<EmptyResponse>,
    startDissolving: (request: StartDissolvingRequest) => Promise<EmptyResponse>,
    stopDissolving: (request: StopDissolvingRequest) => Promise<EmptyResponse>,
    increaseDissolveDelay: (request: IncreaseDissolveDelayRequest) => Promise<EmptyResponse>,
    follow: (request: FollowRequest) => Promise<EmptyResponse>,
    registerVote: (request: RegisterVoteRequest) => Promise<EmptyResponse>,
    spawn: (request: SpawnRequest) => Promise<SpawnResult>,
    split: (request: SplitRequest) => Promise<EmptyResponse>,
    disburse: (request: DisburseRequest) => Promise<DisburseResult>,
    disburseToNeuron: (request: DisburseToNeuronRequest) => Promise<DisburseToNeuronResult>,
    makeMotionProposal: (request: MakeMotionProposalRequest) => Promise<MakeProposalResult>,
};
