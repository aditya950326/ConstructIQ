"use client";

import React, { useState, useEffect } from "react";
import { mediaStorage } from "@/lib/storage/media-storage";
import { Video, FileText, Image as ImageIcon } from "lucide-react";

export function useResolvedMediaUrl(path: string | undefined): string | null {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(path || null);

  useEffect(() => {
    let isCancelled = false;

    if (!path) {
      setResolvedUrl(null);
      return;
    }

    if (path.startsWith("indexeddb://")) {
      const mediaId = path.replace("indexeddb://", "");
      mediaStorage.getFileUrl(mediaId).then((url) => {
        if (!isCancelled && url) {
          setResolvedUrl(url);
        }
      });
    } else {
      setResolvedUrl(path);
    }

    return () => {
      isCancelled = true;
    };
  }, [path]);

  return resolvedUrl;
}

interface MediaDisplayProps {
  filePath: string;
  mediaType: "video" | "photo" | "document" | "drawing" | "inspection_sheet";
  alt?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

export function ResolvedMedia({
  filePath,
  mediaType,
  alt = "Site evidence",
  className = "w-full h-full object-cover",
  controls = false,
  autoPlay = false,
  muted = false,
}: MediaDisplayProps) {
  const resolvedUrl = useResolvedMediaUrl(filePath);

  if (!resolvedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400 text-xs font-mono">
        Loading site media...
      </div>
    );
  }

  if (mediaType === "video" || resolvedUrl.endsWith(".mp4") || resolvedUrl.includes("video")) {
    return (
      <video
        src={resolvedUrl}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        className={className}
      >
        Your browser does not support HTML5 video playback.
      </video>
    );
  }

  if (
    mediaType === "photo" ||
    resolvedUrl.startsWith("http") ||
    resolvedUrl.startsWith("blob:") ||
    resolvedUrl.startsWith("data:")
  ) {
    return <img src={resolvedUrl} alt={alt} className={className} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-300 p-4">
      <FileText className="w-12 h-12 text-construct-orange mb-2" />
      <span className="font-mono text-xs">{alt}</span>
    </div>
  );
}
