import { MISSION_IDS, MISSIONS } from '@/application/learning/missions';
import { LANGUAGES } from '@/shared/language';

import { DOC_CATALOG } from './catalog';
import { MISSION_TEXTS } from './missions';

describe('MISSION_TEXTS', () => {
  it('gives every mission as many hints in each language', () => {
    for (const mission of MISSION_IDS) {
      const [first, ...others] = LANGUAGES.map((language) => MISSION_TEXTS[mission][language]);
      for (const text of others) {
        expect(text.hints.length, mission).toBe(first?.hints.length);
      }
      expect(first?.hints.length, mission).toBeGreaterThan(0);
    }
  });

  it('names a different badge for each mission', () => {
    for (const language of LANGUAGES) {
      const badges = MISSION_IDS.map((mission) => MISSION_TEXTS[mission][language].badge);
      expect(new Set(badges).size).toBe(badges.length);
    }
  });

  it('closes every code and emphasis mark', () => {
    const texts = MISSION_IDS.flatMap((mission) =>
      LANGUAGES.flatMap((language) => {
        const { goal, hints } = MISSION_TEXTS[mission][language];
        return [goal, ...hints];
      }),
    );
    for (const text of texts) {
      expect(text.split('`').length % 2, text).toBe(1);
      expect(text.replace(/`[^`]*`/g, '').split('**').length % 2, text).toBe(1);
    }
  });
});

describe('MISSIONS', () => {
  it('follows the order of the course and points to existing pages', () => {
    expect(MISSIONS.map((mission) => mission.id)).toEqual(MISSION_IDS);
    const pages = new Set(DOC_CATALOG.map((entry) => entry.id));
    for (const mission of MISSIONS) {
      expect(pages, mission.id).toContain(mission.docId);
    }
  });
});
