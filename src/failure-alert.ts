type FailureKind = "d1-insert" | "notify";

// The ping runs in waitUntil after the donor already has a response; bound it
// so a hung healthchecks.io endpoint can't hold the invocation open.
const PING_TIMEOUT_MS = 5_000;

// Mutable transport so Worker-isolate tests can stub outbound requests.
export const failureAlert = {
  send: (url: string, init: RequestInit) => fetch(url, init),
};

export function reportFailure(env: Env, ctx: Pick<ExecutionContext, "waitUntil">, kind: FailureKind): void {
  const url = env.HC_FAIL_URL;
  if (!url) return;

  ctx.waitUntil(
    Promise.resolve()
      .then(() => failureAlert.send(url, { method: "POST", body: kind, signal: AbortSignal.timeout(PING_TIMEOUT_MS) }))
      .then((response) => {
        // A failed ping means no alert reaches the maintainer, so leave a trace.
        if (!response.ok) console.error(`Failure alert ping for ${kind} returned HTTP ${response.status}`);
      })
      .catch((err) => {
        console.error(`Failure alert ping for ${kind} failed`, err);
      }),
  );
}
