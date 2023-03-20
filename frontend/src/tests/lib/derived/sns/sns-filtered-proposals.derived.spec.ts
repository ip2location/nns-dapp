import { snsFilteredProposalsStore } from "$lib/derived/sns/sns-filtered-proposals.derived";
import { snsFiltesStore } from "$lib/stores/sns-filters.store";
import { snsProposalsStore } from "$lib/stores/sns-proposals.store";
import { mockPrincipal } from "$tests/mocks/auth.store.mock";
import {
  createSnsProposal,
  mockSnsProposal,
} from "$tests/mocks/sns-proposals.mock";
import { SnsProposalDecisionStatus, type SnsProposalData } from "@dfinity/sns";
import { get } from "svelte/store";

describe("snsFilteredProposalsStore", () => {
  const snsProposal1: SnsProposalData = {
    ...mockSnsProposal,
    id: [{ id: BigInt(2) }],
  };
  const snsProposal2: SnsProposalData = {
    ...mockSnsProposal,
    id: [{ id: BigInt(2) }],
  };
  const snsProposal3: SnsProposalData = {
    ...mockSnsProposal,
    id: [{ id: BigInt(3) }],
  };

  beforeEach(() => {
    snsFiltesStore.reset();
    snsProposalsStore.reset();
  });
  it("should return undefined if filter store is not loaded", () => {
    const rootCanisterId = mockPrincipal;
    const proposals: SnsProposalData[] = [
      snsProposal1,
      snsProposal2,
      snsProposal3,
    ];
    snsProposalsStore.setProposals({
      rootCanisterId,
      proposals,
      certified: true,
      completed: true,
    });

    expect(
      get(snsFilteredProposalsStore)[rootCanisterId.toText()]
    ).toBeUndefined();
  });

  it("should return all proposals if no decisions filter is checked", () => {
    const rootCanisterId = mockPrincipal;
    const proposals: SnsProposalData[] = [
      snsProposal1,
      snsProposal2,
      snsProposal3,
    ];
    snsProposalsStore.setProposals({
      rootCanisterId,
      proposals,
      certified: true,
      completed: true,
    });
    const decisionStatus = [
      {
        id: "1",
        name: "status-1",
        value: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_OPEN,
        checked: false,
      },
      {
        id: "2",
        name: "status-2",
        value: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_ADOPTED,
        checked: false,
      },
    ];
    snsFiltesStore.setDecisionStatus({
      rootCanisterId,
      decisionStatus,
    });

    expect(
      get(snsFilteredProposalsStore)[rootCanisterId.toText()].proposals
    ).toHaveLength(proposals.length);
  });

  it("should return open proposals if Open status is checked", () => {
    const rootCanisterId = mockPrincipal;
    const openProposal = createSnsProposal({
      proposalId: BigInt(2),
      status: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_OPEN,
    });
    const failedProposal1 = createSnsProposal({
      proposalId: BigInt(3),
      status: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_FAILED,
    });
    const failedProposal2 = createSnsProposal({
      proposalId: BigInt(4),
      status: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_FAILED,
    });
    const proposals: SnsProposalData[] = [
      failedProposal1,
      openProposal,
      failedProposal2,
    ];
    snsProposalsStore.setProposals({
      rootCanisterId,
      proposals,
      certified: true,
      completed: true,
    });
    const decisionStatus = [
      {
        id: "1",
        name: "status-1",
        value: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_OPEN,
        checked: true,
      },
      {
        id: "2",
        name: "status-2",
        value: SnsProposalDecisionStatus.PROPOSAL_DECISION_STATUS_ADOPTED,
        checked: false,
      },
    ];
    snsFiltesStore.setDecisionStatus({
      rootCanisterId,
      decisionStatus,
    });

    expect(
      get(snsFilteredProposalsStore)[rootCanisterId.toText()].proposals
    ).toHaveLength(1);
  });
});