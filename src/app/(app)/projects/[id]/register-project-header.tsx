"use client";

import { useEffect } from "react";
import {
  useProjectHeaderRegistry,
  type ProjectHeaderPayload,
} from "@/app/(app)/project-header-context";

export function RegisterProjectHeader({
  payload,
}: {
  payload: ProjectHeaderPayload | null;
}) {
  const { setPayload } = useProjectHeaderRegistry();

  useEffect(() => {
    if (payload) setPayload(payload);
    else setPayload(null);
    return () => setPayload(null);
  }, [payload, setPayload]);

  return null;
}
