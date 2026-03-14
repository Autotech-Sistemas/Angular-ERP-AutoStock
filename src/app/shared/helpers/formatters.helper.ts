// ─── Currency formatter ──────────────────────────────────────────────────────
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ─── Date formatter ──────────────────────────────────────────────────────────
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
}

// ─── Mileage formatter ───────────────────────────────────────────────────────
export function formatMileage(km: number | null | undefined): string {
  if (km == null) return '—';
  return `${Number(km).toLocaleString('pt-BR')} km`;
}

// ─── CPF mask ────────────────────────────────────────────────────────────────
export function maskCpf(value: string): string {
  return value.replace(/\D/g, '').substring(0, 11)
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ─── Phone mask ──────────────────────────────────────────────────────────────
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// ─── Availability badge ──────────────────────────────────────────────────────
export function availabilityClass(a: string): string {
  const map: Record<string, string> = {
    AVAILABLE: 'badge-green', SOLD: 'badge-red', PENDING: 'badge-yellow',
    RESERVED: 'badge-blue', IN_NEGOTIATION: 'badge-orange',
  };
  return map[a] ?? 'badge-blue';
}

export function availabilityLabel(a: string): string {
  const map: Record<string, string> = {
    AVAILABLE: 'Disponível', SOLD: 'Vendido', PENDING: 'Pendente',
    RESERVED: 'Reservado', IN_NEGOTIATION: 'Em Negociação',
  };
  return map[a] ?? a;
}

// ─── Contract status badge ───────────────────────────────────────────────────
export function contractStatusClass(s: string): string {
  const map: Record<string, string> = {
    SIGNED: 'badge-green', CANCELLED: 'badge-red', EXPIRED: 'badge-yellow', PENDING: 'badge-orange',
  };
  return map[s] ?? 'badge-blue';
}

export function contractStatusLabel(s: string): string {
  const map: Record<string, string> = {
    SIGNED: 'Assinado', CANCELLED: 'Cancelado', EXPIRED: 'Expirado', PENDING: 'Pendente',
  };
  return map[s] ?? s;
}

// ─── Appointment badges ──────────────────────────────────────────────────────
export function aptTypeClass(t: string): string {
  return t === 'TEST_DRIVE' ? 'badge-blue' : 'badge-orange';
}
export function aptTypeLabel(t: string): string {
  return t === 'TEST_DRIVE' ? 'Test Drive' : 'Negociação';
}
export function aptStatusClass(s: string): string {
  const map: Record<string, string> = { PENDING: 'badge-yellow', COMPLETED: 'badge-green', CANCELLED: 'badge-red' };
  return map[s] ?? 'badge-blue';
}
export function aptStatusLabel(s: string): string {
  const map: Record<string, string> = { PENDING: 'Pendente', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' };
  return map[s] ?? s;
}

// ─── Vehicle status ──────────────────────────────────────────────────────────
export function vehicleStatusClass(s: string): string {
  const map: Record<string, string> = { NEW: 'badge-blue', USED: 'badge-yellow', SEMINOVO: 'badge-purple' };
  return map[s] ?? 'badge-blue';
}
export function vehicleStatusLabel(s: string): string {
  const map: Record<string, string> = { NEW: 'Novo', USED: 'Usado', SEMINOVO: 'Seminovo' };
  return map[s] ?? s;
}

// ─── Fuel type label ─────────────────────────────────────────────────────────
export function fuelLabel(f: string): string {
  const map: Record<string, string> = {
    GASOLINE: 'Gasolina', DIESEL: 'Diesel', ELECTRIC: 'Elétrico',
    HYBRID: 'Híbrido', ETHANOL: 'Etanol', LPG: 'GLP', CNG: 'GNV',
  };
  return map[f] ?? f;
}
