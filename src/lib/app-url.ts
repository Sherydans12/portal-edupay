const allowedProtocols = new Set(["http:", "https:"]);

export function getPublicAppUrl(request: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  const candidate = configuredUrl || getProxyAwareRequestOrigin(request);

  if (!candidate) {
    throw new Error(
      "No se pudo determinar la URL pública. Configura NEXT_PUBLIC_APP_URL o APP_URL.",
    );
  }

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error(
      `La URL pública configurada no es válida: ${candidate}`,
    );
  }

  if (!allowedProtocols.has(url.protocol)) {
    throw new Error(
      `La URL pública debe usar HTTP o HTTPS, no ${url.protocol}`,
    );
  }

  if (url.username || url.password) {
    throw new Error("La URL pública no puede contener credenciales.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    isLocalOrUnroutableHostname(url.hostname)
  ) {
    throw new Error(
      `La URL pública no puede usar el host ${url.hostname} en producción.`,
    );
  }

  return url.origin;
}

function getProxyAwareRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedProto = firstHeaderValue(
    request.headers.get("x-forwarded-proto"),
  );
  const forwardedHost = firstHeaderValue(
    request.headers.get("x-forwarded-host"),
  );
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"));
  const protocol = forwardedProto || requestUrl.protocol.replace(/:$/, "");

  if (host) {
    return `${protocol}://${host}`;
  }

  return requestUrl.origin;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function isLocalOrUnroutableHostname(hostname: string) {
  const normalizedHostname = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "");

  return (
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname === "::1" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname.startsWith("127.")
  );
}
