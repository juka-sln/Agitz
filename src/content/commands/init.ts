import type { CommandDoc } from '../model';

export const initDoc: CommandDoc = {
  kind: 'command',
  id: 'init',
  title: 'git init',
  category: 'basics',
  related: ['status', 'add', 'commit', 'gitignore'],
  text: {
    fr: {
      summary: 'Transforme le dossier courant en dépôt Git.',
      description: [
        '`git init` crée un dossier caché `.git` à la racine du projet. Tout ce que Git sait de ton projet (commits, branches, index) vit dans ce dossier : le supprimer, c’est supprimer l’historique.',
        'C’est la toute première commande d’un projet. On ne la lance qu’une fois par projet ; pour récupérer un projet existant, on utilise plutôt `git clone`.',
      ],
      options: [
        { syntax: 'git init', text: 'Crée le dépôt avec la branche par défaut `main`.' },
        {
          syntax: 'git init -b <nom>',
          text: 'Choisit le nom de la branche initiale (`--initial-branch=<nom>`).',
        },
      ],
      examples: [
        { command: 'git init', text: 'Démarre un dépôt dans le dossier du projet.' },
        {
          command: 'git init -b develop',
          text: 'Démarre un dépôt dont la première branche est `develop`.',
        },
        { command: 'ls -a', text: 'Affiche le dossier `.git` qui vient d’apparaître.' },
      ],
      underTheHood: [
        'Après `git init`, le graphe est vide : la branche `main` existe déjà par son nom, mais elle ne pointe sur aucun commit. Elle n’apparaîtra sur le plan qu’au premier commit.',
        'Tes fichiers existants ne sont pas encore suivis : Git sait qu’ils sont là (statut « non suivi ») mais ne les enregistre pas tant que tu ne fais pas `git add` puis `git commit`.',
      ],
      pitfalls: [
        'Lancer `git init` dans ton dossier personnel au lieu du dossier du projet : Git suivrait alors tout ton disque.',
        'Croire que `git init` enregistre les fichiers : il ne fait que préparer le dépôt.',
        'Relancer `git init` ne casse rien, mais ne réinitialise pas non plus l’historique.',
      ],
    },
    en: {
      summary: 'Turns the current folder into a Git repository.',
      description: [
        '`git init` creates a hidden `.git` folder at the root of the project. Everything Git knows about your project (commits, branches, index) lives there: deleting it deletes the history.',
        'It is the very first command of a project and you run it once. To get an existing project, use `git clone` instead.',
      ],
      options: [
        { syntax: 'git init', text: 'Creates the repository with the default branch `main`.' },
        {
          syntax: 'git init -b <name>',
          text: 'Picks the name of the initial branch (`--initial-branch=<name>`).',
        },
      ],
      examples: [
        { command: 'git init', text: 'Starts a repository in the project folder.' },
        {
          command: 'git init -b develop',
          text: 'Starts a repository whose first branch is `develop`.',
        },
        { command: 'ls -a', text: 'Shows the `.git` folder that just appeared.' },
      ],
      underTheHood: [
        'After `git init` the graph is empty: the `main` branch exists as a name, but it points to no commit yet. It shows up on the map with the first commit.',
        'Your existing files are not tracked yet: Git sees them (status "untracked") but records nothing until you run `git add`, then `git commit`.',
      ],
      pitfalls: [
        'Running `git init` in your home folder instead of the project folder: Git would then track your whole disk.',
        'Thinking `git init` saves the files: it only prepares the repository.',
        'Running `git init` again breaks nothing, but it does not reset the history either.',
      ],
    },
  },
};
