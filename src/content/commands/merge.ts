import type { CommandDoc } from '../model';

export const mergeDoc: CommandDoc = {
  kind: 'command',
  id: 'merge',
  title: 'git merge',
  category: 'branches',
  related: ['rebase', 'branch', 'merge-vs-rebase'],
  text: {
    fr: {
      summary: 'Intègre l’historique d’une autre branche dans la branche courante.',
      description: [
        '`git merge <branche>` ramène dans ta branche tous les changements faits sur `<branche>` depuis leur ancêtre commun. On se place d’abord sur la branche qui **reçoit** : pour intégrer `feature` dans `main`, on est sur `main`.',
        'Si ta branche n’a rien de nouveau, Git fait une **avance rapide** (fast-forward) : il déplace simplement l’étiquette. Sinon, il crée un **commit de fusion** à deux parents.',
        'Si les deux branches ont modifié les mêmes lignes, la fusion s’arrête sur un **conflit** que tu résous à la main.',
      ],
      options: [
        { syntax: 'git merge <branche>', text: 'Fusionne, en avance rapide si possible.' },
        {
          syntax: 'git merge --no-ff <branche>',
          text: 'Crée toujours un commit de fusion, pour garder la trace de la branche.',
        },
        {
          syntax: 'git merge --ff-only <branche>',
          text: 'Refuse si une avance rapide est impossible.',
        },
        {
          syntax: 'git merge -m "<message>" <branche>',
          text: 'Choisit le message du commit de fusion.',
        },
        {
          syntax: 'git merge --abort',
          text: 'Abandonne une fusion en conflit et revient à l’état d’avant.',
        },
        {
          syntax: 'git merge --continue',
          text: 'Termine la fusion une fois les conflits résolus (équivaut à `git commit`).',
        },
      ],
      examples: [
        {
          command: 'git merge feature/login',
          text: 'Depuis `main`, intègre une fonctionnalité terminée.',
        },
        {
          command: 'git merge --no-ff feature/login',
          text: 'Garde une bulle visible pour la fonctionnalité dans l’historique.',
        },
        {
          command: 'git merge --continue',
          text: 'Termine la fusion une fois les conflits corrigés et ajoutés avec `git add`.',
        },
      ],
      underTheHood: [
        'En avance rapide, aucune station n’est créée : l’étiquette de ta branche glisse le long de la ligne jusqu’à la station de l’autre branche.',
        'Sinon, une station de fusion apparaît, reliée aux deux lignes : c’est le point où elles se rejoignent. Les commits de l’autre branche ne sont pas copiés, ils restent où ils sont.',
        'En cas de conflit, Git écrit dans le fichier les deux versions entre des marqueurs `<<<<<<<`, `=======` et `>>>>>>>`. Tu gardes le bon contenu, supprimes les marqueurs, puis `git add`.',
      ],
      pitfalls: [
        'Fusionner dans le mauvais sens : vérifie sur quelle branche tu es avant de lancer `git merge`.',
        'Oublier un marqueur `<<<<<<<` dans un fichier : Git ne vérifie pas le contenu, il commitera les marqueurs.',
        'Lancer une fusion avec des modifications non commitées : en cas de conflit, elles deviennent difficiles à séparer.',
      ],
    },
    en: {
      summary: 'Brings the history of another branch into the current branch.',
      description: [
        '`git merge <branch>` brings into your branch every change made on `<branch>` since their common ancestor. First stand on the branch that **receives**: to integrate `feature` into `main`, be on `main`.',
        'If your branch has nothing new, Git does a **fast-forward**: it simply moves the label. Otherwise it creates a **merge commit** with two parents.',
        'If both branches changed the same lines, the merge stops on a **conflict** that you resolve by hand.',
      ],
      options: [
        { syntax: 'git merge <branch>', text: 'Merges, with a fast-forward when possible.' },
        {
          syntax: 'git merge --no-ff <branch>',
          text: 'Always creates a merge commit, to keep a trace of the branch.',
        },
        {
          syntax: 'git merge --ff-only <branch>',
          text: 'Refuses when a fast-forward is impossible.',
        },
        {
          syntax: 'git merge -m "<message>" <branch>',
          text: 'Sets the message of the merge commit.',
        },
        {
          syntax: 'git merge --abort',
          text: 'Aborts a conflicted merge and goes back to how things were.',
        },
        {
          syntax: 'git merge --continue',
          text: 'Concludes the merge once conflicts are resolved (same as `git commit`).',
        },
      ],
      examples: [
        { command: 'git merge feature/login', text: 'From `main`, integrates a finished feature.' },
        {
          command: 'git merge --no-ff feature/login',
          text: 'Keeps a visible bubble for the feature in history.',
        },
        {
          command: 'git merge --continue',
          text: 'Concludes the merge once the conflicts are fixed and staged with `git add`.',
        },
      ],
      underTheHood: [
        'With a fast-forward no station is created: your branch label slides along the line to the station of the other branch.',
        'Otherwise a merge station appears, linked to both lines: the point where they join. The commits of the other branch are not copied, they stay where they are.',
        'On conflict, Git writes both versions into the file between `<<<<<<<`, `=======` and `>>>>>>>` markers. Keep the right content, delete the markers, then `git add`.',
      ],
      pitfalls: [
        'Merging the wrong way round: check which branch you are on before running `git merge`.',
        'Leaving a `<<<<<<<` marker in a file: Git does not check the content and will commit the markers.',
        'Starting a merge with uncommitted changes: on conflict, they become hard to tell apart.',
      ],
    },
  },
};
