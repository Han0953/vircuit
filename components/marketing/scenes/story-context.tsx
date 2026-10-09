"use client";
import { createContext, useState, type ReactNode } from "react";
import { createStoryChannel, type StoryChannel } from "./story-config";
import { MotionScene } from "./motion-scene";
export const StoryContext = createContext<StoryChannel | null>(null);
export function StoryExperience({ children }: { children: ReactNode }) {
  const [channel] = useState(createStoryChannel);
  return <StoryContext.Provider value={channel}><MotionScene kind="story">{children}</MotionScene></StoryContext.Provider>;
}
