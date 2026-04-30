import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { allDocs, getChapterForDoc } from "@/lib/docs";

type Hit = {
  slug: string;
  title: string;
  prompt: string;
  summary: string;
  chapter: string;
  excerpt?: string;
};

function buildIndex() {
  const items = allDocs.map((d) => {
    const chapter = getChapterForDoc(d.slug)?.label || "";
    return {
      slug: d.slug,
      title: d.title,
      prompt: d.prompt,
      summary: d.summary,
      chapter,
      content: d.content.replace(/```[\s\S]*?```/g, " "),
    };
  });
  return new Fuse(items, {
    keys: [
      { name: "title", weight: 0.35 },
      { name: "summary", weight: 0.2 },
      { name: "chapter", weight: 0.05 },
      { name: "content", weight: 0.4 },
    ],
    includeMatches: true,
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

export default function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const fuse = useMemo(buildIndex, []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const results: Hit[] = useMemo(() => {
    if (!q.trim()) {
      return allDocs.slice(0, 8).map((d) => ({
        slug: d.slug,
        title: d.title,
        prompt: d.prompt,
        summary: d.summary,
        chapter: getChapterForDoc(d.slug)?.label || "",
      }));
    }
    return fuse.search(q, { limit: 12 }).map((r) => {
      const contentMatch = r.matches?.find((m) => m.key === "content");
      let excerpt: string | undefined;
      if (contentMatch && contentMatch.value && contentMatch.indices.length) {
        const [start, end] = contentMatch.indices[0];
        const from = Math.max(0, start - 60);
        const to = Math.min(contentMatch.value.length, end + 80);
        excerpt = (from > 0 ? "…" : "") + contentMatch.value.slice(from, to).replace(/\s+/g, " ").trim();
      }
      return {
        slug: r.item.slug,
        title: r.item.title,
        prompt: r.item.prompt,
        summary: r.item.summary,
        chapter: r.item.chapter,
        excerpt,
      };
    });
  }, [q, fuse]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function go(slug: string) {
    onOpenChange(false);
    navigate(`/docs/${slug}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) go(hit.slug);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-[oklch(0.14_0.005_260)] border-border">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search architecture, schema, routes, components…"
            className="flex-1 bg-transparent text-[14.5px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-[10.5px] font-mono px-1.5 py-0.5 rounded border border-border bg-background/50 text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto doc-scroll py-2">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">
              No matches for <span className="text-foreground">"{q}"</span>.
            </div>
          ) : (
            <ul className="px-2">
              {results.map((hit, i) => (
                <li key={hit.slug}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit.slug)}
                    className={
                      "w-full text-left px-3 py-3 rounded-md transition-colors " +
                      (i === active
                        ? "bg-[oklch(0.19_0.005_260)] ring-1 ring-primary/30"
                        : "hover:bg-[oklch(0.17_0.005_260)]")
                    }
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-primary/80">
                        Prompt {hit.prompt}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {hit.chapter}
                      </span>
                    </div>
                    <div className="display text-[15px] text-foreground">{hit.title}</div>
                    <div className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2">
                      {hit.excerpt || hit.summary}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between px-4 h-10 border-t border-border text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-background/50">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-background/50">↑↓</kbd>
              Navigate
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
