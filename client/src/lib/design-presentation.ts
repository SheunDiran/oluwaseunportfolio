type Artwork = { id?: string; title: string; type: string; description?: string };

// Editorial defaults for the existing archive only. Owner edits and pin order remain authoritative.
const existingPieces: Record<string, { original: string; title: string; type?: string; description?: string }> = {
  'studio/designs/1792779330048-4469911d-109c-4260-b574-0385bae191f5.json:0': { original: 'Diran Hub', title: 'Diran Hub — Tech Services Flyer', type: 'Flyers & Posters', description: 'Promotional design introducing Diran Hub’s development and training services.' },
  'studio/designs/1792779330048-4469911d-109c-4260-b574-0385bae191f5.json:1': { original: 'Logo', title: 'APEX ’29 — Class Identity', description: 'An identity for the University of Lagos Economics APEX ’29 cohort.' },
  'studio/designs/1792779330048-4469911d-109c-4260-b574-0385bae191f5.json:3': { original: 'Favira', title: 'Favira — Brand Applications', description: 'Brand presentation across packaging, stationery and merchandise mockups.' },
  'studio/designs/1792778675871-e45995f3-9614-4802-94f0-705958cfec5f.json:2': { original: 'Publicity walk poster', title: 'The Investment Society — Publicity Walk', type: 'Flyers & Posters' },
  'studio/designs/1792778675871-e45995f3-9614-4802-94f0-705958cfec5f.json:5': { original: 'Elections', title: 'NESA — Election Campaign', type: 'Flyers & Posters' },
  'studio/designs/1792778675871-e45995f3-9614-4802-94f0-705958cfec5f.json:6': { original: 'Election', title: 'SOSSA — Student Elections', type: 'Flyers & Posters' },
  'studio/designs/1792778675871-e45995f3-9614-4802-94f0-705958cfec5f.json:9': { original: 'October', title: 'Hult Prize UNILAG — October Social Post', type: 'Social Media' },
  'studio/designs/1792768489185-3d875e48-9dd2-468a-b366-b2a872cbb63b.json:1': { original: 'Creative', title: 'Sheun — Personal Brand Visual', type: 'Social Media' },
};

export function presentDesign<T extends Artwork>(piece: T): T {
  const defaults = piece.id ? existingPieces[piece.id] : undefined;
  if (!defaults || piece.title !== defaults.original) return piece;
  return { ...piece, title: defaults.title, type: defaults.type || piece.type, description: piece.description || defaults.description };
}

export function isAttributedTestimonial(item: { name: string; organisation?: string }) {
  return Boolean(item.name?.trim()) && !/^(client|business client|publicity team lead)$/i.test(item.name.trim());
}
