import type { CommandDoc } from '../model';

export const stashDoc: CommandDoc = {
  kind: 'command',
  id: 'stash',
  title: 'git stash',
  category: 'undo',
  related: ['checkout', 'commit', 'status'],
  text: {
    fr: {
      summary: 'Met de côté tes modifications en cours pour retrouver un dossier propre.',
      description: [
        'Tu es au milieu d’un travail et tu dois changer de branche en urgence ? `git stash` range tes modifications (index et fichiers suivis) dans une pile, et remet ton dossier dans l’état du dernier commit.',
        'Plus tard, `git stash pop` les réapplique, sur la même branche ou sur une autre. La pile peut contenir plusieurs entrées : `stash@{0}` est toujours la plus récente.',
      ],
      options: [
        {
          syntax: 'git stash [push] [-m "<message>"]',
          text: 'Met les modifications de côté, avec un message facultatif.',
        },
        {
          syntax: 'git stash -u',
          text: 'Inclut aussi les fichiers non suivis (`--include-untracked`).',
        },
        { syntax: 'git stash list', text: 'Affiche la pile.' },
        {
          syntax: 'git stash pop [stash@{n}]',
          text: 'Réapplique une entrée puis la retire de la pile.',
        },
        {
          syntax: 'git stash apply [stash@{n}]',
          text: 'Réapplique une entrée en la gardant dans la pile.',
        },
        { syntax: 'git stash drop [stash@{n}]', text: 'Supprime une entrée sans l’appliquer.' },
      ],
      examples: [
        {
          command: 'git stash -m "wip: login form"',
          text: 'Range ton travail en cours avec une description.',
        },
        { command: 'git stash list', text: 'Retrouve ce que tu as mis de côté.' },
        { command: 'git stash pop', text: 'Récupère la dernière entrée.' },
      ],
      underTheHood: [
        'Le graphe ne change pas : dans Agitz, le stash est conservé à part, hors des branches. Ce qui change, c’est l’explorateur de fichiers, qui redevient propre.',
        'Dans le vrai Git, chaque entrée est stockée sous forme de commits spéciaux référencés par `refs/stash`, invisibles dans `git log`.',
      ],
      pitfalls: [
        'Les fichiers non suivis ne sont pas rangés sans `-u` : ils restent dans le dossier.',
        'Oublier ce qu’on a mis de côté : utilise des messages et consulte `git stash list`.',
        '`git stash drop` est définitif : l’entrée supprimée est perdue.',
        '`pop` peut provoquer des conflits ; l’entrée est alors gardée dans la pile.',
      ],
    },
    en: {
      summary: 'Puts your ongoing changes aside to get a clean folder back.',
      description: [
        'In the middle of something and need to switch branches right now? `git stash` stores your changes (index and tracked files) on a stack and puts your folder back to the last commit.',
        'Later, `git stash pop` applies them again, on the same branch or another one. The stack can hold several entries: `stash@{0}` is always the most recent.',
      ],
      options: [
        {
          syntax: 'git stash [push] [-m "<message>"]',
          text: 'Puts the changes aside, with an optional message.',
        },
        { syntax: 'git stash -u', text: 'Also includes untracked files (`--include-untracked`).' },
        { syntax: 'git stash list', text: 'Shows the stack.' },
        {
          syntax: 'git stash pop [stash@{n}]',
          text: 'Applies an entry back, then removes it from the stack.',
        },
        {
          syntax: 'git stash apply [stash@{n}]',
          text: 'Applies an entry back and keeps it on the stack.',
        },
        { syntax: 'git stash drop [stash@{n}]', text: 'Deletes an entry without applying it.' },
      ],
      examples: [
        {
          command: 'git stash -m "wip: login form"',
          text: 'Puts your ongoing work aside with a description.',
        },
        { command: 'git stash list', text: 'Finds what you put aside.' },
        { command: 'git stash pop', text: 'Gets the latest entry back.' },
      ],
      underTheHood: [
        'The graph does not change: in Agitz the stash is kept apart, outside the branches. What changes is the file explorer, which turns clean again.',
        'In real Git, each entry is stored as special commits referenced by `refs/stash`, hidden from `git log`.',
      ],
      pitfalls: [
        'Untracked files are not stored without `-u`: they stay in the folder.',
        'Forgetting what you put aside: use messages and check `git stash list`.',
        '`git stash drop` is final: the deleted entry is lost.',
        '`pop` can cause conflicts; the entry is then kept on the stack.',
      ],
    },
  },
};
