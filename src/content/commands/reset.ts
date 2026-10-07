import type { CommandDoc } from '../model';

export const resetDoc: CommandDoc = {
  kind: 'command',
  id: 'reset',
  title: 'git reset',
  category: 'undo',
  related: ['revert', 'commit', 'add'],
  text: {
    fr: {
      summary:
        'Déplace la branche courante sur un autre commit, ou retire des fichiers de l’index.',
      description: [
        '`git reset <commit>` fait reculer (ou avancer) l’étiquette de ta branche jusqu’à `<commit>`. Le mode choisit ce qui arrive à l’index et à tes fichiers : `--soft` ne touche à rien d’autre, `--mixed` (par défaut) vide l’index, `--hard` remet aussi les fichiers du disque à l’identique.',
        '`git reset <fichier>` est l’inverse de `git add` : le fichier sort de l’index, mais tes modifications restent sur le disque.',
      ],
      options: [
        {
          syntax: 'git reset --soft <commit>',
          text: 'Déplace la branche ; l’index et les fichiers sont conservés. Idéal pour regrouper des commits.',
        },
        {
          syntax: 'git reset [--mixed] <commit>',
          text: 'Déplace la branche et vide l’index ; tes fichiers restent modifiés.',
        },
        {
          syntax: 'git reset --hard <commit>',
          text: 'Déplace la branche et écrase l’index ET les fichiers. Destructeur.',
        },
        {
          syntax: 'git reset [--] <fichier>...',
          text: 'Retire des fichiers de l’index (annule un `git add`).',
        },
      ],
      examples: [
        { command: 'git reset README.md', text: 'Annule le `git add` de `README.md`.' },
        {
          command: 'git reset --soft HEAD~1',
          text: 'Défait le dernier commit en gardant ses changements prêts à être recommités.',
        },
        {
          command: 'git reset HEAD~2',
          text: 'Retire les deux derniers commits ; leurs changements restent dans tes fichiers.',
        },
        { command: 'git reset --hard HEAD', text: 'Jette toutes les modifications non commitées.' },
      ],
      underTheHood: [
        'Sur le graphe, l’étiquette de la branche (et le marqueur HEAD) recule le long de la ligne. Les stations dépassées ne sont plus suivies par aucune branche : elles passent en pointillés.',
        '`HEAD~1` désigne le parent de HEAD, `HEAD~2` le grand-parent, etc. Tu peux aussi donner un hash ou un nom de branche.',
      ],
      pitfalls: [
        '`--hard` supprime définitivement le travail non commité : vérifie avec `git status` avant.',
        'Faire un `reset` sur des commits déjà partagés : utilise plutôt `git revert`.',
        'Oublier qu’en mode `--mixed` les changements sont toujours là : `git status` les montre en rouge.',
      ],
    },
    en: {
      summary: 'Moves the current branch to another commit, or removes files from the index.',
      description: [
        '`git reset <commit>` moves your branch label back (or forward) to `<commit>`. The mode decides what happens to the index and your files: `--soft` touches nothing else, `--mixed` (the default) clears the index, `--hard` also resets the files on disk.',
        '`git reset <file>` is the opposite of `git add`: the file leaves the index, but your changes stay on disk.',
      ],
      options: [
        {
          syntax: 'git reset --soft <commit>',
          text: 'Moves the branch; index and files are kept. Ideal to squash commits.',
        },
        {
          syntax: 'git reset [--mixed] <commit>',
          text: 'Moves the branch and clears the index; your files stay modified.',
        },
        {
          syntax: 'git reset --hard <commit>',
          text: 'Moves the branch and overwrites the index AND the files. Destructive.',
        },
        {
          syntax: 'git reset [--] <file>...',
          text: 'Removes files from the index (undoes a `git add`).',
        },
      ],
      examples: [
        { command: 'git reset README.md', text: 'Undoes the `git add` of `README.md`.' },
        {
          command: 'git reset --soft HEAD~1',
          text: 'Undoes the last commit and keeps its changes ready to commit again.',
        },
        {
          command: 'git reset HEAD~2',
          text: 'Removes the last two commits; their changes stay in your files.',
        },
        { command: 'git reset --hard HEAD', text: 'Throws away every uncommitted change.' },
      ],
      underTheHood: [
        'On the graph, the branch label (and the HEAD marker) moves back along the line. The stations left behind are no longer followed by any branch: they turn dashed.',
        '`HEAD~1` is the parent of HEAD, `HEAD~2` the grandparent, and so on. You can also give a hash or a branch name.',
      ],
      pitfalls: [
        '`--hard` deletes uncommitted work for good: check with `git status` first.',
        'Resetting commits you already shared: use `git revert` instead.',
        'Forgetting that with `--mixed` the changes are still there: `git status` shows them in red.',
      ],
    },
  },
};
