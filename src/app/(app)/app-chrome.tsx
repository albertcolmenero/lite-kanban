"use client";

import type { ReactNode } from "react";
import { MainAppHeader } from "@/app/(app)/main-app-header";
import { ProjectHeaderProvider } from "@/app/(app)/project-header-context";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <ProjectHeaderProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <MainAppHeader />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </ProjectHeaderProvider>
  );
}
