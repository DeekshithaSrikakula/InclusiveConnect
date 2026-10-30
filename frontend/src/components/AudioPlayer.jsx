import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { LANGUAGES } from '../utils/uiTranslations';

export default function AudioPlayer({ text, title, languageCode, onAudioUsed }) {
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef(null);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setLoadingAudio(false);
  };

  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    stopAllAudio();
  }, [text, languageCode]);

  const fallbackBrowserSpeech = (cleanText) => {
    if (!('speechSynthesis' in window)) {
      setPlaying(false);
      setLoadingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langObj =
      LANGUAGES.find((l) => l.code === languageCode) || LANGUAGES[0];
    utterance.lang = langObj.speechLang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const exactVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
          (v.name.includes('Natural') || v.name.includes('Google'))
      ) ||
      voices.find((v) =>
        v.lang.toLowerCase().startsWith(languageCode.toLowerCase())
      );

    if (exactVoice) {
      utterance.voice = exactVoice;
    }

    utterance.onend = () => {
      setPlaying(false);
      setLoadingAudio(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setLoadingAudio(false);
    };

    setLoadingAudio(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleAudio = async () => {
    if (playing || loadingAudio) {
      stopAllAudio();
      return;
    }

    const cleanText = `${title ? title + '. ' : ''}${(text || '')
      .replace(/[•*#]/g, ' ')
      .replace(/\(LOTO\)/gi, '')
      .replace(/Ext\.\s*(\d+)/gi, 'Extension $1')
      .replace(/\b2x\b/gi, 'double')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()}`;

    if (onAudioUsed) onAudioUsed();
    setLoadingAudio(true);

    try {
      const ttsUrl = `/api/tts?lang=${encodeURIComponent(
        languageCode || 'en'
      )}&text=${encodeURIComponent(cleanText)}`;

      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        setLoadingAudio(false);
        setPlaying(true);
      };

      audio.onended = () => {
        setPlaying(false);
        setLoadingAudio(false);
      };

      audio.onerror = () => {
        fallbackBrowserSpeech(cleanText);
      };

      await audio.play();
      setLoadingAudio(false);
      setPlaying(true);
    } catch {
      fallbackBrowserSpeech(cleanText);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleAudio}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold text-xs transition cursor-pointer ${
        playing
          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          : loadingAudio
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
      }`}
    >
      {loadingAudio ? (
        <>
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span>Loading Voice...</span>
        </>
      ) : playing ? (
        <>
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <Square className="w-3 h-3 fill-red-600 text-red-600" />
          <span>Stop Listening</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Listen Voice Note</span>
        </>
      )}
    </button>
  );
}
