import type { CommandDoc } from '../model';

export const cloneDoc: CommandDoc = {
  kind: 'command',
  id: 'clone',
  title: 'git clone',
  category: 'remote',
  related: ['remote', 'pull', 'push'],
  text: {
    fr: {
      summary: 'Copie un dépôt distant sur ton poste, avec tout son historique.',
      description: [
        '`git clone <url>` télécharge un dépôt complet : tous les commits, toutes les branches, tous les tags. C’est la façon normale de rejoindre un projet existant.',
        'Le clone est déjà relié à sa source : Git crée un remote nommé **`origin`** qui pointe vers l’URL, une branche de suivi `origin/<branche>` pour chaque branche distante, et une branche locale (souvent `main`) qui **suit** `origin/main`.',
        'Dans Agitz, chaque coéquipier du panneau **Équipe** a son propre poste : passe sur Bob (ou ajoute quelqu’un) et clone le dépôt partagé `https://github.com/alice/project.git` pour travailler à plusieurs.',
      ],
      options: [
        { syntax: 'git clone <url>', text: 'Clone dans un dossier nommé comme le dépôt.' },
        { syntax: 'git clone <url> <dossier>', text: 'Choisit le nom du dossier du projet.' },
        { syntax: 'git clone <url> .', text: 'Clone dans le dossier courant, qui doit être vide.' },
      ],
      examples: [
        {
          command: 'git clone https://github.com/alice/project.git',
          text: 'Récupère le projet partagé de l’équipe.',
        },
        { command: 'git branch -a', text: 'Montre la branche locale et les branches `origin/…`.' },
      ],
      underTheHood: [
        'Le graphe du nouveau poste est identique à celui du dépôt distant : mêmes commits, mêmes hash. Les étiquettes `origin/main` marquent où en était le dépôt distant au moment du clone.',
        'Les fichiers du dossier sont ceux du dernier commit de la branche par défaut : l’index et le disque sont propres.',
      ],
      pitfalls: [
        'Cloner un dépôt vide : c’est possible, Git prévient simplement qu’il n’y a encore rien. Fais un commit puis `git push`.',
        'Confondre clone et fork : un clone est une copie **sur ton poste** ; un fork est une copie **sur le serveur**, sous ton compte.',
      ],
    },
    en: {
      summary: 'Copies a remote repository to your workstation, with its whole history.',
      description: [
        '`git clone <url>` downloads a complete repository: every commit, every branch, every tag. It is the usual way to join an existing project.',
        'The clone is already linked to its source: Git creates a remote named **`origin`** pointing to the URL, a remote-tracking branch `origin/<branch>` for each remote branch, and a local branch (often `main`) that **tracks** `origin/main`.',
        'In Agitz, each teammate of the **Team** panel has their own workstation: switch to Bob (or add someone) and clone the shared repository `https://github.com/alice/project.git` to work as a team.',
      ],
      options: [
        { syntax: 'git clone <url>', text: 'Clones into a folder named after the repository.' },
        { syntax: 'git clone <url> <folder>', text: 'Chooses the name of the project folder.' },
        {
          syntax: 'git clone <url> .',
          text: 'Clones into the current folder, which must be empty.',
        },
      ],
      examples: [
        {
          command: 'git clone https://github.com/alice/project.git',
          text: 'Gets the team’s shared project.',
        },
        { command: 'git branch -a', text: 'Shows the local branch and the `origin/…` branches.' },
      ],
      underTheHood: [
        'The graph of the new workstation is identical to the remote one: same commits, same hashes. The `origin/main` labels mark where the remote repository was at clone time.',
        'The files in the folder are those of the last commit of the default branch: the index and the disk are clean.',
      ],
      pitfalls: [
        'Cloning an empty repository: it works, Git just warns that there is nothing yet. Make a commit, then `git push`.',
        'Mixing up clone and fork: a clone is a copy **on your workstation**; a fork is a copy **on the server**, under your account.',
      ],
    },
  },
};
