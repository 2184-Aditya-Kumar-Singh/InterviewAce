"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { syncCurrentProfile } from "@/lib/client-profile";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    syncCurrentProfile().then((profile) => {
      if (!mounted) return;
      if (profile?.role !== "admin") {
        router.replace("/dashboard");
      } else {
        setAllowed(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-slate-300">
        Checking admin access...
      </div>
    );
  }

  return children;
}
