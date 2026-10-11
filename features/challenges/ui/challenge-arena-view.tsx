"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  ToggleLeft,
  Activity,
  Wrench,
  Radio,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PracticeLaunchAction } from "@/features/learning/ui/practice-launch-action";
import { lessonHref } from "@/features/learning/registry";
import type { Course } from "@/features/learning/schema";
import type { Challenge } from "../contracts";
import type { ProgressRow } from "@/features/progress/contracts";

interface ChallengeArenaViewProps {
  challenges: Challenge[];
  lessonsMap: Record<
    string,
    {
      course: Course;
      lesson: Course["lessons"][number];
    }
  >;
  rows: ProgressRow[];
}

export function ChallengeArenaView({
  challenges,
  lessonsMap,
  rows,
}: ChallengeArenaViewProps) {
  const [filter, setFilter] = useState<string>("all");

  const categories = [
    { id: "all", label: "Semua Tantangan (6)" },
    { id: "elektronika", label: "Elektronika" },
    { id: "digital", label: "Digital I/O" },
    { id: "analog", label: "Analog & PWM" },
    { id: "proyek", label: "Debugging & Proyek" },
  ];

  const filteredChallenges = challenges.filter((c) => {
    if (filter === "all") return true;
    if (filter === "elektronika")
      return c.skills.some((s) => s.toLowerCase().includes("elektronika") || s.toLowerCase().includes("wiring"));
    if (filter === "digital")
      return c.skills.some((s) => s.toLowerCase().includes("digital"));
    if (filter === "analog")
      return c.skills.some((s) => s.toLowerCase().includes("analog") || s.toLowerCase().includes("pwm"));
    if (filter === "proyek")
      return c.skills.some((s) => s.toLowerCase().includes("debug") || s.toLowerCase().includes("proyek"));
    return true;
  });

  // Get unique icon per challenge
  const renderChallengeIcon = (id: string) => {
    if (id.includes("led-resistor"))
      return <Radio className="size-5 text-blue-500" aria-hidden="true" />;
    if (id.includes("blink"))
      return <Clock className="size-5 text-emerald-500" aria-hidden="true" />;
    if (id.includes("button"))
      return <ToggleLeft className="size-5 text-amber-500" aria-hidden="true" />;
    if (id.includes("pot"))
      return <Activity className="size-5 text-purple-500" aria-hidden="true" />;
    if (id.includes("debug"))
      return <Wrench className="size-5 text-rose-500" aria-hidden="true" />;
    if (id.includes("traffic"))
      return <Layers className="size-5 text-cyan-500" aria-hidden="true" />;
    return <Sparkles className="size-5 text-primary" aria-hidden="true" />;
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div data-motion="action" className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={filter === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat.id)}
            className="rounded-full text-xs font-medium"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* 6 Challenges Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredChallenges.map((challenge) => {
          const mapping = lessonsMap[challenge.lessonId];
          const isPassed = rows.some(
            (r) => r.lesson_id === challenge.lessonId && r.status === "completed"
          );

          return (
            <Card
              key={challenge.id}
              data-motion="card"
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:border-border transition-colors"
            >
              <div>
                {/* Header: Icon + Order + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-surface-muted">
                      {renderChallengeIcon(challenge.id)}
                    </span>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-text-tertiary uppercase">
                        Tantangan 0{challenge.order}
                      </span>
                      <p className="text-xs font-semibold text-primary">Evaluator Otomatis</p>
                    </div>
                  </div>

                  {isPassed ? (
                    <Badge variant="default" className="gap-1 bg-emerald-600 text-[10px] font-semibold text-white">
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Lolos
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      Siap Diuji
                    </Badge>
                  )}
                </div>

                <h3 className="mt-4 text-base font-bold tracking-tight text-foreground sm:text-lg">
                  {challenge.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  {challenge.objective}
                </p>

                {/* Skills & Hardware specs */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {challenge.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] font-medium">
                      {skill}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] font-mono">
                    <Cpu className="size-3 mr-1 text-primary" aria-hidden="true" />
                    Uno R3
                  </Badge>
                </div>
              </div>

              {/* Action buttons & study material link */}
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2.5">
                {mapping && (
                  <Link
                    href={lessonHref(mapping.course, mapping.lesson)}
                    className="text-xs text-primary underline hover:text-primary/80 truncate font-medium"
                  >
                    Materi Teori: {mapping.lesson.title}
                  </Link>
                )}
                <div className="flex items-center justify-end">
                  <PracticeLaunchAction lessonId={challenge.lessonId} challenge />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
