/**
 * Custom Sticker Components for Story Editor
 * 
 * These are the final illustrated PNG sticker images from CanvaPro.
 * Each sticker renders the exact original artwork with proper
 * colors, shadows, textures, and hand-drawn styling.
 * 
 * Total: 10 stickers
 */

import React from 'react';
import { Image } from 'react-native';

// ========== PNG Sticker Assets ==========
const STICKER_IMAGES = {
  goodMorning: require('./images/good-morning.png'),
  goodNight: require('./images/good-night1.png'),
  omg: require('./images/omg.png'),
  omgVariant: require('./images/omg1.png'),
  tysm: require('./images/tysm.png'),
  tysmVariant: require('./images/tysm1.png'),
  yay: require('./images/yay.png'),
  tuesday: require('./images/tuesday.png'),
  nope: require('./images/nope.png'),
  aww: require('./images/aww.png'),
} as const;

// ========== Sticker Props ==========
interface StickerProps {
  size?: number;
}

// ========== Individual Sticker Components ==========

export const GoodMorningSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.goodMorning}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const GoodNightSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.goodNight}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const OMGSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.omg}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const OMGVariantSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.omgVariant}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const TYSMSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.tysm}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const TYSMVariantSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.tysmVariant}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const YaySticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.yay}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const TuesdaySticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.tuesday}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const NopeSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.nope}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

export const AwwSticker: React.FC<StickerProps> = ({ size = 100 }) => (
  <Image
    source={STICKER_IMAGES.aww}
    style={{ width: size, height: size, resizeMode: 'contain' }}
  />
);

// ========== Export All Stickers with Metadata ==========
export const STICKER_COMPONENTS = [
  { id: 'good_morning', label: 'Good Morning', Component: GoodMorningSticker },
  { id: 'good_night', label: 'Good Night', Component: GoodNightSticker },
  { id: 'omg', label: 'OMG', Component: OMGSticker },
  { id: 'omg_variant', label: 'OMG', Component: OMGVariantSticker },
  { id: 'tysm', label: 'TYSM', Component: TYSMSticker },
  { id: 'tysm_variant', label: 'TYSM', Component: TYSMVariantSticker },
  { id: 'yay', label: 'Yay!', Component: YaySticker },
  { id: 'tuesday', label: 'Tuesday', Component: TuesdaySticker },
  { id: 'nope', label: 'Nope', Component: NopeSticker },
  { id: 'aww', label: 'Aww', Component: AwwSticker },
];

export default STICKER_COMPONENTS;
