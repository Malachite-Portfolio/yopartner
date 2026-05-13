"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { ClientDiaryCard } from "@/components/ClientDiaryCard";
import { clientDiaries, type ClientDiary } from "@/lib/data";

export default function ClientDiariesPage() {
  const [previewDiary, setPreviewDiary] = useState<ClientDiary | null>(null);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 pb-14 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Client Diaries</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          Real stories from real people who found comfort and connection.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {clientDiaries.map((diary) => (
          <ClientDiaryCard key={diary.id} diary={diary} onPreview={setPreviewDiary} />
        ))}
      </div>

      {previewDiary ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">{previewDiary.title}</h2>
              <button
                type="button"
                onClick={() => setPreviewDiary(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                aria-label="Close story preview"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">Video story preview will be added later.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
