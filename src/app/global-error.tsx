"use client";

import { useEffect } from "react";
import { ErrorContent } from "./error";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error("Error global de renderizado del portal", {
      digest: error.digest,
      error,
    });
  }, [error]);

  return (
    <html lang="es">
      <body>
        <ErrorContent onRetry={unstable_retry} />
      </body>
    </html>
  );
}
