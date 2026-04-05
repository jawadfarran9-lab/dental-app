export type Template = {
  id: string;
  title: string;
  thumbnail: string;
  durationSlots: number[];
  category: 'recommended' | 'trending';
  isPremium?: boolean;
  createdBy?: string;
  source?: 'mock' | 'server';
};

export const templates: Template[] = [
  {
    id: '1',
    title: 'Weekend',
    thumbnail: 'https://picsum.photos/300/500?random=1',
    durationSlots: [0.2, 0.4, 0.3, 0.7],
    category: 'recommended',
  },
  {
    id: '2',
    title: 'Clinic Glow',
    thumbnail: 'https://picsum.photos/300/501?random=2',
    durationSlots: [0.3, 0.3, 0.5],
    category: 'trending',
  },
  {
    id: '3',
    title: 'Travel',
    thumbnail: 'https://picsum.photos/300/502?random=3',
    durationSlots: [0.2, 0.5, 0.3, 0.4],
    category: 'recommended',
  },
  {
    id: '4',
    title: 'Food',
    thumbnail: 'https://picsum.photos/300/503?random=4',
    durationSlots: [0.3, 0.2, 0.5],
    category: 'recommended',
  },
  {
    id: '5',
    title: 'Fitness',
    thumbnail: 'https://picsum.photos/300/504?random=5',
    durationSlots: [0.4, 0.3, 0.2, 0.5, 0.3],
    category: 'recommended',
  },
  {
    id: '6',
    title: 'Sunrise',
    thumbnail: 'https://picsum.photos/300/505?random=6',
    durationSlots: [0.5, 0.3, 0.4],
    category: 'trending',
  },
  {
    id: '7',
    title: 'City',
    thumbnail: 'https://picsum.photos/300/506?random=7',
    durationSlots: [0.2, 0.3, 0.4, 0.3],
    category: 'trending',
  },
  {
    id: '8',
    title: 'Nature',
    thumbnail: 'https://picsum.photos/300/507?random=8',
    durationSlots: [0.3, 0.5, 0.2],
    category: 'trending',
  },
];
