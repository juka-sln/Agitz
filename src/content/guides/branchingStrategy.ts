import type { GuideDoc } from '../model';

export const branchingStrategyGuide: GuideDoc = {
  kind: 'guide',
  id: 'branching-strategy',
  related: ['branch', 'merge', 'merge-vs-rebase', 'semver'],
  text: {
    fr: {
      title: 'Stratégie de branches : Git Flow simplifié',
      summary:
        'Une organisation claire des branches pour que `main` reste toujours stable et que chacun travaille sans gêner les autres.',
      sections: [
        {
          heading: 'Les branches permanentes',
          blocks: [
            {
              type: 'list',
              items: [
                '`main` : le code stable, celui qui est en production. On n’y commite jamais directement.',
                '`develop` : la branche d’intégration, où se rejoignent les fonctionnalités terminées. Toutes les nouvelles branches en partent.',
              ],
            },
          ],
        },
        {
          heading: 'Les branches temporaires',
          blocks: [
            {
              type: 'list',
              items: [
                '`feature/<nom>` : une fonctionnalité, créée depuis `develop` et fusionnée dans `develop`.',
                '`fix/<nom>` : la correction d’un bug non urgent, même trajet qu’une feature.',
                '`release/<x.y.z>` : la préparation d’une version (derniers correctifs, numéro de version), fusionnée dans `main` (avec un tag) puis dans `develop`.',
                '`hotfix/<nom>` : un correctif urgent en production, créé depuis `main`, fusionné dans `main` ET dans `develop`.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Les noms sont courts, en anglais, en minuscules avec des tirets : `feature/password-reset`, `fix/login-redirect`.',
            },
          ],
        },
        {
          heading: 'Le cycle d’une fonctionnalité',
          blocks: [
            {
              type: 'code',
              code: 'git checkout develop\ngit checkout -b feature/password-reset\n# ... commits ...\ngit checkout develop\ngit merge --no-ff feature/password-reset\ngit branch -d feature/password-reset',
            },
            {
              type: 'paragraph',
              text: '`--no-ff` conserve un commit de fusion : on voit dans le graphe quels commits appartenaient à la fonctionnalité.',
            },
          ],
        },
        {
          heading: 'Garder ça simple',
          blocks: [
            {
              type: 'paragraph',
              text: 'Pour un petit projet ou une équipe qui livre souvent, le **GitHub Flow** suffit : seulement `main` et des branches courtes fusionnées via pull request. L’important est que toute l’équipe suive la même règle.',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Branching strategy: simplified Git Flow',
      summary:
        'A clear branch layout so that `main` always stays stable and everyone works without getting in each other’s way.',
      sections: [
        {
          heading: 'Long-lived branches',
          blocks: [
            {
              type: 'list',
              items: [
                '`main`: the stable code, the one in production. Never commit to it directly.',
                '`develop`: the integration branch where finished features meet. Every new branch starts from it.',
              ],
            },
          ],
        },
        {
          heading: 'Short-lived branches',
          blocks: [
            {
              type: 'list',
              items: [
                '`feature/<name>`: one feature, created from `develop` and merged into `develop`.',
                '`fix/<name>`: a non-urgent bug fix, same path as a feature.',
                '`release/<x.y.z>`: preparing a version (last fixes, version number), merged into `main` (with a tag) and back into `develop`.',
                '`hotfix/<name>`: an urgent production fix, created from `main`, merged into `main` AND `develop`.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Names are short, in English, lowercase with dashes: `feature/password-reset`, `fix/login-redirect`.',
            },
          ],
        },
        {
          heading: 'The life of a feature',
          blocks: [
            {
              type: 'code',
              code: 'git checkout develop\ngit checkout -b feature/password-reset\n# ... commits ...\ngit checkout develop\ngit merge --no-ff feature/password-reset\ngit branch -d feature/password-reset',
            },
            {
              type: 'paragraph',
              text: '`--no-ff` keeps a merge commit: the graph shows which commits belonged to the feature.',
            },
          ],
        },
        {
          heading: 'Keep it simple',
          blocks: [
            {
              type: 'paragraph',
              text: 'For a small project or a team that ships often, **GitHub Flow** is enough: only `main` and short branches merged through pull requests. What matters is that the whole team follows the same rule.',
            },
          ],
        },
      ],
    },
  },
};
