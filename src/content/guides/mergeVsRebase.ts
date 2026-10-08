import type { GuideDoc } from '../model';

export const mergeVsRebaseGuide: GuideDoc = {
  kind: 'guide',
  id: 'merge-vs-rebase',
  related: ['merge', 'rebase', 'branching-strategy'],
  text: {
    fr: {
      title: 'Merge ou rebase ?',
      summary:
        'Deux façons d’intégrer le travail d’une branche dans une autre, avec des historiques très différents.',
      sections: [
        {
          heading: 'Ce que fait chacun',
          blocks: [
            {
              type: 'list',
              items: [
                '**Merge** relie les deux historiques par un commit de fusion. Rien n’est réécrit : on voit exactement comment le travail s’est déroulé, en parallèle.',
                '**Rebase** rejoue tes commits au bout de l’autre branche. L’historique devient une ligne droite, mais tes commits sont recréés avec de nouveaux hash.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Essaie les deux dans le terminal et regarde le graphe : avec merge, deux lignes se rejoignent ; avec rebase, ta ligne est déplacée au bout de l’autre.',
            },
          ],
        },
        {
          heading: 'Quand utiliser merge',
          blocks: [
            {
              type: 'list',
              items: [
                'Pour intégrer une branche terminée dans une branche partagée (`feature` → `develop`, `release` → `main`).',
                'Dès que les commits ont déjà été poussés et utilisés par d’autres.',
                'Quand tu veux garder la trace qu’un ensemble de commits formait une fonctionnalité (`--no-ff`).',
              ],
            },
          ],
        },
        {
          heading: 'Quand utiliser rebase',
          blocks: [
            {
              type: 'list',
              items: [
                'Pour mettre ta branche **locale** à jour avec `develop` avant de la proposer : `git rebase develop`.',
                'Pour nettoyer tes propres commits avant de les partager (avec `rebase -i` dans le vrai Git).',
                'Quand l’équipe préfère un historique linéaire et facile à lire.',
              ],
            },
          ],
        },
        {
          heading: 'La règle d’or',
          blocks: [
            {
              type: 'paragraph',
              text: '**Ne rebase jamais des commits que d’autres ont déjà récupérés.** Rebaser réécrit l’historique : tes coéquipiers se retrouveraient avec des commits qui n’existent plus de ton côté. En cas de doute, fusionne.',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Merge or rebase?',
      summary:
        'Two ways to bring the work of one branch into another, with very different histories.',
      sections: [
        {
          heading: 'What each one does',
          blocks: [
            {
              type: 'list',
              items: [
                '**Merge** joins both histories with a merge commit. Nothing is rewritten: you see exactly how the work happened, in parallel.',
                '**Rebase** replays your commits at the end of the other branch. History becomes a straight line, but your commits are recreated with new hashes.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Try both in the terminal and watch the graph: with merge, two lines join; with rebase, your line is moved to the end of the other one.',
            },
          ],
        },
        {
          heading: 'When to merge',
          blocks: [
            {
              type: 'list',
              items: [
                'To integrate a finished branch into a shared branch (`feature` → `develop`, `release` → `main`).',
                'As soon as the commits were pushed and used by others.',
                'When you want to keep track that a set of commits formed a feature (`--no-ff`).',
              ],
            },
          ],
        },
        {
          heading: 'When to rebase',
          blocks: [
            {
              type: 'list',
              items: [
                'To bring your **local** branch up to date with `develop` before proposing it: `git rebase develop`.',
                'To clean up your own commits before sharing them (with `rebase -i` in real Git).',
                'When the team prefers a linear, easy-to-read history.',
              ],
            },
          ],
        },
        {
          heading: 'The golden rule',
          blocks: [
            {
              type: 'paragraph',
              text: '**Never rebase commits that others already fetched.** Rebasing rewrites history: your teammates would end up with commits that no longer exist on your side. When in doubt, merge.',
            },
          ],
        },
      ],
    },
  },
};
