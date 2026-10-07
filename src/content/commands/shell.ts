import type { CommandDoc } from '../model';

export const shellDoc: CommandDoc = {
  kind: 'command',
  id: 'shell',
  title: 'ls · cat · echo · touch · rm',
  category: 'shell',
  related: ['add', 'status', 'gitignore'],
  text: {
    fr: {
      summary: 'Les commandes du terminal pour créer et modifier les fichiers du projet simulé.',
      description: [
        'Le terminal d’Agitz imite un shell Unix. En plus de `git`, il comprend quelques commandes pour manipuler les fichiers : de quoi créer du contenu, le modifier et observer comment Git réagit.',
        'Les dossiers n’existent qu’à travers leurs fichiers, exactement comme pour Git : `touch src/app.ts` crée le dossier `src` automatiquement.',
      ],
      options: [
        {
          syntax: 'ls [-a] [<dossier>]',
          text: 'Liste les fichiers ; `-a` montre aussi le dossier `.git`.',
        },
        { syntax: 'cat <fichier>...', text: 'Affiche le contenu de fichiers.' },
        {
          syntax: 'echo "<texte>" > <fichier>',
          text: 'Écrit le texte dans le fichier (le remplace s’il existe).',
        },
        { syntax: 'echo "<texte>" >> <fichier>', text: 'Ajoute le texte à la fin du fichier.' },
        { syntax: 'touch <fichier>...', text: 'Crée des fichiers vides.' },
        {
          syntax: 'rm [-r] <chemin>...',
          text: 'Supprime des fichiers, ou des dossiers avec `-r`.',
        },
        {
          syntax: 'pwd · help · clear',
          text: 'Dossier courant, liste des commandes, effacer l’écran (aussi Ctrl+L).',
        },
      ],
      examples: [
        { command: 'echo "# My project" > README.md', text: 'Crée un fichier avec du contenu.' },
        {
          command: 'echo "Second line" >> README.md',
          text: 'Modifie le fichier pour voir un changement dans `git status`.',
        },
        { command: 'touch src/index.ts', text: 'Crée un fichier dans un nouveau dossier.' },
        { command: 'rm README.md', text: 'Supprime un fichier ; Git verra une suppression.' },
      ],
      underTheHood: [
        'Ces commandes ne touchent qu’à tes fichiers sur le disque, jamais au dépôt. L’explorateur de gauche se met à jour aussitôt et indique le statut Git de chaque fichier.',
        'Flèches haut/bas pour l’historique, Tab pour compléter une commande ou un nom de fichier, Échap pour quitter le terminal.',
      ],
      pitfalls: [
        '`>` écrase le fichier : utilise `>>` pour ajouter une ligne.',
        '`mkdir` seul ne sert à rien ici : un dossier vide n’existe pas pour Git.',
        'Seule `echo` accepte une redirection, et les enchaînements (`&&`, `|`) ne sont pas pris en charge.',
      ],
    },
    en: {
      summary: 'The terminal commands to create and edit the files of the simulated project.',
      description: [
        'The Agitz terminal mimics a Unix shell. Besides `git`, it understands a few commands to handle files: enough to create content, change it and watch how Git reacts.',
        'Folders only exist through their files, exactly like in Git: `touch src/app.ts` creates the `src` folder automatically.',
      ],
      options: [
        { syntax: 'ls [-a] [<folder>]', text: 'Lists files; `-a` also shows the `.git` folder.' },
        { syntax: 'cat <file>...', text: 'Prints the content of files.' },
        {
          syntax: 'echo "<text>" > <file>',
          text: 'Writes the text into the file (replacing it if it exists).',
        },
        { syntax: 'echo "<text>" >> <file>', text: 'Appends the text at the end of the file.' },
        { syntax: 'touch <file>...', text: 'Creates empty files.' },
        { syntax: 'rm [-r] <path>...', text: 'Deletes files, or folders with `-r`.' },
        {
          syntax: 'pwd · help · clear',
          text: 'Current folder, list of commands, clear the screen (also Ctrl+L).',
        },
      ],
      examples: [
        { command: 'echo "# My project" > README.md', text: 'Creates a file with some content.' },
        {
          command: 'echo "Second line" >> README.md',
          text: 'Edits the file to see a change in `git status`.',
        },
        { command: 'touch src/index.ts', text: 'Creates a file in a new folder.' },
        { command: 'rm README.md', text: 'Deletes a file; Git will see a deletion.' },
      ],
      underTheHood: [
        'These commands only touch your files on disk, never the repository. The explorer on the left updates right away and shows the Git status of each file.',
        'Up/down arrows browse history, Tab completes a command or a file name, Escape leaves the terminal.',
      ],
      pitfalls: [
        '`>` overwrites the file: use `>>` to add a line.',
        '`mkdir` alone is useless here: an empty folder does not exist for Git.',
        'Only `echo` accepts a redirection, and chaining (`&&`, `|`) is not supported.',
      ],
    },
  },
};
