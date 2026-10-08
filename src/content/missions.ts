import type { MissionId } from '@/application/learning/missions';
import type { Localized } from '@/shared/language';

import type { RichText } from './model';

export interface MissionText {
  readonly title: string;
  /** What to achieve, not how: the hints tell how, one step at a time. */
  readonly goal: RichText;
  readonly hints: readonly RichText[];
  /** The badge earned, named after what the learner can now do. */
  readonly badge: string;
}

export const MISSION_TEXTS: Readonly<Record<MissionId, Localized<MissionText>>> = {
  'first-commit': {
    fr: {
      title: 'Premier commit',
      goal: 'Crée un dépôt, ajoute un fichier et enregistre-le dans un premier commit.',
      hints: [
        '`git init` transforme le dossier en dépôt Git.',
        'Crée un fichier avec `echo "# Mon projet" > README.md`, puis prépare-le avec `git add README.md`.',
        'Termine par `git commit -m "docs: add readme"`.',
      ],
      badge: 'Premier pas',
    },
    en: {
      title: 'First commit',
      goal: 'Create a repository, add a file and record it in a first commit.',
      hints: [
        '`git init` turns the folder into a Git repository.',
        'Create a file with `echo "# My project" > README.md`, then stage it with `git add README.md`.',
        'Finish with `git commit -m "docs: add readme"`.',
      ],
      badge: 'First step',
    },
  },
  'conventional-commit': {
    fr: {
      title: 'Un message qui se lit',
      goal: 'Écris un commit au format **Conventional Commits** : un type, deux-points, puis l’action en anglais.',
      hints: [
        'Le sujet commence par un type : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`…',
        'Exemple : `git commit -m "feat: add login form"`. Impératif présent, pas de point final.',
      ],
      badge: 'Plume claire',
    },
    en: {
      title: 'A readable message',
      goal: 'Write a commit in the **Conventional Commits** format: a type, a colon, then the action.',
      hints: [
        'The subject starts with a type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`…',
        'Example: `git commit -m "feat: add login form"`. Imperative mood, no final period.',
      ],
      badge: 'Clear writer',
    },
  },
  'branch-out': {
    fr: {
      title: 'Bifurquer',
      goal: 'Crée une branche et fais-y un commit, pour que son travail n’existe que sur elle.',
      hints: [
        '`git checkout -b feature/menu` crée la branche et s’y place.',
        'Modifie un fichier, puis `git add .` et `git commit -m "feat: add menu"`. Regarde la nouvelle ligne apparaître sur le graphe.',
      ],
      badge: 'Aiguilleur',
    },
    en: {
      title: 'Branch out',
      goal: 'Create a branch and commit on it, so its work only exists there.',
      hints: [
        '`git checkout -b feature/menu` creates the branch and switches to it.',
        'Change a file, then `git add .` and `git commit -m "feat: add menu"`. Watch the new line appear on the graph.',
      ],
      badge: 'Switchman',
    },
  },
  'merge-branches': {
    fr: {
      title: 'Réunir deux lignes',
      goal: 'Fusionne deux branches qui ont chacune avancé, pour obtenir un **commit de fusion**.',
      hints: [
        'Il faut un commit nouveau sur chaque branche, sinon Git fait une simple avance rapide.',
        'Place-toi sur la branche qui reçoit (`git checkout main`), puis `git merge feature/menu`.',
        '`git merge --no-ff <branche>` force un commit de fusion même quand l’avance rapide est possible.',
      ],
      badge: 'Correspondance',
    },
    en: {
      title: 'Join two lines',
      goal: 'Merge two branches that both moved on, to get a **merge commit**.',
      hints: [
        'Each branch needs a new commit, otherwise Git simply fast-forwards.',
        'Switch to the receiving branch (`git checkout main`), then `git merge feature/menu`.',
        '`git merge --no-ff <branch>` forces a merge commit even when a fast-forward is possible.',
      ],
      badge: 'Interchange',
    },
  },
  'undo-change': {
    fr: {
      title: 'Revenir en arrière',
      goal: 'Annule un commit, soit en ajoutant son inverse, soit en déplaçant la branche.',
      hints: [
        '`git revert HEAD` crée un commit qui défait le dernier : sans danger sur une branche partagée.',
        '`git reset --soft HEAD~1` retire le dernier commit mais garde ses changements prêts à être recommités.',
      ],
      badge: 'Machine à remonter le temps',
    },
    en: {
      title: 'Go back',
      goal: 'Undo a commit, either by adding its opposite or by moving the branch.',
      hints: [
        '`git revert HEAD` creates a commit that undoes the last one: safe on a shared branch.',
        '`git reset --soft HEAD~1` removes the last commit but keeps its changes staged.',
      ],
      badge: 'Time traveler',
    },
  },
  'stash-work': {
    fr: {
      title: 'Mettre de côté',
      goal: 'Range des modifications en cours dans la remise, puis récupère-les.',
      hints: [
        'Modifie un fichier suivi sans le committer, puis `git stash` : ton dossier redevient propre.',
        '`git stash list` montre la remise ; `git stash pop` ré-applique les modifications.',
      ],
      badge: 'Écureuil',
    },
    en: {
      title: 'Set it aside',
      goal: 'Put work in progress in the stash, then bring it back.',
      hints: [
        'Change a tracked file without committing, then `git stash`: your folder is clean again.',
        '`git stash list` shows the stash; `git stash pop` applies the changes back.',
      ],
      badge: 'Squirrel',
    },
  },
  'tag-release': {
    fr: {
      title: 'Publier une version',
      goal: 'Marque un commit avec un numéro de version **sémantique**, comme `v1.0.0`.',
      hints: [
        '`git tag -a v1.0.0 -m "First release"` pose une étiquette annotée sur le commit courant.',
        'MAJEUR.MINEUR.CORRECTIF : chaque nombre dit quel genre de changement la version apporte.',
      ],
      badge: 'Jalon posé',
    },
    en: {
      title: 'Ship a version',
      goal: 'Mark a commit with a **semantic** version number such as `v1.0.0`.',
      hints: [
        '`git tag -a v1.0.0 -m "First release"` puts an annotated tag on the current commit.',
        'MAJOR.MINOR.PATCH: each number tells what kind of change the version brings.',
      ],
      badge: 'Milestone',
    },
  },
  'rebase-branch': {
    fr: {
      title: 'Rejouer l’histoire',
      goal: 'Rebase une branche sur une autre qui a avancé, et regarde ses commits être rejoués.',
      hints: [
        'Il faut une branche avec ses propres commits, et des commits nouveaux sur `main`.',
        'Depuis la branche à déplacer : `git rebase main`. Les commits rejoués ont de nouveaux hash.',
      ],
      badge: 'Réécrivain',
    },
    en: {
      title: 'Replay history',
      goal: 'Rebase a branch onto another one that moved on, and watch its commits being replayed.',
      hints: [
        'You need a branch with its own commits, and new commits on `main`.',
        'From the branch to move: `git rebase main`. Replayed commits get new hashes.',
      ],
      badge: 'Rewriter',
    },
  },
  'push-to-github': {
    fr: {
      title: 'En ligne',
      goal: 'Envoie une branche sur le dépôt partagé du GitHub virtuel.',
      hints: [
        'Relie ton dépôt : `git remote add origin https://github.com/alice/project.git`.',
        'Puis `git push -u origin main` : `-u` retient la branche distante pour les prochains push et pull.',
      ],
      badge: 'Décollage',
    },
    en: {
      title: 'Online',
      goal: 'Send a branch to the shared repository on the virtual GitHub.',
      hints: [
        'Connect your repository: `git remote add origin https://github.com/alice/project.git`.',
        'Then `git push -u origin main`: `-u` remembers the remote branch for the next push and pull.',
      ],
      badge: 'Lift-off',
    },
  },
  'work-as-a-team': {
    fr: {
      title: 'À plusieurs',
      goal: 'Fais en sorte que deux coéquipiers aient chacun poussé un commit sur le même dépôt.',
      hints: [
        'Passe sur le poste de Bob dans le panneau Équipe, puis `git clone https://github.com/alice/project.git`.',
        'Bob commite, puis `git push`. Reviens sur Alice et récupère son travail avec `git pull`.',
      ],
      badge: 'Esprit d’équipe',
    },
    en: {
      title: 'Together',
      goal: 'Get two teammates to each push a commit to the same repository.',
      hints: [
        'Switch to Bob’s workstation in the Team panel, then `git clone https://github.com/alice/project.git`.',
        'Bob commits, then `git push`. Go back to Alice and get their work with `git pull`.',
      ],
      badge: 'Team spirit',
    },
  },
  'resolve-conflict': {
    fr: {
      title: 'Démêler un conflit',
      goal: 'Termine une fusion (ou un rebase) qui s’est arrêtée sur un **conflit**.',
      hints: [
        'Le plus rapide : ouvre l’**Éditeur** et lance le scénario de conflit entre Alice et Bob.',
        'Choisis la version à garder dans chaque bloc, enregistre, puis `git add <fichier>`.',
        'Conclus avec `git commit` (ou `git rebase --continue` pendant un rebase).',
      ],
      badge: 'Démineur',
    },
    en: {
      title: 'Untangle a conflict',
      goal: 'Finish a merge (or a rebase) that stopped on a **conflict**.',
      hints: [
        'The quickest way: open the **Editor** and start the conflict scenario between Alice and Bob.',
        'Pick the version to keep in each block, save, then `git add <file>`.',
        'Conclude with `git commit` (or `git rebase --continue` during a rebase).',
      ],
      badge: 'Bomb defuser',
    },
  },
  'merge-pull-request': {
    fr: {
      title: 'Pull request fusionnée',
      goal: 'Propose une branche dans une **pull request** sur GitHub, puis fusionne-la.',
      hints: [
        'Pousse une branche (`git push -u origin feature/menu`), puis ouvre **GitHub** dans l’en-tête.',
        'Onglet Code : « Comparer et ouvrir une PR ». Demande une revue à un coéquipier simulé.',
        'Choisis merge, squash ou rebase, fusionne, puis `git pull` pour récupérer le résultat.',
      ],
      badge: 'Mainteneur',
    },
    en: {
      title: 'Pull request merged',
      goal: 'Propose a branch in a **pull request** on GitHub, then merge it.',
      hints: [
        'Push a branch (`git push -u origin feature/menu`), then open **GitHub** from the header.',
        'Code tab: “Compare & pull request”. Ask a simulated teammate for a review.',
        'Pick merge, squash or rebase, merge, then `git pull` to get the result.',
      ],
      badge: 'Maintainer',
    },
  },
};
