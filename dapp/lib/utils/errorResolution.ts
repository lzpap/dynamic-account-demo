// MoveAbort code for duplicate transaction proposal in the transactions module
const TX_ALREADY_PROPOSED_ABORT_CODE = "13835339839496650755";

export function isTxAlreadyProposedError(error: any): boolean {
  if (typeof error === "string") {
    return (
      error.includes(TX_ALREADY_PROPOSED_ABORT_CODE)
    );
  }
  if (error instanceof Error) {
    return (
      error.message.includes(TX_ALREADY_PROPOSED_ABORT_CODE)
    );
  }
  return false;
}