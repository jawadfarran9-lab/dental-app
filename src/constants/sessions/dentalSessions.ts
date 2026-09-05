export type DentalSession = { id: string; slug: string; name: string };

export const DENTAL_SESSIONS: DentalSession[] = [
  { id: 'dental-checkup',       slug: 'dental-checkup',       name: 'Dental Checkup' },
  { id: 'teeth-cleaning',       slug: 'teeth-cleaning',       name: 'Teeth Cleaning' },
  { id: 'deep-scaling',         slug: 'deep-scaling',         name: 'Deep Scaling' },
  { id: 'teeth-whitening',      slug: 'teeth-whitening',      name: 'Teeth Whitening' },
  { id: 'composite-filling',    slug: 'composite-filling',    name: 'Composite Filling' },
  { id: 'root-canal',           slug: 'root-canal',           name: 'Root Canal' },
  { id: 'tooth-extraction',     slug: 'tooth-extraction',     name: 'Tooth Extraction' },
  { id: 'wisdom-tooth-removal', slug: 'wisdom-tooth-removal', name: 'Wisdom Tooth Removal' },
  { id: 'dental-implant',       slug: 'dental-implant',       name: 'Dental Implant' },
  { id: 'dental-crown',         slug: 'dental-crown',         name: 'Dental Crown' },
  { id: 'dental-bridge',        slug: 'dental-bridge',        name: 'Dental Bridge' },
  { id: 'veneers',              slug: 'veneers',              name: 'Veneers' },
  { id: 'dentures',             slug: 'dentures',             name: 'Dentures' },
  { id: 'gum-treatment',        slug: 'gum-treatment',        name: 'Gum Treatment' },
  { id: 'orthodontics',         slug: 'orthodontics',         name: 'Orthodontics' },
  { id: 'fluoride-treatment',   slug: 'fluoride-treatment',   name: 'Fluoride Treatment' },
  { id: 'fissure-sealant',      slug: 'fissure-sealant',      name: 'Fissure Sealant' },
  { id: 'night-guard',          slug: 'night-guard',          name: 'Night Guard' },
];
