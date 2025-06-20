import { useCallback, useEffect, useRef, useState } from 'react';

interface FeedParams {
  similarity: number;
  confidence: number;
  vad: number;
  suppressed: boolean;
}

interface AutoTuningReturn {
  similarityThreshold: number;
  amplitudeThreshold: number;
  feed: (p: FeedParams) => void;
}

const SIM_MIN = 0.4;
const SIM_MAX = 0.95;
const AMP_MIN = 0.05;
const AMP_MAX = 0.35;
const ADJUST_INTERVAL = 10_000; // ms

export function useVoiceAutoTuning(initialSim: number, initialAmp: number): AutoTuningReturn {
  const [similarityThreshold, setSimilarityThreshold] = useState(
    Math.min(Math.max(initialSim, SIM_MIN), SIM_MAX)
  );
  const [amplitudeThreshold, setAmplitudeThreshold] = useState(
    Math.min(Math.max(initialAmp, AMP_MIN), AMP_MAX)
  );

  const statsRef = useRef({
    accepted: 0,
    suppressed: 0,
    sumSim: 0,
    sumConf: 0,
    sumVad: 0,
    count: 0,
  });

  const lastAdjustRef = useRef(Date.now());

  const feed = useCallback(({ similarity, confidence, vad, suppressed }: FeedParams) => {
    const s = statsRef.current;
    if (suppressed) s.suppressed += 1;
    else s.accepted += 1;

    s.sumSim += similarity;
    s.sumConf += confidence;
    s.sumVad += vad;
    s.count += 1;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastAdjustRef.current < ADJUST_INTERVAL) return;
      lastAdjustRef.current = now;

      const s = statsRef.current;
      if (s.count === 0) return; // nothing to analyse

      const suppressRate = s.suppressed / s.count;
      const avgVad = s.sumVad / s.count;

      let newSim = similarityThreshold;
      let newAmp = amplitudeThreshold;

      // Adjust similarity threshold
      if (s.suppressed > s.accepted && suppressRate > 0.6) {
        // likely too aggressive – lower threshold
        newSim = similarityThreshold - 0.05;
      } else if (s.accepted > 0 && s.suppressed === 0 && s.sumSim / s.count > similarityThreshold + 0.05) {
        // echoes leaking – raise threshold
        newSim = similarityThreshold + 0.05;
      }

      // Adjust amplitude threshold based on ambient VAD
      if (avgVad > amplitudeThreshold + 0.05) {
        newAmp = amplitudeThreshold + 0.02;
      } else if (avgVad < amplitudeThreshold - 0.05) {
        newAmp = amplitudeThreshold - 0.02;
      }

      newSim = Math.min(Math.max(newSim, SIM_MIN), SIM_MAX);
      newAmp = Math.min(Math.max(newAmp, AMP_MIN), AMP_MAX);

      if (newSim !== similarityThreshold) setSimilarityThreshold(newSim);
      if (newAmp !== amplitudeThreshold) setAmplitudeThreshold(newAmp);

      // reset stats
      statsRef.current = {
        accepted: 0,
        suppressed: 0,
        sumSim: 0,
        sumConf: 0,
        sumVad: 0,
        count: 0,
      };
    }, 2000);

    return () => clearInterval(id);
  }, [similarityThreshold, amplitudeThreshold]);

  return { similarityThreshold, amplitudeThreshold, feed };
} 