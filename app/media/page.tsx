"use client";

import { useMemo, useState } from "react";
import { MediaCard } from "@/components/MediaCard";
import { mediaArticles, mediaPodcasts } from "@/lib/data";

type MediaTab = "articles" | "podcasts";

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<MediaTab>("articles");

  const articleItems = useMemo(() => mediaArticles.filter((item) => item.type === "article"), []);
  const isArticles = activeTab === "articles";

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-500">In the News</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">Media &amp; Publications</h1>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[#FACC15]" />

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("articles")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                isArticles ? "bg-black text-white" : "border border-black bg-white text-black"
              }`}
            >
              Articles &amp; News
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("podcasts")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                !isArticles ? "bg-black text-white" : "border border-black bg-white text-black"
              }`}
            >
              Podcasts
            </button>
          </div>
        </div>

        {isArticles ? (
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {articleItems.map((article) => (
              <MediaCard key={article.id} item={article} variant="article" />
            ))}
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {mediaPodcasts.map((podcast) => (
              <MediaCard key={podcast.id} item={podcast} variant="podcast" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
