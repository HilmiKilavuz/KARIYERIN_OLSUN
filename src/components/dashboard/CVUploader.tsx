"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useAnalysisStore } from "@/stores/useAnalysisStore";

export default function CVUploader({ className }: { className?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { uploadCV, status } = useAnalysisStore();

  const onFiles = useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    await uploadCV(file);
  }, [uploadCV]);

  const isLoading = status === "uploading" || status === "analyzing";

  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors",
        dragOver ? "border-primary bg-primary/10" : "border-white/15 hover:border-primary/60",
        isLoading && "opacity-70 cursor-not-allowed",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label="CV yükleme alanı"
      aria-busy={isLoading}
      onKeyDown={(e) => {
        if (!isLoading && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onClick={() => !isLoading && inputRef.current?.click()}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!isLoading) onFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
        disabled={isLoading}
      />
      <p className="text-accent/90">
        <span className="font-semibold text-accent">CV&apos;nizi</span> buraya sürükleyin
        <span className="text-accent/70"> veya </span>
        <span className="underline">tıklayarak seçin</span>
      </p>
      {isLoading ? (
        <p className="mt-1 text-xs text-muted">Yükleniyor, lütfen bekleyin...</p>
      ) : (
        <p className="mt-1 text-xs text-muted">PDF / DOC / DOCX</p>
      )}
    </div>
  );
}
