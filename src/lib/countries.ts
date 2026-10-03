const CODES = [
  'NP',
  'IN',
  'BD',
  'LK',
  'BT',
  'MV',
  'CN',
  'JP',
  'KR',
  'SG',
  'MY',
  'TH',
  'AE',
  'QA',
  'TR',
  'GB',
  'FR',
  'DE',
  'NL',
  'AU',
  'US',
  'CA',
];
const names = new Intl.DisplayNames(['en'], { type: 'region' });

export const COUNTRIES = CODES.map((code) => ({
  code,
  name: names.of(code) ?? code,
})).sort((a, b) => a.name.localeCompare(b.name));
