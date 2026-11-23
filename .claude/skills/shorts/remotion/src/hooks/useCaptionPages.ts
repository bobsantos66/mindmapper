import { useMemo } from "react";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "../types";

/**
 * Converts word-level captions into TikTok-style pages using
 * @remotion/captions createTikTokStyleCaptions().
 *
 * Each page groups N words together based on combineTokensWithinMilliseconds.
 * Returns pages with: text, startMs, durationMs, tokens[{text, fromMs, toMs}]
 */
export const useCaptionPages = (
  captions: Caption[],
  combineMs: number = 800
) => {
  return useMemo(() => {
    if (!captions || captions.length === 0) return [];

    // Convert our Caption format to Remotion's expected format
    const remotionCaptions = captions.map((c) => ({
      text: c.text,
      startMs: c.startMs,
      endMs: c.endMs,
      timestampMs: null as number | null,
      confidence: null as number | null,
    }));

    // A page never spans a sentence end (. ? !), so lines from different
    // speakers or sentences are not shown together.
    const sentences: (typeof remotionCaptions)[] = [[]];
    for (const c of remotionCaptions) {
      sentences[sentences.length - 1].push(c);
      if (/[.?!…]["')\]]*\s*$/.test(c.text)) sentences.push([]);
    }

    return sentences
      .filter((s) => s.length > 0)
      .flatMap(
        (s) =>
          createTikTokStyleCaptions({
            captions: s,
            combineTokensWithinMilliseconds: combineMs,
          }).pages
      );
  }, [captions, combineMs]);
};
