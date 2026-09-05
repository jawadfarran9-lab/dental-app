export type DentalSession = {
  id: string;
  slug: string;
  name: string;
  image: number;
};

export const DENTAL_SESSIONS: DentalSession[] = [
  { id: 'dental-checkup',       slug: 'dental-checkup',       name: 'Dental Checkup',       image: require('../../../assets/images/sessions/dental/dental-checkup.jpg') },
  { id: 'teeth-cleaning',       slug: 'teeth-cleaning',       name: 'Teeth Cleaning',       image: require('../../../assets/images/sessions/dental/teeth-cleaning.jpg') },
  { id: 'deep-scaling',         slug: 'deep-scaling',         name: 'Deep Scaling',         image: require('../../../assets/images/sessions/dental/deep-scaling.jpg') },
  { id: 'teeth-whitening',      slug: 'teeth-whitening',      name: 'Teeth Whitening',      image: require('../../../assets/images/sessions/dental/teeth-whitening.jpg') },
  { id: 'composite-filling',    slug: 'composite-filling',    name: 'Composite Filling',    image: require('../../../assets/images/sessions/dental/composite-filling.jpg') },
  { id: 'root-canal',           slug: 'root-canal',           name: 'Root Canal',           image: require('../../../assets/images/sessions/dental/root-canal.jpg') },
  { id: 'tooth-extraction',     slug: 'tooth-extraction',     name: 'Tooth Extraction',     image: require('../../../assets/images/sessions/dental/tooth-extraction.jpg') },
  { id: 'wisdom-tooth-removal', slug: 'wisdom-tooth-removal', name: 'Wisdom Tooth Removal', image: require('../../../assets/images/sessions/dental/wisdom-tooth-removal.jpg') },
  { id: 'dental-implant',       slug: 'dental-implant',       name: 'Dental Implant',       image: require('../../../assets/images/sessions/dental/dental-implant.jpg') },
  { id: 'dental-crown',         slug: 'dental-crown',         name: 'Dental Crown',         image: require('../../../assets/images/sessions/dental/dental-crown.jpg') },
  { id: 'dental-bridge',        slug: 'dental-bridge',        name: 'Dental Bridge',        image: require('../../../assets/images/sessions/dental/dental-bridge.jpg') },
  { id: 'veneers',              slug: 'veneers',              name: 'Veneers',              image: require('../../../assets/images/sessions/dental/veneers.jpg') },
  { id: 'dentures',             slug: 'dentures',             name: 'Dentures',             image: require('../../../assets/images/sessions/dental/dentures.jpg') },
  { id: 'gum-treatment',        slug: 'gum-treatment',        name: 'Gum Treatment',        image: require('../../../assets/images/sessions/dental/gum-treatment.jpg') },
  { id: 'orthodontics',         slug: 'orthodontics',         name: 'Orthodontics',         image: require('../../../assets/images/sessions/dental/orthodontics.jpg') },
  { id: 'fluoride-treatment',   slug: 'fluoride-treatment',   name: 'Fluoride Treatment',   image: require('../../../assets/images/sessions/dental/fluoride-treatment.jpg') },
  { id: 'fissure-sealant',      slug: 'fissure-sealant',      name: 'Fissure Sealant',      image: require('../../../assets/images/sessions/dental/fissure-sealant.jpg') },
  { id: 'night-guard',          slug: 'night-guard',          name: 'Night Guard',          image: require('../../../assets/images/sessions/dental/night-guard.jpg') },
];
