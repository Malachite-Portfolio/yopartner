export function maskIndianPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length >= 10 ? digits.slice(-10) : "";

  if (normalized.length !== 10) return "your mobile number";

  return `+91 ******${normalized.slice(-4)}`;
}
