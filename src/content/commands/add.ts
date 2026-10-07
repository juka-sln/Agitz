import type { CommandDoc } from '../model';

export const addDoc: CommandDoc = {
  kind: 'command',
  id: 'add',
  title: 'git add',
  category: 'basics',
  related: ['status', 'commit', 'reset', 'gitignore'],
  text: {
    fr: {
      summary: 'Place des changements dans l’index, la zone de préparation du prochain commit.',
      description: [
        'Git ne commite jamais directement ce qu’il y a sur le disque. Il commite le contenu de l’**index** (aussi appelé *staging area*). `git add` copie l’état actuel d’un fichier dans l’index.',
        'Cette étape intermédiaire te permet de choisir précisément ce qui part dans chaque commit : tu peux modifier dix fichiers et n’en commiter que trois.',
        'Pendant une fusion ou un rebase, `git add` sert aussi à marquer un fichier en conflit comme résolu.',
      ],
      options: [
        { syntax: 'git add <fichier>...', text: 'Ajoute un ou plusieurs fichiers (ou dossiers).' },
        { syntax: 'git add .', text: 'Ajoute tout ce qui a changé dans le dossier courant.' },
        {
          syntax: 'git add -A',
          text: 'Ajoute tous les changements du dépôt, suppressions comprises (`--all`).',
        },
        {
          syntax: 'git add -u',
          text: 'Met à jour uniquement les fichiers déjà suivis, sans les nouveaux (`--update`).',
        },
      ],
      examples: [
        { command: 'git add README.md', text: 'Prépare un seul fichier.' },
        { command: 'git add src', text: 'Prépare tout le contenu du dossier `src`.' },
        {
          command: 'git add .',
          text: 'Prépare tous les changements, puis vérifie avec `git status`.',
        },
      ],
      underTheHood: [
        'Le graphe ne bouge pas : `git add` ne crée aucun commit. Ce qui change, c’est la couleur des fichiers dans l’explorateur et dans `git status` : ils passent du rouge au vert.',
        'Git calcule l’empreinte (hash) du contenu et la range dans l’index. Si tu modifies encore le fichier après `git add`, l’index garde l’ancienne version : il faut refaire `git add`.',
      ],
      pitfalls: [
        'Oublier de refaire `git add` après une nouvelle modification : le commit contiendra l’ancienne version.',
        '`git add .` ajoute aussi les fichiers que tu ne voulais pas suivre. Un bon `.gitignore` évite ça.',
        'Un dossier vide ne peut pas être ajouté : Git ne suit que des fichiers.',
      ],
    },
    en: {
      summary: 'Puts changes into the index, the staging area for the next commit.',
      description: [
        'Git never commits what is on disk directly. It commits the content of the **index** (also called the *staging area*). `git add` copies the current state of a file into the index.',
        'This middle step lets you choose exactly what goes into each commit: you can change ten files and commit only three of them.',
        'During a merge or a rebase, `git add` also marks a conflicted file as resolved.',
      ],
      options: [
        { syntax: 'git add <file>...', text: 'Adds one or more files (or folders).' },
        { syntax: 'git add .', text: 'Adds everything that changed in the current folder.' },
        {
          syntax: 'git add -A',
          text: 'Adds every change in the repository, deletions included (`--all`).',
        },
        {
          syntax: 'git add -u',
          text: 'Only updates files Git already tracks, ignoring new ones (`--update`).',
        },
      ],
      examples: [
        { command: 'git add README.md', text: 'Stages a single file.' },
        { command: 'git add src', text: 'Stages the whole content of the `src` folder.' },
        { command: 'git add .', text: 'Stages every change, then check with `git status`.' },
      ],
      underTheHood: [
        'The graph does not move: `git add` creates no commit. What changes is the color of the files in the explorer and in `git status`: they turn from red to green.',
        'Git computes a fingerprint (hash) of the content and stores it in the index. If you edit the file again after `git add`, the index keeps the old version: run `git add` again.',
      ],
      pitfalls: [
        'Forgetting to `git add` again after a new edit: the commit will hold the old version.',
        '`git add .` also adds files you did not want to track. A good `.gitignore` prevents that.',
        'An empty folder cannot be added: Git only tracks files.',
      ],
    },
  },
};
