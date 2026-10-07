import type { CommandDoc } from '../model';

export const pullDoc: CommandDoc = {
  kind: 'command',
  id: 'pull',
  title: 'git pull',
  category: 'remote',
  related: ['fetch', 'merge', 'rebase', 'merge-vs-rebase'],
  text: {
    fr: {
      summary:
        'Récupère le travail publié et l’intègre dans ta branche : `fetch` puis `merge` (ou `rebase`).',
      description: [
        '`git pull` enchaîne deux commandes : `git fetch` pour télécharger les commits de la branche suivie, puis leur intégration dans ta branche courante.',
        'Si tu n’as rien commité de ton côté, ta branche avance simplement (**fast-forward**). Si vous avez **tous les deux** de nouveaux commits, les branches ont divergé : Git te demande de choisir entre une fusion (`--no-rebase`) et un rebase (`--rebase`).',
        '`--rebase` rejoue tes commits locaux au-dessus des commits distants : l’historique reste linéaire, sans commit de fusion. C’est souvent le choix préféré pour une branche personnelle.',
      ],
      options: [
        { syntax: 'git pull', text: 'Depuis la branche suivie (upstream).' },
        { syntax: 'git pull --rebase', text: 'Rejoue tes commits au-dessus des commits distants.' },
        { syntax: 'git pull --no-rebase', text: 'Fusionne, avec un commit de fusion si besoin.' },
        { syntax: 'git pull --ff-only', text: 'Refuse si une avance rapide est impossible.' },
        { syntax: 'git pull <remote> <branche>', text: 'Depuis une branche distante précise.' },
      ],
      examples: [
        { command: 'git pull', text: 'Met ta branche à jour avant de commencer à travailler.' },
        { command: 'git pull --rebase', text: 'Intègre les commits des autres sous les tiens.' },
        {
          command: 'git pull origin main',
          text: 'Récupère `main` dans ta branche de fonctionnalité.',
        },
      ],
      underTheHood: [
        'Sur le graphe, `origin/main` avance d’abord (le fetch), puis ta branche la rejoint : en glissant (fast-forward), par un commit de fusion à deux parents, ou en rejouant tes commits au bout de la ligne (rebase).',
        'Un conflit se règle exactement comme pour `git merge` ou `git rebase` : corriger, `git add`, puis `git commit` ou `git rebase --continue`.',
      ],
      pitfalls: [
        'Travailler longtemps sans `git pull` : plus les branches divergent, plus les conflits sont gros.',
        'Lancer `git pull` avec des modifications non commitées : commite-les ou fais `git stash` d’abord.',
        'Utiliser `--rebase` sur des commits déjà poussés : ils changent de hash, il faudra forcer le push.',
      ],
    },
    en: {
      summary:
        'Gets the published work and integrates it into your branch: `fetch` then `merge` (or `rebase`).',
      description: [
        '`git pull` chains two commands: `git fetch` to download the commits of the tracked branch, then their integration into your current branch.',
        'If you have not committed anything, your branch simply moves forward (**fast-forward**). If **both** of you have new commits, the branches diverged: Git asks you to choose between a merge (`--no-rebase`) and a rebase (`--rebase`).',
        '`--rebase` replays your local commits on top of the remote ones: the history stays linear, without a merge commit. It is often preferred on a personal branch.',
      ],
      options: [
        { syntax: 'git pull', text: 'From the tracked (upstream) branch.' },
        { syntax: 'git pull --rebase', text: 'Replays your commits on top of the remote ones.' },
        { syntax: 'git pull --no-rebase', text: 'Merges, with a merge commit when needed.' },
        { syntax: 'git pull --ff-only', text: 'Refuses unless a fast-forward is possible.' },
        { syntax: 'git pull <remote> <branch>', text: 'From a given remote branch.' },
      ],
      examples: [
        { command: 'git pull', text: 'Updates your branch before you start working.' },
        { command: 'git pull --rebase', text: 'Puts the others’ commits below yours.' },
        { command: 'git pull origin main', text: 'Brings `main` into your feature branch.' },
      ],
      underTheHood: [
        'On the graph, `origin/main` moves first (the fetch), then your branch catches up: by sliding (fast-forward), with a two-parent merge commit, or by replaying your commits at the end of the line (rebase).',
        'A conflict is solved exactly as with `git merge` or `git rebase`: fix, `git add`, then `git commit` or `git rebase --continue`.',
      ],
      pitfalls: [
        'Working for a long time without `git pull`: the more branches diverge, the bigger the conflicts.',
        'Running `git pull` with uncommitted changes: commit them or `git stash` first.',
        'Using `--rebase` on commits already pushed: their hashes change, and the push will have to be forced.',
      ],
    },
  },
};
