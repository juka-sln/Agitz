import type { GuideDoc } from '../model';

const MARKERS =
  '# Bakery\n<<<<<<< HEAD\nOpen from 7am to 7pm, closed on Sundays.\n=======\nOpen every day from 6am to 8pm.\n>>>>>>> origin/docs/opening-hours';

const STEPS =
  'git status                 # which files are in conflict?\n# edit each file, remove the markers\ngit add README.md          # mark it as resolved\ngit commit                 # or: git rebase --continue';

export const resolvingConflictsGuide: GuideDoc = {
  kind: 'guide',
  id: 'resolving-conflicts',
  related: ['merge', 'rebase', 'status', 'add', 'merge-vs-rebase'],
  text: {
    fr: {
      title: 'Résoudre un conflit',
      summary:
        'Pourquoi Git s’arrête quand deux personnes modifient les mêmes lignes, et comment reprendre la main sans rien perdre.',
      sections: [
        {
          heading: 'D’où vient un conflit',
          blocks: [
            {
              type: 'paragraph',
              text: 'Git fusionne tout seul les modifications qui touchent des endroits différents d’un fichier. Quand les **deux côtés changent les mêmes lignes** (ou des lignes voisines), il ne peut pas deviner laquelle garder : il s’arrête et te laisse décider. Un conflit n’est pas une erreur, c’est une question.',
            },
            {
              type: 'list',
              items: [
                'Ça peut arriver avec `git merge`, `git pull`, `git rebase`, `git cherry-pick`, `git revert` et `git stash pop`.',
                'Le prompt l’indique (`MERGING`, `REBASE 1/3`…) et `git status` liste les fichiers « both modified ».',
                'Les fichiers sans conflit sont déjà fusionnés et ajoutés à l’index.',
              ],
            },
          ],
        },
        {
          heading: 'Lire les marqueurs',
          blocks: [
            {
              type: 'paragraph',
              text: 'Dans chaque fichier en conflit, Git écrit les deux versions l’une sous l’autre :',
            },
            { type: 'code', code: MARKERS },
            {
              type: 'list',
              items: [
                'Entre `<<<<<<<` et `=======` : la version **actuelle**, celle de `HEAD` (ta branche).',
                'Entre `=======` et `>>>>>>>` : la version **entrante**, celle de la branche que tu fusionnes.',
                'Pendant un **rebase**, les rôles s’inversent : `HEAD` est la branche sur laquelle tes commits sont rejoués, et la version entrante est ton propre commit.',
              ],
            },
          ],
        },
        {
          heading: 'Les trois étapes',
          blocks: [
            {
              type: 'list',
              items: [
                '**Corriger** : écris le contenu final. Garde une version, l’autre, les deux, ou réécris la ligne ; puis supprime les trois lignes de marqueurs.',
                '**Marquer comme résolu** : `git add <fichier>`. C’est ce qui dit à Git que le conflit est réglé, pas l’enregistrement du fichier.',
                '**Terminer** : `git commit` pour un merge, `git rebase --continue` (ou `cherry-pick` / `revert --continue`) pour une opération commit par commit.',
              ],
            },
            { type: 'code', code: STEPS },
            {
              type: 'paragraph',
              text: 'Dans Agitz, l’**éditeur** (bouton en haut à droite, ou clic sur un fichier) affiche chaque conflit avec des boutons « Garder l’actuelle / l’entrante / les deux » et lance ces commandes pour toi dans le terminal.',
            },
          ],
        },
        {
          heading: 'Faire marche arrière',
          blocks: [
            {
              type: 'paragraph',
              text: '`git merge --abort` (ou `git rebase --abort`, `git cherry-pick --abort`…) remet tout comme avant la commande. C’est la sortie de secours quand tu ne sais pas quoi garder : discute avec ton coéquipier, puis recommence.',
            },
          ],
        },
        {
          heading: 'Moins de conflits',
          blocks: [
            {
              type: 'list',
              items: [
                'Récupère souvent le travail des autres (`git pull`) et intègre tôt : un petit conflit aujourd’hui vaut mieux qu’un énorme dans deux semaines.',
                'Fais des branches courtes et des commits ciblés.',
                'Ne reformate pas tout un fichier dans le même commit qu’une vraie modification.',
                'Après la résolution, relis le résultat : un fichier sans marqueur n’est pas forcément correct. Lance les tests si le projet en a.',
              ],
            },
          ],
        },
      ],
    },
    en: {
      title: 'Resolving a conflict',
      summary:
        'Why Git stops when two people change the same lines, and how to take back control without losing anything.',
      sections: [
        {
          heading: 'Where a conflict comes from',
          blocks: [
            {
              type: 'paragraph',
              text: 'Git merges changes to different parts of a file on its own. When **both sides change the same lines** (or neighbouring lines), it cannot guess which one to keep: it stops and lets you decide. A conflict is not an error, it is a question.',
            },
            {
              type: 'list',
              items: [
                'It can happen with `git merge`, `git pull`, `git rebase`, `git cherry-pick`, `git revert` and `git stash pop`.',
                'The prompt shows it (`MERGING`, `REBASE 1/3`…) and `git status` lists the “both modified” files.',
                'Files without a conflict are already merged and added to the index.',
              ],
            },
          ],
        },
        {
          heading: 'Reading the markers',
          blocks: [
            {
              type: 'paragraph',
              text: 'In each conflicted file, Git writes both versions one below the other:',
            },
            { type: 'code', code: MARKERS },
            {
              type: 'list',
              items: [
                'Between `<<<<<<<` and `=======`: the **current** version, the one of `HEAD` (your branch).',
                'Between `=======` and `>>>>>>>`: the **incoming** version, the one of the branch you merge.',
                'During a **rebase** the roles are swapped: `HEAD` is the branch your commits are replayed onto, and the incoming version is your own commit.',
              ],
            },
          ],
        },
        {
          heading: 'The three steps',
          blocks: [
            {
              type: 'list',
              items: [
                '**Fix**: write the final content. Keep one version, the other, both, or rewrite the line; then remove the three marker lines.',
                '**Mark as resolved**: `git add <file>`. This is what tells Git the conflict is settled, not saving the file.',
                '**Finish**: `git commit` for a merge, `git rebase --continue` (or `cherry-pick` / `revert --continue`) for an operation that goes commit by commit.',
              ],
            },
            { type: 'code', code: STEPS },
            {
              type: 'paragraph',
              text: 'In Agitz, the **editor** (button at the top right, or a click on a file) shows each conflict with “Keep current / incoming / both” buttons and runs these commands for you in the terminal.',
            },
          ],
        },
        {
          heading: 'Going back',
          blocks: [
            {
              type: 'paragraph',
              text: '`git merge --abort` (or `git rebase --abort`, `git cherry-pick --abort`…) puts everything back as it was before the command. It is the way out when you do not know what to keep: talk with your teammate, then start again.',
            },
          ],
        },
        {
          heading: 'Fewer conflicts',
          blocks: [
            {
              type: 'list',
              items: [
                'Get the work of others often (`git pull`) and integrate early: a small conflict today beats a huge one in two weeks.',
                'Keep branches short and commits focused.',
                'Do not reformat a whole file in the same commit as a real change.',
                'After resolving, read the result again: a file without markers is not necessarily right. Run the tests if the project has some.',
              ],
            },
          ],
        },
      ],
    },
  },
};
