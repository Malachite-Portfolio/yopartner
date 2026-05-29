"use client";

import { useEffect, useMemo, useState } from "react";
import { GiftPlayer } from "@/components/chat/GiftPlayer";

type TestState = {
  url: string;
  fetchStatus: "pending" | "ok" | "error";
  headStatus: number | null;
  getStatus: number | null;
  contentType: string | null;
  fileSize: number | null;
  fetchError: string | null;
  playerStatus: "idle" | "loading" | "ready" | "completed" | "error";
  playerError: string | null;
};

const TEST_URLS = [
  "/gifts/svga/gift-001.svga",
  "/gifts/svga/gift-010.svga",
  "/gifts/svga/gift-020.svga",
  "/gifts/svga/gift-037.svga",
];

function initialState(url: string): TestState {
  return {
    url,
    fetchStatus: "pending",
    headStatus: null,
    getStatus: null,
    contentType: null,
    fileSize: null,
    fetchError: null,
    playerStatus: "loading",
    playerError: null,
  };
}

export default function SvgatestPage() {
  const [tests, setTests] = useState<TestState[]>(() => TEST_URLS.map((url) => initialState(url)));

  useEffect(() => {
    let active = true;

    const runFetchDiagnostics = async (url: string, index: number) => {
      try {
        const head = await fetch(url, { method: "HEAD", cache: "no-store" });
        const get = await fetch(url, { method: "GET", cache: "no-store" });
        const buffer = await get.arrayBuffer();
        if (!active) return;

        setTests((current) =>
          current.map((item, i) =>
            i === index
              ? {
                  ...item,
                  fetchStatus: head.ok && get.ok ? "ok" : "error",
                  headStatus: head.status,
                  getStatus: get.status,
                  contentType: head.headers.get("content-type") ?? get.headers.get("content-type"),
                  fileSize: buffer.byteLength,
                  fetchError: head.ok && get.ok ? null : `HEAD ${head.status}, GET ${get.status}`,
                }
              : item,
          ),
        );
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to fetch SVGA file.";
        setTests((current) =>
          current.map((item, i) =>
            i === index
              ? {
                  ...item,
                  fetchStatus: "error",
                  fetchError: message,
                }
              : item,
          ),
        );
      }
    };

    TEST_URLS.forEach((url, index) => {
      void runFetchDiagnostics(url, index);
    });

    return () => {
      active = false;
    };
  }, []);

  const allReady = useMemo(
    () => tests.every((item) => item.playerStatus === "ready" || item.playerStatus === "completed"),
    [tests],
  );

  return (
    <main className="min-h-screen bg-[#eef3f8] p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4">
          <h1 className="text-xl font-semibold text-slate-900">SVGA Compatibility Test</h1>
          <p className="mt-1 text-sm text-slate-600">Verifies fetch metadata and real player load/play status.</p>
          <p className={`mt-2 text-sm font-semibold ${allReady ? "text-emerald-700" : "text-amber-700"}`}>
            Player summary: {allReady ? "All test files rendered." : "Some files are still failing."}
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test, index) => (
            <section key={test.url} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Test {index + 1}</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-700">{test.url}</p>

              <div className="mt-3 h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <GiftPlayer
                  src={test.url}
                  className="h-full w-full"
                  loop={1}
                  timeoutMs={12000}
                  onReady={() => {
                    setTests((current) =>
                      current.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              playerStatus: "ready",
                              playerError: null,
                            }
                          : item,
                      ),
                    );
                  }}
                  onComplete={() => {
                    setTests((current) =>
                      current.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              playerStatus: "completed",
                            }
                          : item,
                      ),
                    );
                  }}
                  onError={(message) => {
                    if (process.env.NODE_ENV !== "production") {
                      console.warn("[svga-test] player error", { url: test.url, error: message });
                    }
                    setTests((current) =>
                      current.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              playerStatus: "error",
                              playerError: message,
                            }
                          : item,
                      ),
                    );
                  }}
                />
              </div>

              <dl className="mt-3 space-y-1 text-xs text-slate-700">
                <div className="flex justify-between gap-3">
                  <dt>Fetch Status</dt>
                  <dd>{test.fetchStatus}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>HEAD Status</dt>
                  <dd>{test.headStatus ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>GET Status</dt>
                  <dd>{test.getStatus ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Content-Type</dt>
                  <dd className="truncate">{test.contentType ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>File Size</dt>
                  <dd>{test.fileSize != null ? `${test.fileSize.toLocaleString()} bytes` : "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Player Result</dt>
                  <dd>{test.playerStatus}</dd>
                </div>
              </dl>

              {test.fetchError ? (
                <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  Fetch error: {test.fetchError}
                </p>
              ) : null}
              {test.playerError ? (
                <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  Player error: {test.playerError}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
