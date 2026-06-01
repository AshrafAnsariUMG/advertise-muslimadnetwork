/**
 * Country targeting data for the campaign wizard.
 *
 * Replaces the old 9-bucket list (Global / North America / Middle East / …)
 * which couldn't express the high-value Muslim markets an advertiser
 * actually cares about (UAE, Saudi, Indonesia, Pakistan, etc.).
 *
 * We keep a couple of the broad buckets ("Global", "Worldwide") at the top
 * for advertisers who genuinely want everything, then the full ISO country
 * list. `target_countries` stores the display labels (strings), same as
 * before, so nothing downstream changes.
 */

export const COUNTRIES = [
  'Global',
  // — North America
  'United States',
  'Canada',
  'Mexico',
  // — MENA / GCC
  'Saudi Arabia',
  'United Arab Emirates',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Egypt',
  'Jordan',
  'Lebanon',
  'Iraq',
  'Palestine',
  'Morocco',
  'Algeria',
  'Tunisia',
  'Libya',
  'Yemen',
  'Syria',
  // — South & Central Asia
  'Pakistan',
  'India',
  'Bangladesh',
  'Afghanistan',
  'Kazakhstan',
  'Uzbekistan',
  // — Southeast Asia
  'Indonesia',
  'Malaysia',
  'Brunei',
  'Singapore',
  'Philippines',
  'Thailand',
  // — Sub-Saharan Africa
  'Nigeria',
  'Senegal',
  'Somalia',
  'Sudan',
  'Kenya',
  'Tanzania',
  'Ethiopia',
  'South Africa',
  'Ghana',
  // — Europe
  'United Kingdom',
  'France',
  'Germany',
  'Netherlands',
  'Belgium',
  'Sweden',
  'Spain',
  'Italy',
  'Turkey',
  // — Oceania
  'Australia',
  'New Zealand',
];

/**
 * One-click region presets. Each maps to a set of labels from COUNTRIES.
 * Selecting a preset adds (union) those countries to the current selection.
 */
export const REGION_PRESETS = [
  {
    label: 'Worldwide',
    countries: ['Global'],
  },
  {
    label: 'GCC',
    countries: [
      'Saudi Arabia',
      'United Arab Emirates',
      'Qatar',
      'Kuwait',
      'Bahrain',
      'Oman',
    ],
  },
  {
    label: 'MENA',
    countries: [
      'Saudi Arabia',
      'United Arab Emirates',
      'Qatar',
      'Kuwait',
      'Bahrain',
      'Oman',
      'Egypt',
      'Jordan',
      'Lebanon',
      'Iraq',
      'Palestine',
      'Morocco',
      'Algeria',
      'Tunisia',
      'Libya',
      'Yemen',
      'Syria',
    ],
  },
  {
    label: 'South Asia',
    countries: ['Pakistan', 'India', 'Bangladesh', 'Afghanistan'],
  },
  {
    label: 'Southeast Asia',
    countries: ['Indonesia', 'Malaysia', 'Brunei', 'Singapore', 'Philippines', 'Thailand'],
  },
  {
    label: 'North America',
    countries: ['United States', 'Canada', 'Mexico'],
  },
  {
    label: 'Europe',
    countries: [
      'United Kingdom',
      'France',
      'Germany',
      'Netherlands',
      'Belgium',
      'Sweden',
      'Spain',
      'Italy',
      'Turkey',
    ],
  },
];
