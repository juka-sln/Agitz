import type { CommandDoc } from '../model';

export const pushDoc: CommandDoc = {
  kind: 'command',
  id: 'push',
  title: 'git push',
  category: 'remote',
  related: ['pull', 'fetch', 'remote'],
  text: {
    fr: {
      summary: 'Publie tes commits sur le dépôt distant pour les partager.',
      description: [
        '`git push` envoie au dépôt distant les commits qu’il n’a pas, puis y déplace la branche. Les autres les récupèreront avec `git fetch` ou `git pull`.',
        'La première fois qu’on publie une branche, on écrit `git push -u origin <branche>` : `-u` (set-upstream) relie ta branche à `origin/<branche>`, et un simple `git push` suffira ensuite.',
        'Git n’accepte que les **avances** : si quelqu’un a poussé avant toi, ton push est **rejeté**. Il faut d’abord intégrer son travail (`git pull`), puis repousser.',
      ],
      options: [
        { syntax: 'git push', text: 'Publie la branche courante vers sa branche suivie.' },
        { syntax: 'git push -u origin <branche>', text: 'Publie une nouvelle branche et la suit.' },
        { syntax: 'git push origin <local>:<distante>', text: 'Publie sous un autre nom.' },
        { syntax: 'git push --tags', text: 'Publie aussi les tags.' },
        { syntax: 'git push origin --delete <branche>', text: 'Supprime une branche distante.' },
        {
          syntax: 'git push --force-with-lease',
          text: 'Force, mais seulement si personne n’a poussé depuis ton dernier `fetch`.',
        },
        { syntax: 'git push --force', text: 'Écrase la branche distante. Dangereux.' },
      ],
      examples: [
        { command: 'git push -u origin main', text: 'Premier envoi d’un projet tout neuf.' },
        { command: 'git push', text: 'Publie tes nouveaux commits.' },
        {
          command: 'git push --force-with-lease',
          text: 'Republie ta branche après un rebase, sans écraser le travail d’un autre.',
        },
      ],
      underTheHood: [
        'Après le push, l’étiquette `origin/main` rejoint ta branche sur le graphe : le dépôt distant et toi êtes au même point.',
        'Un rejet `(fetch first)` signifie que le distant a des commits que tu n’as pas ; `(non-fast-forward)` que ta branche est en retard ou a divergé ; `(stale info)` que `--force-with-lease` a détecté un push d’un collègue.',
      ],
      pitfalls: [
        'Forcer (`--force`) sur une branche partagée : les commits des autres disparaissent du dépôt distant.',
        'Oublier `-u` au premier push : Git ne sait pas quelle branche distante associer, `git push` seul échoue.',
        'Pousser directement sur `main` dans une équipe : préfère une branche et une pull request.',
      ],
    },
    en: {
      summary: 'Publishes your commits on the remote repository to share them.',
      description: [
        '`git push` sends the remote repository the commits it lacks, then moves the branch there. Others get them with `git fetch` or `git pull`.',
        'The first time you publish a branch, type `git push -u origin <branch>`: `-u` (set-upstream) links your branch to `origin/<branch>`, and a plain `git push` is enough afterwards.',
        'Git only accepts **moving forward**: if someone pushed before you, your push is **rejected**. Integrate their work first (`git pull`), then push again.',
      ],
      options: [
        { syntax: 'git push', text: 'Publishes the current branch to its tracked branch.' },
        { syntax: 'git push -u origin <branch>', text: 'Publishes a new branch and tracks it.' },
        { syntax: 'git push origin <local>:<remote>', text: 'Publishes under another name.' },
        { syntax: 'git push --tags', text: 'Publishes the tags too.' },
        { syntax: 'git push origin --delete <branch>', text: 'Deletes a remote branch.' },
        {
          syntax: 'git push --force-with-lease',
          text: 'Forces, but only if nobody pushed since your last `fetch`.',
        },
        { syntax: 'git push --force', text: 'Overwrites the remote branch. Dangerous.' },
      ],
      examples: [
        { command: 'git push -u origin main', text: 'First push of a brand new project.' },
        { command: 'git push', text: 'Publishes your new commits.' },
        {
          command: 'git push --force-with-lease',
          text: 'Republishes your branch after a rebase, without overwriting someone else’s work.',
        },
      ],
      underTheHood: [
        'After the push, the `origin/main` label joins your branch on the graph: the remote and you are at the same point.',
        'A `(fetch first)` rejection means the remote has commits you lack; `(non-fast-forward)` that your branch is behind or diverged; `(stale info)` that `--force-with-lease` spotted a teammate’s push.',
      ],
      pitfalls: [
        'Forcing (`--force`) on a shared branch: the others’ commits vanish from the remote.',
        'Forgetting `-u` on the first push: Git does not know which remote branch to pair, and plain `git push` fails.',
        'Pushing straight to `main` in a team: prefer a branch and a pull request.',
      ],
    },
  },
};
