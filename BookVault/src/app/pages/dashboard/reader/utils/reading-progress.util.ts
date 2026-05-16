/** Parse `positionJson` renvoyé par reading-service (structure libre côté client). */
export function parseProgressPercent(positionJson: string): number {
  try {
    const o = JSON.parse(positionJson) as { percent?: number; progress?: number };
    if (typeof o.percent === 'number') {
      return Math.min(100, Math.max(0, Math.round(o.percent)));
    }
    if (typeof o.progress === 'number') {
      return Math.min(100, Math.max(0, Math.round(o.progress)));
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function readingMediaLabel(mediaType: string): string {
  switch (mediaType?.toUpperCase()) {
    case 'EBOOK':
      return 'Livre numérique';
    case 'AUDIOBOOK':
      return 'Audio';
    default:
      return mediaType || 'Lecture';
  }
}
