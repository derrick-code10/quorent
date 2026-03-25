export const MAX_INTERESTS = 10

export const PRESET_INTERESTS = [
  'Artificial Intelligence',
  'Crypto & Web3',
  'Climate & Environment',
  'World Politics',
  'Finance & Markets',
  'Technology',
  'Science & Research',
  'Sports',
  'Entertainment',
  'Health & Medicine',
  'Business',
  'Space & Astronomy',
  'Startups',
  'Energy',
  'US Politics',
]

export const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Eastern Time (US)', value: 'America/New_York' },
  { label: 'Central Time (US)', value: 'America/Chicago' },
  { label: 'Mountain Time (US)', value: 'America/Denver' },
  { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: 'São Paulo', value: 'America/Sao_Paulo' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Paris / Berlin', value: 'Europe/Paris' },
  { label: 'Moscow', value: 'Europe/Moscow' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'India (IST)', value: 'Asia/Kolkata' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Shanghai', value: 'Asia/Shanghai' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Auckland', value: 'Pacific/Auckland' },
]

export function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TIMEZONES.some(t => t.value === tz) ? tz : 'UTC'
  } catch {
    return 'UTC'
  }
}
