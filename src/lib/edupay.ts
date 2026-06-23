import { mockGuardian, mockGuardian2, MOCK_GUARDIAN_MAP } from "@/data/mock";
import type { Guardian } from "@/types/payments";

const REGISTERED_GUARDIAN_RUTS = new Set([
  normalizeRut(mockGuardian.rut),
  normalizeRut(mockGuardian2.rut),
]);

export function normalizeRut(rut: string) {
  return rut.replace(/[.\s-]/g, "").toUpperCase();
}

export function formatGuardianRut(rut: string) {
  const normalizedRut = normalizeRut(rut);

  if (normalizedRut.length <= 1) {
    return rut.trim();
  }

  const body = normalizedRut.slice(0, -1);
  const verifier = normalizedRut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${verifier}`;
}

export async function getGuardianPortalData(rut?: string): Promise<Guardian> {
  // Swap this return for a real EduPay request when the integration is ready.
  // Example: return fetch(`${process.env.EDUPAY_API_URL}/guardians/me`).then((r) => r.json());
  if (rut) {
    const formatted = formatGuardianRut(rut);
    const match = MOCK_GUARDIAN_MAP[formatted];
    if (match) return match;
  }
  return mockGuardian;
}

export async function verifyGuardianExists(rut: string): Promise<boolean> {
  // TODO: Llamar a API real de EduPay.
  return REGISTERED_GUARDIAN_RUTS.has(normalizeRut(rut));
}
