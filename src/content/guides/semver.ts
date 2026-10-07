import type { GuideDoc } from '../model';

export const semverGuide: GuideDoc = {
  kind: 'guide',
  id: 'semver',
  related: ['tag', 'commit-messages', 'branching-strategy'],
  text: {
    fr: {
      title: 'Semantic Versioning',
      summary:
        'Numéroter les versions `MAJEUR.MINEUR.CORRECTIF` pour que chaque numéro dise ce qui a changé.',
      sections: [
        {
          heading: 'Les trois nombres',
          blocks: [
            {
              type: 'list',
              items: [
                '**MAJEUR** (`2.0.0`) : un changement incompatible. Ceux qui utilisent ton projet devront adapter leur code.',
                '**MINEUR** (`1.3.0`) : une nouvelle fonctionnalité compatible avec l’existant.',
                '**CORRECTIF** (`1.2.4`) : une correction de bug compatible.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Quand un nombre augmente, ceux à sa droite repartent à zéro : `1.4.2` → `1.5.0` → `2.0.0`.',
            },
          ],
        },
        {
          heading: 'Le lien avec les commits',
          blocks: [
            {
              type: 'list',
              items: [
                'Des commits `fix` → version corrective.',
                'Au moins un `feat` → version mineure.',
                'Un `BREAKING CHANGE` ou `feat!` → version majeure.',
              ],
            },
            {
              type: 'paragraph',
              text: 'C’est pourquoi des messages Conventional Commits bien écrits permettent de calculer automatiquement le prochain numéro et le changelog.',
            },
          ],
        },
        {
          heading: 'En pratique',
          blocks: [
            {
              type: 'code',
              code: 'git tag -a v1.2.0 -m "Release 1.2.0"\ngit tag',
            },
            {
              type: 'list',
              items: [
                'Les versions `0.y.z` signalent un projet encore instable : tout peut changer.',
                'Les préversions s’écrivent avec un suffixe : `2.0.0-beta.1`, `2.0.0-rc.1`.',
                'Une version publiée ne se modifie jamais : on en publie une nouvelle.',
              ],
            },
          ],
        },
      ],
    },
    en: {
      title: 'Semantic Versioning',
      summary: 'Numbering versions `MAJOR.MINOR.PATCH` so that each number tells what changed.',
      sections: [
        {
          heading: 'The three numbers',
          blocks: [
            {
              type: 'list',
              items: [
                '**MAJOR** (`2.0.0`): an incompatible change. People using your project will have to adapt their code.',
                '**MINOR** (`1.3.0`): a new feature that stays compatible.',
                '**PATCH** (`1.2.4`): a compatible bug fix.',
              ],
            },
            {
              type: 'paragraph',
              text: 'When a number goes up, those on its right go back to zero: `1.4.2` → `1.5.0` → `2.0.0`.',
            },
          ],
        },
        {
          heading: 'How it relates to commits',
          blocks: [
            {
              type: 'list',
              items: [
                '`fix` commits → patch release.',
                'At least one `feat` → minor release.',
                'A `BREAKING CHANGE` or `feat!` → major release.',
              ],
            },
            {
              type: 'paragraph',
              text: 'That is why well-written Conventional Commits messages let tools compute the next number and the changelog automatically.',
            },
          ],
        },
        {
          heading: 'In practice',
          blocks: [
            {
              type: 'code',
              code: 'git tag -a v1.2.0 -m "Release 1.2.0"\ngit tag',
            },
            {
              type: 'list',
              items: [
                '`0.y.z` versions flag a project that is still unstable: anything may change.',
                'Pre-releases use a suffix: `2.0.0-beta.1`, `2.0.0-rc.1`.',
                'A published version never changes: you publish a new one.',
              ],
            },
          ],
        },
      ],
    },
  },
};
