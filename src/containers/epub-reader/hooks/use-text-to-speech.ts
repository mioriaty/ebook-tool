import { useState, useEffect, useCallback, useRef } from "react";
import type { Rendition } from "epubjs";

export function useTextToSpeech(
  renditionRef: React.RefObject<Rendition | null>,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [language, setLanguage] = useState<"en" | "vi">("vi");

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isAutoPlayingRef = useRef(false);

  // Load available voices
  useEffect(() => {
    if (!synth) return;
    const updateVoices = () => {
      const v = synth.getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        // Try to find a voice matching the current language first
        const targetVoice = v.find((voice) => voice.lang.startsWith(language));
        const defaultVoice = v.find((voice) => voice.default);
        setSelectedVoice(targetVoice || defaultVoice || v[0]);
      }
    };

    updateVoices();
    synth.onvoiceschanged = updateVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [synth, selectedVoice, language]);

  // Update selected voice when language changes manually
  const changeLanguage = useCallback(
    (lang: "en" | "vi") => {
      setLanguage(lang);
      if (voices.length > 0) {
        const targetVoice = voices.find((voice) => voice.lang.startsWith(lang));
        const defaultVoice = voices.find((voice) => voice.default);
        setSelectedVoice(targetVoice || defaultVoice || voices[0]);
      }
    },
    [voices],
  );

  const extractCurrentPageText = useCallback((): string | null => {
    if (!renditionRef.current) return null;
    const rendition = renditionRef.current;

    const l = rendition.currentLocation() as unknown as {
      start: { cfi: string };
      end: { cfi: string };
    };
    if (!l || !l.start || !l.end) return null;

    try {
      const startRange = rendition.getRange(l.start.cfi);
      const endRange = rendition.getRange(l.end.cfi);
      if (!startRange || !endRange) return null;

      const contentsArray = rendition.getContents() as unknown as {
        document: Document;
      }[];
      if (!contentsArray || contentsArray.length === 0) return null;

      const iframeDoc = contentsArray[0].document;
      const range = iframeDoc.createRange();
      range.setStart(startRange.startContainer, startRange.startOffset);
      range.setEnd(endRange.endContainer, endRange.endOffset);

      return range.toString().trim();
    } catch (error) {
      console.error("Failed to extract text from page:", error);
      return null;
    }
  }, [renditionRef]);

  const stop = useCallback(() => {
    if (synth) {
      synth.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      isAutoPlayingRef.current = false;
    }
  }, [synth]);

  // Use a ref to hold the play function so it can be called recursively inside onend

  const playRef = useRef<() => void>(() => {});

  const playCurrentPage = useCallback(() => {
    if (!synth) return;

    const text = extractCurrentPageText();
    if (!text) {
      stop();
      return;
    }

    // Chrome has a bug where it gets stuck if we don't cancel first
    synth.cancel();

    // Use a small timeout to let the cancel finish before we start speaking
    setTimeout(() => {
      // Chrome's SpeechSynthesis has a strict 15-second limit per utterance bug.
      // We should ideally chunk the text, but for now we let it play and see if cancel() fixed the immediate error.
      const utterance = new SpeechSynthesisUtterance(text);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Slightly reduce rate to improve stability on some engines
      utterance.rate = 1.0;

      utterance.onend = () => {
        if (isAutoPlayingRef.current && renditionRef.current) {
          renditionRef.current.next().then(() => {
            setTimeout(() => {
              if (isAutoPlayingRef.current && playRef.current) {
                playRef.current();
              }
            }, 800); // Increased delay to allow page render
          });
        } else {
          setIsPlaying(false);
          setIsPaused(false);
        }
      };

      utterance.onerror = (e) => {
        // Log more details about the error
        console.error("Speech synthesis error details:", {
          error: e.error,
          type: e.type,
          timeStamp: e.timeStamp,
        });

        // Don't auto-stop on certain non-fatal errors like 'interrupted' when we manually cancel
        if (e.error !== "interrupted" && e.error !== "canceled") {
          setIsPlaying(false);
          setIsPaused(false);
          isAutoPlayingRef.current = false;
        }
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);

      setIsPlaying(true);
      setIsPaused(false);
      isAutoPlayingRef.current = true;
    }, 50);
  }, [synth, extractCurrentPageText, selectedVoice, renditionRef, stop]);

  useEffect(() => {
    playRef.current = playCurrentPage;
  }, [playCurrentPage]);

  const togglePlayPause = useCallback(() => {
    if (!synth) return;

    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
        isAutoPlayingRef.current = true;
      } else {
        synth.pause();
        setIsPaused(true);
        isAutoPlayingRef.current = false;
      }
    } else {
      playCurrentPage();
    }
  }, [synth, isPlaying, isPaused, playCurrentPage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  return {
    isPlaying,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
    language,
    changeLanguage,
    togglePlayPause,
    stop,
  };
}
