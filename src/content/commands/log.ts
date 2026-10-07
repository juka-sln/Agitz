import type { CommandDoc } from '../model';

export const logDoc: CommandDoc = {
  kind: 'command',
  id: 'log',
  title: 'git log',
  category: 'basics',
  related: ['commit', 'branch', 'reset'],
  text: {
    fr: {
      summary: 'Affiche l’historique des commits.',
      description: [
        '`git log` part de HEAD et remonte de parent en parent pour lister les commits, du plus récent au plus ancien, avec leur hash, leur auteur, leur date et leur message.',
        'C’est la version texte du graphe : pratique pour retrouver le hash d’un commit à passer à `git checkout`, `git reset` ou `git cherry-pick`.',
      ],
      options: [
        { syntax: 'git log', text: 'Historique complet de la branche courante.' },
        { syntax: 'git log --oneline', text: 'Une ligne par commit : hash court et sujet.' },
        {
          syntax: 'git log -n <nombre>',
          text: 'Limite le nombre de commits (`-3` est un raccourci de `-n 3`).',
        },
        { syntax: 'git log --all', text: 'Inclut les commits de toutes les branches.' },
        { syntax: 'git log <révision>', text: 'Part d’une autre branche ou d’un autre commit.' },
      ],
      examples: [
        { command: 'git log --oneline', text: 'Vue compacte, idéale pour repérer un hash.' },
        {
          command: 'git log --oneline --all',
          text: 'Tous les commits, toutes branches confondues.',
        },
        { command: 'git log -3 feature', text: 'Les trois derniers commits de `feature`.' },
      ],
      underTheHood: [
        'Sur le graphe, `git log` suit le chemin qui part de la station marquée HEAD vers la gauche, en passant par les parents. Après une fusion, les deux parents sont parcourus.',
        'Les étiquettes entre parenthèses (`HEAD -> main`, `tag: v1.0.0`) montrent les références qui pointent sur chaque commit.',
      ],
      pitfalls: [
        'Ne pas voir les commits d’une autre branche : sans `--all`, seuls les ancêtres de HEAD sont listés.',
        'Après un `reset`, les commits retirés disparaissent du log mais pas forcément du dépôt.',
      ],
    },
    en: {
      summary: 'Shows the commit history.',
      description: [
        '`git log` starts from HEAD and walks from parent to parent to list commits, newest first, with their hash, author, date and message.',
        'It is the text version of the graph: handy to find the hash of a commit to pass to `git checkout`, `git reset` or `git cherry-pick`.',
      ],
      options: [
        { syntax: 'git log', text: 'Full history of the current branch.' },
        { syntax: 'git log --oneline', text: 'One line per commit: short hash and subject.' },
        {
          syntax: 'git log -n <number>',
          text: 'Limits the number of commits (`-3` is short for `-n 3`).',
        },
        { syntax: 'git log --all', text: 'Includes the commits of every branch.' },
        { syntax: 'git log <revision>', text: 'Starts from another branch or commit.' },
      ],
      examples: [
        { command: 'git log --oneline', text: 'Compact view, perfect to spot a hash.' },
        { command: 'git log --oneline --all', text: 'Every commit, on every branch.' },
        { command: 'git log -3 feature', text: 'The last three commits of `feature`.' },
      ],
      underTheHood: [
        'On the graph, `git log` follows the path from the station marked HEAD to the left, through the parents. After a merge, both parents are walked.',
        'The labels in parentheses (`HEAD -> main`, `tag: v1.0.0`) show the references pointing to each commit.',
      ],
      pitfalls: [
        'Not seeing the commits of another branch: without `--all`, only the ancestors of HEAD are listed.',
        'After a `reset`, the removed commits vanish from the log but not necessarily from the repository.',
      ],
    },
  },
};
