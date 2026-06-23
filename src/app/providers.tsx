"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "rounded-[8px] border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-xl shadow-tenant-primary/10",
          success: {
            iconTheme: {
              primary: "var(--tenant-primary)",
              secondary: "#fff",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
