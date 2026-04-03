"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SerializedBoardTask } from "@/app/(app)/projects/[id]/board/types";

export type ProjectHeaderPayload = {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  allTasks: SerializedBoardTask[];
};

type Ctx = {
  payload: ProjectHeaderPayload | null;
  setPayload: (p: ProjectHeaderPayload | null) => void;
};

const ProjectHeaderContext = createContext<Ctx | null>(null);

export function ProjectHeaderProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<ProjectHeaderPayload | null>(null);
  const value = useMemo(() => ({ payload, setPayload }), [payload]);
  return (
    <ProjectHeaderContext.Provider value={value}>
      {children}
    </ProjectHeaderContext.Provider>
  );
}

export function useProjectHeaderRegistry() {
  const ctx = useContext(ProjectHeaderContext);
  if (!ctx) {
    throw new Error("useProjectHeaderRegistry must be used within ProjectHeaderProvider");
  }
  return ctx;
}
