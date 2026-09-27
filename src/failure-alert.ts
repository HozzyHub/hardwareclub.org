type FailureKind = "d1-insert" | "notify";

// Mutable transport so Worker-isolate tests can stub outbound requests.
export const failureAlert = {
  send: (url: string, init: RequestInit) => fetch(url, init),
};

export function reportFailure(env: Env, ctx: Pick<ExecutionContext, "waitUntil">, kind: FailureKind): void {
  const url = env.HC_FAIL_URL;
  if (!url) return;

  ctx.waitUntil(
    Promise.resolve()
      .then(() => failureAlert.send(url, { method: "POST", body: kind }))
      .then(() => undefined)
      .catch(() => undefined),
  );
}
