import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { failureAlert, reportFailure } from "../src/failure-alert";

const realSend = failureAlert.send;

function context() {
  const pending: Promise<unknown>[] = [];
  return {
    ctx: { waitUntil: (promise: Promise<unknown>) => void pending.push(promise) },
    settled: () => Promise.all(pending),
  };
}

beforeEach(() => {
  failureAlert.send = vi.fn().mockResolvedValue(new Response("OK"));
});

afterEach(() => {
  failureAlert.send = realSend;
  vi.restoreAllMocks();
});

describe("reportFailure", () => {
  it("does nothing without HC_FAIL_URL", async () => {
    const { ctx, settled } = context();
    reportFailure({ ...env, HC_FAIL_URL: undefined } as Env, ctx, "notify");
    await settled();
    expect(failureAlert.send).not.toHaveBeenCalled();
  });

  it("POSTs the failure kind with a timeout signal", async () => {
    const { ctx, settled } = context();
    reportFailure(env, ctx, "d1-insert");
    await settled();
    expect(failureAlert.send).toHaveBeenCalledExactlyOnceWith(
      "test-fail-url",
      expect.objectContaining({ method: "POST", body: "d1-insert", signal: expect.any(AbortSignal) }),
    );
  });

  it("logs a non-2xx ping response instead of ignoring it", async () => {
    failureAlert.send = vi.fn().mockResolvedValue(new Response("nope", { status: 404 }));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { ctx, settled } = context();
    reportFailure(env, ctx, "notify");
    await settled();
    expect(error).toHaveBeenCalledWith("Failure alert ping for notify returned HTTP 404");
  });

  it("logs and swallows a rejected ping", async () => {
    failureAlert.send = vi.fn().mockRejectedValue(new Error("timed out"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { ctx, settled } = context();
    reportFailure(env, ctx, "notify");
    await expect(settled()).resolves.toBeDefined();
    expect(error).toHaveBeenCalledWith("Failure alert ping for notify failed", expect.any(Error));
  });
});
