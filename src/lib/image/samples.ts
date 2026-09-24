export type SampleImage = { id: string; label: string; src: string; credit: string }

/** Bundled locally: most source hosts send no CORS header, which would block reading their pixels. */
export const SAMPLE_IMAGES: readonly SampleImage[] = [
  {
    id: 'radicevic-abstract',
    label: 'Abstract',
    src: '/samples/radicevic-abstract.jpg',
    credit: 'aleksandarradicevic.com',
  },
  {
    id: 'radicevic-dancers',
    label: 'Dancers',
    src: '/samples/radicevic-dancers.jpg',
    credit: 'aleksandarradicevic.com',
  },
  {
    id: 'vmart-landscape',
    label: 'Park landscape',
    src: '/samples/vmart-landscape.jpg',
    credit: 'vmartgallery.org',
  },
  {
    id: 'elden-ring-sea',
    label: 'Sea at night',
    src: '/samples/elden-ring-sea.webp',
    credit: 'Elden Ring art via candb.com',
  },
]
