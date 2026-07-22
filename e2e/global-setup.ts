import { execSync } from "child_process";
import {
  edupayBackendDir,
  getPortalTenantKeys,
  portalRoot,
  toStringEnv,
} from "./support/env";

function run(
  command: string,
  cwd: string,
  env: Record<string, string | undefined> = process.env,
) {
  execSync(command, {
    cwd,
    env: toStringEnv(env) as NodeJS.ProcessEnv,
    stdio: "inherit",
  });
}

async function globalSetup() {
  run("npm run db:seed:portal", edupayBackendDir, {
    ...process.env,
    PORTAL_TENANT_KEYS: getPortalTenantKeys(),
  });

  run("npx prisma db seed", portalRoot);
}

export default globalSetup;
