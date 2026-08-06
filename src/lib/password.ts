export const PASSWORD_MIN_LENGTH = 8;

export function validatePortalPassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }

  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe incluir al menos una letra y un número";
  }

  return null;
}
