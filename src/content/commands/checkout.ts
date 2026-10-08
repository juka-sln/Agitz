import type { CommandDoc } from '../model';

export const checkoutDoc: CommandDoc = {
  kind: 'command',
  id: 'checkout',
  title: 'git checkout',
  category: 'branches',
  related: ['branch', 'stash', 'reset'],
  text: {
    fr: {
      summary: 'Change de branche, se place sur un commit ou restaure des fichiers.',
      description: [
        '`git checkout <branche>` déplace HEAD sur une autre branche et remplace les fichiers du dossier par ceux de son dernier commit. C’est ainsi qu’on passe d’une tâche à l’autre.',
        '`git checkout <commit>` se place sur un commit précis sans branche : c’est le **HEAD détaché**, utile pour explorer le passé.',
        '`git checkout -- <fichier>` jette les modifications locales d’un fichier en le restaurant depuis l’index. Git moderne propose aussi `git switch` (branches) et `git restore` (fichiers), qui séparent ces deux usages.',
      ],
      options: [
        { syntax: 'git checkout <branche>', text: 'Bascule sur une branche existante.' },
        { syntax: 'git checkout -b <nom> [<départ>]', text: 'Crée une branche et bascule dessus.' },
        {
          syntax: 'git checkout <commit>',
          text: 'Détache HEAD sur ce commit (`--detach` pour une branche).',
        },
        { syntax: 'git checkout -- <fichier>...', text: 'Restaure des fichiers depuis l’index.' },
        {
          syntax: 'git checkout <commit> -- <fichier>...',
          text: 'Restaure des fichiers tels qu’ils étaient dans ce commit.',
        },
      ],
      examples: [
        { command: 'git checkout -b feature/login', text: 'Démarre une nouvelle fonctionnalité.' },
        { command: 'git checkout main', text: 'Revient sur la branche principale.' },
        { command: 'git checkout HEAD~2', text: 'Remonte deux commits en arrière pour regarder.' },
        {
          command: 'git checkout -- index.html',
          text: 'Annule tes modifications non commitées de `index.html`.',
        },
      ],
      underTheHood: [
        'Sur le graphe, le marqueur « Tu es ici » (HEAD) saute vers la station de la branche choisie. Les lignes et les stations, elles, ne bougent pas : rien n’est créé ni détruit.',
        'En HEAD détaché, le marqueur n’est accroché à aucune étiquette. Si tu commites là, les nouvelles stations ne seront suivies par aucune branche et deviendront introuvables quand tu repartiras.',
      ],
      pitfalls: [
        'Changer de branche avec des modifications non commitées : Git refuse si elles seraient écrasées. Commite ou fais `git stash` d’abord.',
        '`git checkout -- <fichier>` est irréversible : les modifications jetées ne sont enregistrées nulle part.',
        'Travailler en HEAD détaché sans s’en rendre compte : le prompt affiche alors un hash au lieu d’un nom de branche.',
      ],
    },
    en: {
      summary: 'Switches branches, moves to a commit or restores files.',
      description: [
        '`git checkout <branch>` moves HEAD to another branch and replaces the files in the folder with those of its last commit. That is how you go from one task to another.',
        '`git checkout <commit>` moves onto a specific commit with no branch: a **detached HEAD**, useful to explore the past.',
        '`git checkout -- <file>` throws away local changes to a file by restoring it from the index. Modern Git also offers `git switch` (branches) and `git restore` (files), which split these two uses.',
      ],
      options: [
        { syntax: 'git checkout <branch>', text: 'Switches to an existing branch.' },
        {
          syntax: 'git checkout -b <name> [<start>]',
          text: 'Creates a branch and switches to it.',
        },
        {
          syntax: 'git checkout <commit>',
          text: 'Detaches HEAD at this commit (`--detach` for a branch).',
        },
        { syntax: 'git checkout -- <file>...', text: 'Restores files from the index.' },
        {
          syntax: 'git checkout <commit> -- <file>...',
          text: 'Restores files as they were in that commit.',
        },
      ],
      examples: [
        { command: 'git checkout -b feature/login', text: 'Starts a new feature.' },
        { command: 'git checkout main', text: 'Goes back to the main branch.' },
        { command: 'git checkout HEAD~2', text: 'Steps two commits back to have a look.' },
        {
          command: 'git checkout -- index.html',
          text: 'Discards your uncommitted changes to `index.html`.',
        },
      ],
      underTheHood: [
        'On the graph, the "You are here" marker (HEAD) jumps to the station of the chosen branch. Lines and stations do not move: nothing is created or destroyed.',
        'With a detached HEAD the marker is not attached to any label. If you commit there, no branch follows the new stations and they become hard to find once you leave.',
      ],
      pitfalls: [
        'Switching branches with uncommitted changes: Git refuses if they would be overwritten. Commit or `git stash` first.',
        '`git checkout -- <file>` cannot be undone: the discarded changes are stored nowhere.',
        'Working on a detached HEAD without noticing: the prompt then shows a hash instead of a branch name.',
      ],
    },
  },
};
