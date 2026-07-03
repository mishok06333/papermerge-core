/** API datetimes are UTC; naive ISO strings lack a zone suffix. */
export function parseApiDateTime(value: string | Date): Date {
  if (value instanceof Date) {
    return value
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return new Date(NaN)
  }
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed)
  }
  return new Date(`${trimmed}Z`)
}

export function formatApiDateTime(value: string | Date): string {
  return parseApiDateTime(value).toLocaleString()
}
