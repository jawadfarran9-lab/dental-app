// One-shot signal: Starred asks the chat to scroll to + highlight a specific message after popping back.
let pendingFocusId: string | null = null;

export function requestFocusMessage(id: string): void {
  pendingFocusId = id;
}

export function consumeFocusMessage(): string | null {
  const v = pendingFocusId;
  pendingFocusId = null;
  return v;
}
