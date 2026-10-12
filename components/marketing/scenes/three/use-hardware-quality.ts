import { useCallback, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { chooseHardwareQuality, nextHardwareQuality, qualityDpr } from "./quality-policy";

export function useHardwareQuality(host: HTMLElement, fail: () => void) {
  const [quality, setQuality] = useState(() => {
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    return chooseHardwareQuality({ cores: device.hardwareConcurrency, memory: device.deviceMemory, saveData: device.connection?.saveData });
  });
  const slow = useRef(0);
  const setDpr = useThree((state) => state.setDpr);
  useEffect(() => {
    const dpr = qualityDpr(quality, window.devicePixelRatio || 1);
    setDpr(dpr);
    host.setAttribute("data-quality", quality);
    host.setAttribute("data-dpr", String(dpr));
  }, [host, quality, setDpr]);
  const report = useCallback((latency: number) => {
    host.setAttribute("data-request-latency-ms", latency.toFixed(2));
    if (latency > 40) slow.current++; else if (latency > 0 && latency < 25) slow.current = Math.max(0, slow.current - 1);
    if (slow.current <= 24) return true;
    slow.current = 0;
    const next = nextHardwareQuality(quality);
    if (next === "fallback") { host.setAttribute("data-quality", next); fail(); }
    else setQuality(next);
    return false;
  }, [fail, host, quality]);
  return { quality, report };
}
