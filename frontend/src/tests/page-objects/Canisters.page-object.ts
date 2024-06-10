import { CanisterCardPo } from "$tests/page-objects/CanisterCard.page-object";
import { CreateCanisterModalPo } from "$tests/page-objects/CreateCanisterModal.page-object";
import { HashPo } from "$tests/page-objects/Hash.page-object";
import { BasePageObject } from "$tests/page-objects/base.page-object";
import type { PageObjectElement } from "$tests/types/page-object.types";

export class CanistersPo extends BasePageObject {
  private static readonly TID = "canisters-component";

  static under(element: PageObjectElement): CanistersPo {
    return new CanistersPo(element.byTestId(CanistersPo.TID));
  }

  getCanisterCardPos(): Promise<CanisterCardPo[]> {
    return CanisterCardPo.allUnder(this.root);
  }

  getCreateCanisterModalPo(): CreateCanisterModalPo {
    return CreateCanisterModalPo.under(this.root);
  }

  getHashPo(): HashPo {
    return HashPo.under(this.root);
  }

  getPrincipal(): Promise<string> {
    return this.getHashPo().getFullText();
  }

  clickCreate(): Promise<void> {
    return this.click("create-canister-button");
  }

  async createCanister({
    name,
    icpAmount,
  }: {
    name: string;
    icpAmount: string;
  }): Promise<void> {
    await this.clickCreate();
    const modal = this.getCreateCanisterModalPo();
    await modal.createCanister({ name, icpAmount });
    await modal.waitForClosed();
  }
}
