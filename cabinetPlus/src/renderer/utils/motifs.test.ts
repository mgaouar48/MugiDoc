import { describe, it, expect } from 'vitest';
import {
  parseMotifSegments,
  hasSegment,
  toggleMotifSegment,
  removeMotifSegment,
  matchesQuery,
} from './motifs';

describe('parseMotifSegments', () => {
  it('splits on " + " and trims whitespace', () => {
    expect(parseMotifSegments('Fièvre + Toux')).toEqual(['Fièvre', 'Toux']);
    expect(parseMotifSegments('Fièvre +   Toux  ')).toEqual(['Fièvre', 'Toux']);
  });

  it('returns a single segment for plain free text', () => {
    expect(parseMotifSegments('Suivi post-opératoire')).toEqual(['Suivi post-opératoire']);
  });

  it('returns an empty array for empty/whitespace-only input', () => {
    expect(parseMotifSegments('')).toEqual([]);
    expect(parseMotifSegments('   ')).toEqual([]);
  });

  it('drops empty segments (e.g. trailing separator)', () => {
    expect(parseMotifSegments('Fièvre + ')).toEqual(['Fièvre']);
  });
});

describe('hasSegment', () => {
  it('matches case- and accent-insensitively', () => {
    expect(hasSegment('Fièvre + Toux', 'fievre')).toBe(true);
    expect(hasSegment('Fièvre + Toux', 'FIÈVRE')).toBe(true);
    expect(hasSegment('Fièvre + Toux', 'Douleur')).toBe(false);
  });
});

describe('toggleMotifSegment', () => {
  it('appends a new label to an empty field', () => {
    expect(toggleMotifSegment('', 'Fièvre')).toBe('Fièvre');
  });

  it('appends a new label to an existing value with the "+" separator', () => {
    expect(toggleMotifSegment('Fièvre', 'Toux')).toBe('Fièvre + Toux');
  });

  it('removes the label instead if already present (toggle off)', () => {
    expect(toggleMotifSegment('Fièvre + Toux', 'Toux')).toBe('Fièvre');
    expect(toggleMotifSegment('Fièvre + Toux', 'fievre')).toBe('Toux');
  });

  it('ignores a blank label', () => {
    expect(toggleMotifSegment('Fièvre', '   ')).toBe('Fièvre');
  });
});

describe('removeMotifSegment', () => {
  it('removes the segment at the given index', () => {
    expect(removeMotifSegment('Fièvre + Toux + Céphalées', 1)).toBe('Fièvre + Céphalées');
  });

  it('is a no-op for an out-of-range index', () => {
    expect(removeMotifSegment('Fièvre', 5)).toBe('Fièvre');
    expect(removeMotifSegment('Fièvre', -1)).toBe('Fièvre');
  });
});

describe('matchesQuery', () => {
  it('matches accent- and case-insensitively', () => {
    expect(matchesQuery('Céphalées / Maux de tête', 'cephalees')).toBe(true);
    expect(matchesQuery('Céphalées / Maux de tête', 'CEPHALEES')).toBe(true);
  });

  it('requires every token to match (AND, not OR)', () => {
    expect(matchesQuery('Douleur abdominale', 'douleur abdo')).toBe(true);
    expect(matchesQuery('Douleur abdominale', 'douleur thoracique')).toBe(false);
  });

  it('matches everything for an empty query', () => {
    expect(matchesQuery('Fièvre', '')).toBe(true);
    expect(matchesQuery('Fièvre', '   ')).toBe(true);
  });
});
