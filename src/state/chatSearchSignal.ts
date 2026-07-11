// One-shot signal: Patient-info asks the chat to open its search bar after router.back().
let pendingOpenSearch = false;

export function requestOpenSearch(): void {
  pendingOpenSearch = true;
}

export function consumeOpenSearch(): boolean {
  const v = pendingOpenSearch;
  pendingOpenSearch = false;
  return v;
}
