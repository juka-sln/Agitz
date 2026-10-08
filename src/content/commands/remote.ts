import type { CommandDoc } from '../model';

export const remoteDoc: CommandDoc = {
  kind: 'command',
  id: 'remote',
  title: 'git remote',
  category: 'remote',
  related: ['clone', 'fetch', 'push', 'github-collaboration'],
  text: {
    fr: {
      summary: 'Gère les surnoms des dépôts distants avec lesquels tu échanges des commits.',
      description: [
        'Un **remote** est un nom court pour l’URL d’une autre copie du dépôt. Par convention, **`origin`** désigne le dépôt d’où tu as cloné, ou celui où tu publies ton travail.',
        'Ajouter un remote n’échange encore rien : il faut ensuite `git fetch` pour recevoir, `git push` pour envoyer.',
        'Quand tu crées un projet avec `git init`, il n’a aucun remote : `git remote add origin <url>` le relie au dépôt créé sur GitHub.',
      ],
      options: [
        { syntax: 'git remote', text: 'Liste les remotes.' },
        { syntax: 'git remote -v', text: 'Les liste avec leurs URL.' },
        { syntax: 'git remote add <nom> <url>', text: 'Ajoute un remote.' },
        { syntax: 'git remote remove <nom>', text: 'Le supprime, avec ses branches de suivi.' },
        { syntax: 'git remote rename <ancien> <nouveau>', text: 'Le renomme.' },
        { syntax: 'git remote set-url <nom> <url>', text: 'Change son URL.' },
      ],
      examples: [
        {
          command: 'git remote add origin https://github.com/alice/project.git',
          text: 'Relie ton dépôt local au dépôt partagé.',
        },
        { command: 'git remote -v', text: 'Vérifie où pointent `fetch` et `push`.' },
      ],
      underTheHood: [
        'Le remote est une simple ligne de configuration dans `.git/config` : rien ne change sur le graphe tant que tu n’as pas fait `fetch` ou `push`.',
        'Les branches `origin/main`, `origin/feature`… appartiennent au remote `origin` : supprimer ou renommer le remote les supprime ou les renomme aussi.',
      ],
      pitfalls: [
        'Se tromper d’URL : Git ne la vérifie qu’au premier `fetch` ou `push`, qui échoue alors avec « Repository not found ».',
        'Croire que `git remote add` télécharge le projet : il faut encore `git fetch` (ou `git pull`).',
      ],
    },
    en: {
      summary: 'Manages the nicknames of the remote repositories you exchange commits with.',
      description: [
        'A **remote** is a short name for the URL of another copy of the repository. By convention, **`origin`** is the repository you cloned from, or the one you publish your work to.',
        'Adding a remote does not exchange anything yet: then run `git fetch` to receive and `git push` to send.',
        'When you create a project with `git init`, it has no remote: `git remote add origin <url>` links it to the repository created on GitHub.',
      ],
      options: [
        { syntax: 'git remote', text: 'Lists the remotes.' },
        { syntax: 'git remote -v', text: 'Lists them with their URLs.' },
        { syntax: 'git remote add <name> <url>', text: 'Adds a remote.' },
        {
          syntax: 'git remote remove <name>',
          text: 'Removes it, with its remote-tracking branches.',
        },
        { syntax: 'git remote rename <old> <new>', text: 'Renames it.' },
        { syntax: 'git remote set-url <name> <url>', text: 'Changes its URL.' },
      ],
      examples: [
        {
          command: 'git remote add origin https://github.com/alice/project.git',
          text: 'Links your local repository to the shared one.',
        },
        { command: 'git remote -v', text: 'Checks where `fetch` and `push` point.' },
      ],
      underTheHood: [
        'A remote is a single configuration entry in `.git/config`: nothing changes on the graph until you `fetch` or `push`.',
        'The `origin/main`, `origin/feature`… branches belong to the `origin` remote: removing or renaming the remote removes or renames them too.',
      ],
      pitfalls: [
        'A wrong URL: Git only checks it on the first `fetch` or `push`, which then fails with “Repository not found”.',
        'Thinking that `git remote add` downloads the project: you still need `git fetch` (or `git pull`).',
      ],
    },
  },
};
