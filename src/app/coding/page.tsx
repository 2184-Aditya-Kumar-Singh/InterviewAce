"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { CodingWorkspace } from "@/components/CodingWorkspace";

export default function CodingPage() {
  return (
    <AuthGuard>
      <AppShell>
        <CodingWorkspace />
      </AppShell>
    </AuthGuard>
  );
}
