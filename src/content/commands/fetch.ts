import type { CommandDoc } from '../model';

export const fetchDoc: CommandDoc = {
  kind: 'command',
  id: 'fetch',
  title: 'git fetch',
  category: 'remote',
  related: ['pull', 'merge', 'remote'],
  text: {
    fr: {
      summary: 'Télécharge les nouveaux commits d’un dépôt distant sans toucher à ton travail.',
      description: [
        '`git fetch` demande au dépôt distant ce qu’il y a de nouveau et le télécharge. Il met à jour les **branches de suivi** (`origin/main`, `origin/feature`…), qui reflètent l’état du dépôt distant.',
        'C’est une commande **sans risque** : tes branches locales, ton index et tes fichiers ne bougent pas. Tu regardes ensuite ce qui est arrivé (`git log origin/main`, `git status`) avant de l’intégrer avec `git merge` ou `git rebase`.',
      ],
      options: [
        { syntax: 'git fetch', text: 'Récupère depuis le remote suivi (ou `origin`).' },
        {
          syntax: 'git fetch <remote> [<branche>]',
          text: 'Depuis un remote précis, éventuellement une seule branche.',
        },
        { syntax: 'git fetch --all', text: 'Depuis tous les remotes.' },
        {
          syntax: 'git fetch --prune',
          text: 'Oublie les branches de suivi dont la branche distante a été supprimée.',
        },
      ],
      examples: [
        { command: 'git fetch', text: 'Regarde ce que l’équipe a publié.' },
        { command: 'git status', text: 'Dit si ta branche est en retard sur `origin/main`.' },
        { command: 'git merge origin/main', text: 'Intègre ces commits dans ta branche.' },
      ],
      underTheHood: [
        'Les nouveaux commits apparaissent sur le graphe, sur la ligne `origin/main` : ta branche `main`, elle, reste où elle était.',
        'Chaque ligne affichée raconte un déplacement : `[new branch]` (nouvelle branche), `a1b2c3d..e4f5a6b` (avance), `+ … (forced update)` (historique réécrit sur le distant).',
      ],
      pitfalls: [
        'Croire que `git fetch` met à jour tes fichiers : il faut encore fusionner (`git merge`) ou utiliser `git pull`.',
        'Oublier de récupérer avant de comparer : `origin/main` n’est que la dernière position **connue** du distant.',
      ],
    },
    en: {
      summary: 'Downloads new commits from a remote repository without touching your work.',
      description: [
        '`git fetch` asks the remote repository what is new and downloads it. It updates the **remote-tracking branches** (`origin/main`, `origin/feature`…), which mirror the state of the remote.',
        'It is a **safe** command: your local branches, index and files do not move. You then look at what arrived (`git log origin/main`, `git status`) before integrating it with `git merge` or `git rebase`.',
      ],
      options: [
        { syntax: 'git fetch', text: 'Fetches from the tracked remote (or `origin`).' },
        {
          syntax: 'git fetch <remote> [<branch>]',
          text: 'From a given remote, possibly one branch only.',
        },
        { syntax: 'git fetch --all', text: 'From every remote.' },
        {
          syntax: 'git fetch --prune',
          text: 'Forgets remote-tracking branches whose remote branch was deleted.',
        },
      ],
      examples: [
        { command: 'git fetch', text: 'Looks at what the team published.' },
        { command: 'git status', text: 'Tells whether your branch is behind `origin/main`.' },
        { command: 'git merge origin/main', text: 'Brings those commits into your branch.' },
      ],
      underTheHood: [
        'The new commits appear on the graph, on the `origin/main` line: your `main` branch stays where it was.',
        'Each printed line tells a move: `[new branch]`, `a1b2c3d..e4f5a6b` (moved forward), `+ … (forced update)` (history rewritten on the remote).',
      ],
      pitfalls: [
        'Thinking that `git fetch` updates your files: you still need to merge (`git merge`) or use `git pull`.',
        'Comparing without fetching first: `origin/main` is only the last **known** position of the remote.',
      ],
    },
  },
};
