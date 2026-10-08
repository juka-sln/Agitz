import type { CommandDoc } from '../model';

export const rebaseDoc: CommandDoc = {
  kind: 'command',
  id: 'rebase',
  title: 'git rebase',
  category: 'branches',
  related: ['merge', 'cherry-pick', 'merge-vs-rebase'],
  text: {
    fr: {
      summary: 'Rejoue les commits de ta branche au-dessus d’une autre base.',
      description: [
        '`git rebase main` prend les commits que ta branche possède en plus de `main`, les met de côté, place ta branche au bout de `main`, puis les rejoue un par un. Le résultat : un historique linéaire, comme si tu avais commencé ton travail aujourd’hui.',
        'Chaque commit rejoué est un **nouveau** commit (nouveau hash). C’est une réécriture de l’historique : à réserver aux commits que tu n’as pas encore partagés.',
      ],
      options: [
        { syntax: 'git rebase <base>', text: 'Rejoue la branche courante au-dessus de `<base>`.' },
        {
          syntax: 'git rebase --continue',
          text: 'Reprend après avoir résolu un conflit (et fait `git add`).',
        },
        {
          syntax: 'git rebase --skip',
          text: 'Abandonne le commit en conflit et passe au suivant.',
        },
        {
          syntax: 'git rebase --abort',
          text: 'Annule tout le rebase et revient à l’état de départ.',
        },
        {
          syntax: 'git rebase -i <base>',
          text: 'Mode interactif (réordonner, fusionner, éditer des commits) : pas encore simulé dans Agitz.',
        },
      ],
      examples: [
        {
          command: 'git rebase main',
          text: 'Depuis `feature`, met ta branche à jour avec les derniers commits de `main`.',
        },
        {
          command: 'git rebase --continue',
          text: 'Poursuit après avoir corrigé le conflit et fait `git add`.',
        },
        { command: 'git rebase --abort', text: 'Tout annuler en cas de doute.' },
      ],
      underTheHood: [
        'Sur le graphe, les stations de ta branche sont recréées une à une au bout de la ligne de la base, puis l’étiquette de ta branche saute sur la dernière. Les anciennes stations ne sont plus suivies par aucune branche (pointillés).',
        'Après le rebase, fusionner ta branche dans la base est une simple avance rapide : la ligne reste droite.',
      ],
      pitfalls: [
        'Rebaser une branche déjà poussée et utilisée par d’autres : leurs commits ne correspondront plus aux tiens. Règle d’or : on ne rebase pas l’historique public.',
        'Un même conflit peut revenir à chaque commit rejoué : c’est normal, chaque commit est appliqué séparément.',
        'Paniquer au milieu d’un rebase : `git status` indique où tu en es et `git rebase --abort` remet tout en place.',
      ],
    },
    en: {
      summary: 'Replays the commits of your branch on top of another base.',
      description: [
        '`git rebase main` takes the commits your branch has on top of `main`, sets them aside, moves your branch to the tip of `main`, then replays them one by one. The result is a linear history, as if you had started your work today.',
        'Each replayed commit is a **new** commit (new hash). This rewrites history: keep it for commits you have not shared yet.',
      ],
      options: [
        { syntax: 'git rebase <base>', text: 'Replays the current branch on top of `<base>`.' },
        {
          syntax: 'git rebase --continue',
          text: 'Resumes after resolving a conflict (and running `git add`).',
        },
        {
          syntax: 'git rebase --skip',
          text: 'Drops the conflicting commit and moves on to the next.',
        },
        {
          syntax: 'git rebase --abort',
          text: 'Cancels the whole rebase and goes back to the start.',
        },
        {
          syntax: 'git rebase -i <base>',
          text: 'Interactive mode (reorder, squash, edit commits): not simulated in Agitz yet.',
        },
      ],
      examples: [
        {
          command: 'git rebase main',
          text: 'From `feature`, brings your branch up to date with the latest commits of `main`.',
        },
        {
          command: 'git rebase --continue',
          text: 'Goes on once the conflict is fixed and staged with `git add`.',
        },
        { command: 'git rebase --abort', text: 'Cancels everything when in doubt.' },
      ],
      underTheHood: [
        'On the graph, the stations of your branch are recreated one by one at the end of the base line, then your branch label jumps onto the last one. The old stations are no longer followed by any branch (dashed).',
        'After the rebase, merging your branch into the base is a plain fast-forward: the line stays straight.',
      ],
      pitfalls: [
        'Rebasing a branch already pushed and used by others: their commits will no longer match yours. Golden rule: never rebase public history.',
        'The same conflict may come back for each replayed commit: that is normal, each commit is applied separately.',
        'Panicking in the middle of a rebase: `git status` tells you where you are and `git rebase --abort` puts everything back.',
      ],
    },
  },
};
