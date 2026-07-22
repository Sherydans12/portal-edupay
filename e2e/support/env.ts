import fs from "fs";
import path from "path";

export const portalRoot = path.resolve(__dirname, "..", "..");
export const edupayBackendDir =
  process.env.EDUPAY_BACKEND_DIR ??
  path.resolve(portalRoot, "..", "BL-002", "backend");

export function readEnvFile(filePath = path.join(portalRoot, ".env")) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, rawLine) => {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        return env;
      }

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

      if (!match) {
        return env;
      }

      const [, key, rawValue] = match;
      const value = rawValue.trim().replace(/^(['"])(.*)\1$/, "$2");
      env[key] = value;

      return env;
    }, {});
}

export function applyPortalEnv() {
  const env = readEnvFile();

  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }

  return env;
}

export function getPortalTenantKeys() {
  if (process.env.PORTAL_TENANT_KEYS) {
    return process.env.PORTAL_TENANT_KEYS;
  }

  const env = readEnvFile();
  const tenantId =
    process.env.NEXT_PUBLIC_TENANT_ID ??
    env.NEXT_PUBLIC_TENANT_ID ??
    "colegio-pruebas";
  const token =
    process.env.EDUPAY_API_TOKEN ??
    env.EDUPAY_API_TOKEN ??
    "local-e2e-edupay-s2s-token";

  return JSON.stringify({ [tenantId]: token });
}

export function toStringEnv(env: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}
