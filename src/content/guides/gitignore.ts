import type { GuideDoc } from '../model';

export const gitignoreGuide: GuideDoc = {
  kind: 'guide',
  id: 'gitignore',
  related: ['add', 'status', 'init'],
  text: {
    fr: {
      title: 'Écrire un bon .gitignore',
      summary:
        'Le fichier `.gitignore` liste ce que Git doit ignorer : dépendances, fichiers générés, secrets et réglages personnels.',
      sections: [
        {
          heading: 'Pourquoi',
          blocks: [
            {
              type: 'paragraph',
              text: 'Un dépôt ne doit contenir que ce qui est nécessaire pour reconstruire le projet. Les fichiers ignorés n’apparaissent plus dans `git status` et `git add .` ne les embarque plus.',
            },
          ],
        },
        {
          heading: 'Quoi ignorer',
          blocks: [
            {
              type: 'list',
              items: [
                'Les dépendances téléchargées : `node_modules/`, `vendor/`, `.venv/`.',
                'Ce qui est généré : `dist/`, `build/`, `coverage/`, `*.log`.',
                'Les **secrets** : `.env`, clés, certificats. Un secret commité reste dans l’historique même après suppression.',
                'Les fichiers propres à ta machine : `.DS_Store`, `Thumbs.db`, réglages d’éditeur (`.idea/`, `.vscode/`, sauf ceux partagés par l’équipe).',
              ],
            },
          ],
        },
        {
          heading: 'La syntaxe',
          blocks: [
            {
              type: 'code',
              code: '# A comment\nnode_modules/     # a folder, wherever it is\n/dist             # only at the root of the repository\n*.log             # every file ending in .log\n.env              # an exact file name\n!.env.example     # an exception: keep this one',
            },
          ],
        },
        {
          heading: 'Pièges courants',
          blocks: [
            {
              type: 'list',
              items: [
                '`.gitignore` n’agit que sur les fichiers **non suivis**. Un fichier déjà commité reste suivi : il faut d’abord le retirer de l’index avec `git rm --cached <fichier>`.',
                'Commiter le `.gitignore` lui-même, pour que toute l’équipe en profite.',
                'Fournir un `.env.example` sans valeurs secrètes pour montrer les variables attendues.',
                'Partir d’un modèle adapté à ton langage (github.com/github/gitignore) plutôt que d’une page blanche.',
              ],
            },
          ],
        },
      ],
    },
    en: {
      title: 'Writing a good .gitignore',
      summary:
        'The `.gitignore` file lists what Git must ignore: dependencies, generated files, secrets and personal settings.',
      sections: [
        {
          heading: 'Why',
          blocks: [
            {
              type: 'paragraph',
              text: 'A repository should only hold what is needed to rebuild the project. Ignored files no longer show in `git status`, and `git add .` no longer picks them up.',
            },
          ],
        },
        {
          heading: 'What to ignore',
          blocks: [
            {
              type: 'list',
              items: [
                'Downloaded dependencies: `node_modules/`, `vendor/`, `.venv/`.',
                'Generated output: `dist/`, `build/`, `coverage/`, `*.log`.',
                '**Secrets**: `.env`, keys, certificates. A committed secret stays in history even after deletion.',
                'Machine-specific files: `.DS_Store`, `Thumbs.db`, editor settings (`.idea/`, `.vscode/`, except those the team shares).',
              ],
            },
          ],
        },
        {
          heading: 'The syntax',
          blocks: [
            {
              type: 'code',
              code: '# A comment\nnode_modules/     # a folder, wherever it is\n/dist             # only at the root of the repository\n*.log             # every file ending in .log\n.env              # an exact file name\n!.env.example     # an exception: keep this one',
            },
          ],
        },
        {
          heading: 'Common pitfalls',
          blocks: [
            {
              type: 'list',
              items: [
                '`.gitignore` only applies to **untracked** files. A file already committed stays tracked: first remove it from the index with `git rm --cached <file>`.',
                'Commit the `.gitignore` itself so the whole team benefits from it.',
                'Provide a `.env.example` without secret values to show the expected variables.',
                'Start from a template for your language (github.com/github/gitignore) rather than a blank page.',
              ],
            },
          ],
        },
      ],
    },
  },
};
