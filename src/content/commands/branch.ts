import type { CommandDoc } from '../model';

export const branchDoc: CommandDoc = {
  kind: 'command',
  id: 'branch',
  title: 'git branch',
  category: 'branches',
  related: ['checkout', 'merge', 'branching-strategy'],
  text: {
    fr: {
      summary: 'Liste, crée, renomme ou supprime des branches.',
      description: [
        'Une branche n’est qu’une **étiquette mobile** posée sur un commit. La créer est instantané : aucun fichier n’est copié. À chaque commit fait sur une branche, son étiquette avance sur le nouveau commit.',
        '`git branch <nom>` crée la branche mais ne bascule pas dessus. Pour créer et basculer en une fois : `git checkout -b <nom>`.',
      ],
      options: [
        {
          syntax: 'git branch',
          text: 'Liste les branches ; `*` marque la branche courante (`-v` ajoute le dernier commit).',
        },
        {
          syntax: 'git branch <nom> [<départ>]',
          text: 'Crée une branche sur HEAD ou sur le commit indiqué.',
        },
        { syntax: 'git branch -d <nom>', text: 'Supprime une branche déjà fusionnée.' },
        {
          syntax: 'git branch -D <nom>',
          text: 'Force la suppression, même si elle n’est pas fusionnée.',
        },
        {
          syntax: 'git branch -m [<ancien>] <nouveau>',
          text: 'Renomme une branche (`-M` pour écraser).',
        },
        {
          syntax: 'git branch -f <nom> <commit>',
          text: 'Déplace de force une branche sur un autre commit.',
        },
      ],
      examples: [
        {
          command: 'git branch feature/login',
          text: 'Crée une branche pour une nouvelle fonctionnalité.',
        },
        { command: 'git branch -v', text: 'Liste les branches avec leur dernier commit.' },
        { command: 'git branch -d feature/login', text: 'Nettoie une branche fusionnée.' },
        { command: 'git branch -m master main', text: 'Renomme `master` en `main`.' },
      ],
      underTheHood: [
        'Sur le graphe, une nouvelle branche ajoute une étiquette sur la station courante. Elle ne prendra sa propre ligne de couleur qu’au premier commit qui la fait diverger.',
        'Supprimer une branche retire l’étiquette, pas les commits. S’ils ne sont plus accessibles par aucune référence, ils s’affichent en pointillés : Git finira par les nettoyer.',
      ],
      pitfalls: [
        'Croire qu’on est sur la nouvelle branche après `git branch <nom>` : tes commits partiront sur l’ancienne. Vérifie avec `git status`.',
        'Supprimer la branche sur laquelle on se trouve : impossible, bascule d’abord ailleurs.',
        'Abuser de `-D` : tu peux perdre des commits non fusionnés.',
      ],
    },
    en: {
      summary: 'Lists, creates, renames or deletes branches.',
      description: [
        'A branch is just a **movable label** on a commit. Creating one is instant: no file is copied. Each commit made on a branch moves its label onto the new commit.',
        '`git branch <name>` creates the branch but does not switch to it. To create and switch in one go: `git checkout -b <name>`.',
      ],
      options: [
        {
          syntax: 'git branch',
          text: 'Lists branches; `*` marks the current one (`-v` adds the last commit).',
        },
        {
          syntax: 'git branch <name> [<start>]',
          text: 'Creates a branch on HEAD or on the given commit.',
        },
        { syntax: 'git branch -d <name>', text: 'Deletes a branch that is already merged.' },
        { syntax: 'git branch -D <name>', text: 'Forces the deletion, even if it is not merged.' },
        { syntax: 'git branch -m [<old>] <new>', text: 'Renames a branch (`-M` to overwrite).' },
        { syntax: 'git branch -f <name> <commit>', text: 'Forces a branch onto another commit.' },
      ],
      examples: [
        { command: 'git branch feature/login', text: 'Creates a branch for a new feature.' },
        { command: 'git branch -v', text: 'Lists branches with their last commit.' },
        { command: 'git branch -d feature/login', text: 'Cleans up a merged branch.' },
        { command: 'git branch -m master main', text: 'Renames `master` to `main`.' },
      ],
      underTheHood: [
        'On the graph, a new branch adds a label on the current station. It only gets its own colored line with the first commit that makes it diverge.',
        'Deleting a branch removes the label, not the commits. If no reference leads to them anymore, they show as dashed: Git will clean them up eventually.',
      ],
      pitfalls: [
        'Thinking you are on the new branch after `git branch <name>`: your commits will land on the old one. Check with `git status`.',
        'Deleting the branch you are on: impossible, switch elsewhere first.',
        'Overusing `-D`: you can lose unmerged commits.',
      ],
    },
  },
};
