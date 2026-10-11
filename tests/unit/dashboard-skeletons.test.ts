import { describe, expect, it } from "vitest";
import React from "react";
import DashboardLoading from "@/app/dashboard/loading";
import LearningLoading from "@/app/dashboard/learn/loading";
import ChallengesLoading from "@/app/dashboard/challenges/loading";
import ProgressLoading from "@/app/dashboard/progress/loading";
import { ProjectSkeleton } from "@/features/dashboard/ui/project-skeleton";
import CourseLoading from "@/app/dashboard/learn/[course]/loading";
import LessonLoading from "@/app/dashboard/learn/[course]/[lesson]/loading";

describe("Dashboard Skeletons", () => {
  it("renders DashboardLoading with accessible role='status'", () => {
    const el = DashboardLoading();
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.role).toBe("status");
    expect(el.props["aria-label"]).toBe("Memuat dashboard");
  });

  it("renders LearningLoading with accessible role='status'", () => {
    const el = LearningLoading();
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.role).toBe("status");
    expect(el.props["aria-label"]).toBe("Memuat kurikulum belajar");
  });

  it("renders ChallengesLoading with accessible role='status'", () => {
    const el = ChallengesLoading();
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.role).toBe("status");
    expect(el.props["aria-label"]).toBe("Memuat tantangan");
  });

  it("renders ProgressLoading with accessible role='status'", () => {
    const el = ProgressLoading();
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.role).toBe("status");
    expect(el.props["aria-label"]).toBe("Memuat progress belajar");
  });

  it("renders ProjectSkeleton with accessible role='status'", () => {
    const el = ProjectSkeleton();
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.role).toBe("status");
    expect(el.props["aria-label"]).toBe("Memuat proyek");
  });

  it("renders CourseLoading and LessonLoading with accessible role='status'", () => {
    const courseEl = CourseLoading();
    expect(React.isValidElement(courseEl)).toBe(true);
    expect(courseEl.props.role).toBe("status");

    const lessonEl = LessonLoading();
    expect(React.isValidElement(lessonEl)).toBe(true);
    expect(lessonEl.props.role).toBe("status");
  });
});
