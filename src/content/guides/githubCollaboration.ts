import type { GuideDoc } from '../model';

export const githubCollaborationGuide: GuideDoc = {
  kind: 'guide',
  id: 'github-collaboration',
  related: ['code-review', 'merge-vs-rebase', 'remote', 'push', 'github-platform'],
  text: {
    fr: {
      title: 'Collaborer sur GitHub : fork, pull request, protection',
      summary:
        'Comment une équipe fait évoluer un même dépôt sans se marcher dessus : copier, proposer, relire, fusionner.',
      sections: [
        {
          heading: 'Clone ou fork ?',
          blocks: [
            {
              type: 'paragraph',
              text: '`git clone` est une commande **Git** : elle copie un dépôt sur **ton poste**. Un **fork** est une fonction de **GitHub** : il copie le dépôt **sur GitHub**, sous ton compte. On forke un projet sur lequel on n’a pas le droit de pousser (un projet open source, par exemple), puis on clone son fork pour y travailler.',
            },
            {
              type: 'list',
              items: [
                'Tu fais partie de l’équipe et tu peux pousser : **clone** directement le dépôt de l’équipe.',
                'Tu n’as pas le droit de pousser : **forke**, clone ton fork, pousse dessus, puis propose tes changements au dépôt d’origine par une pull request.',
                'Dans Agitz, le bouton **Fork** du panneau GitHub crée `https://github.com/<toi>/<projet>` ; un utilisateur ne peut pas forker son propre dépôt.',
              ],
            },
          ],
        },
        {
          heading: 'origin et upstream',
          blocks: [
            {
              type: 'paragraph',
              text: 'Ce ne sont que des **noms de remotes**, mais la convention est universelle : `origin` désigne le dépôt que tu as cloné (ton fork), `upstream` le dépôt d’origine dont il est issu. Tu pousses sur `origin` ; tu récupères les nouveautés de l’équipe depuis `upstream`.',
            },
            {
              type: 'code',
              code: 'git clone https://github.com/bob/project.git\ngit remote add upstream https://github.com/alice/project.git\ngit fetch upstream\ngit merge upstream/main\ngit push origin main',
            },
          ],
        },
        {
          heading: 'Le cycle d’une pull request',
          blocks: [
            {
              type: 'list',
              items: [
                'Crée une branche dédiée depuis la branche principale à jour : `git checkout -b feature/login-form`.',
                'Commite par petites étapes, avec des messages Conventional Commits.',
                'Publie la branche : `git push -u origin feature/login-form`.',
                'Sur GitHub, ouvre une **pull request** de ta branche (`compare`) vers `main` (`base`) : un titre clair, et une description qui dit **pourquoi**.',
                'La **CI** vérifie automatiquement chaque commit poussé ; tes coéquipiers relisent, commentent, approuvent ou demandent des modifications.',
                'Pour corriger, tu continues de committer et de pousser **sur la même branche** : la pull request se met à jour toute seule.',
                'Une fois approuvée et au vert, quelqu’un la fusionne. Chacun fait ensuite `git pull` sur `main`, et la branche peut être supprimée.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Écrire `Closes #12` dans la description ferme automatiquement l’issue 12 au moment de la fusion.',
            },
          ],
        },
        {
          heading: 'Merge, squash ou rebase ?',
          blocks: [
            {
              type: 'list',
              items: [
                '**Create a merge commit** : garde tous les commits de la branche et ajoute un commit de fusion. L’historique montre fidèlement le travail, mais devient vite touffu.',
                '**Squash and merge** : réunit toute la branche en **un seul commit** sur `main`, dont le message est le titre de la pull request. Historique linéaire, un commit par fonctionnalité : d’où l’importance d’un titre au format Conventional Commits.',
                '**Rebase and merge** : rejoue chaque commit au-dessus de `main`, sans commit de fusion. Historique linéaire et détaillé ; les commits obtiennent de nouveaux hash.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Dans tous les cas, la fusion a lieu **sur GitHub** : ton dépôt local ne la voit qu’après un `git pull`. Après un squash ou un rebase, ta branche locale ne figure pas telle quelle dans `main` : supprime-la plutôt que de continuer dessus.',
            },
          ],
        },
        {
          heading: 'Protéger les branches importantes',
          blocks: [
            {
              type: 'paragraph',
              text: 'Une **règle de protection** (Settings → Branches) empêche de modifier `main` sans contrôle. Elle peut exiger une pull request, un nombre d’approbations et une CI au vert. Une branche protégée refuse toujours les push forcés et la suppression. Un `git push` direct est alors rejeté par le serveur :',
            },
            {
              type: 'code',
              code: 'remote: error: GH006: Protected branch update failed for refs/heads/main.\nremote: error: Changes must be made through a pull request.\n ! [remote rejected] main -> main (protected branch hook declined)',
            },
            {
              type: 'paragraph',
              text: 'Ce n’est pas une erreur de ta part : c’est le signal qu’il faut passer par une branche et une pull request. Ton commit est toujours là, en local ; crée une branche à partir de lui et pousse-la.',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Collaborating on GitHub: fork, pull request, protection',
      summary:
        'How a team evolves one repository without stepping on each other’s toes: copy, propose, review, merge.',
      sections: [
        {
          heading: 'Clone or fork?',
          blocks: [
            {
              type: 'paragraph',
              text: '`git clone` is a **Git** command: it copies a repository to **your machine**. A **fork** is a **GitHub** feature: it copies the repository **on GitHub**, under your account. You fork a project you are not allowed to push to (an open source project, for instance), then clone your fork to work on it.',
            },
            {
              type: 'list',
              items: [
                'You are part of the team and can push: **clone** the team’s repository directly.',
                'You cannot push: **fork** it, clone your fork, push to it, then propose your changes to the original repository with a pull request.',
                'In Agitz, the **Fork** button of the GitHub panel creates `https://github.com/<you>/<project>`; a user cannot fork their own repository.',
              ],
            },
          ],
        },
        {
          heading: 'origin and upstream',
          blocks: [
            {
              type: 'paragraph',
              text: 'They are only **remote names**, but the convention is universal: `origin` is the repository you cloned (your fork), `upstream` the original repository it comes from. You push to `origin`; you get the team’s news from `upstream`.',
            },
            {
              type: 'code',
              code: 'git clone https://github.com/bob/project.git\ngit remote add upstream https://github.com/alice/project.git\ngit fetch upstream\ngit merge upstream/main\ngit push origin main',
            },
          ],
        },
        {
          heading: 'The life of a pull request',
          blocks: [
            {
              type: 'list',
              items: [
                'Create a dedicated branch from the up-to-date main branch: `git checkout -b feature/login-form`.',
                'Commit in small steps, with Conventional Commits messages.',
                'Publish the branch: `git push -u origin feature/login-form`.',
                'On GitHub, open a **pull request** from your branch (`compare`) to `main` (`base`): a clear title, and a description that says **why**.',
                '**CI** automatically checks every pushed commit; teammates review, comment, approve or request changes.',
                'To fix things, keep committing and pushing **to the same branch**: the pull request updates itself.',
                'Once approved and green, someone merges it. Everyone then runs `git pull` on `main`, and the branch can be deleted.',
              ],
            },
            {
              type: 'paragraph',
              text: 'Writing `Closes #12` in the description closes issue 12 automatically when the pull request is merged.',
            },
          ],
        },
        {
          heading: 'Merge, squash or rebase?',
          blocks: [
            {
              type: 'list',
              items: [
                '**Create a merge commit**: keeps every commit of the branch and adds a merge commit. The history faithfully shows the work, but quickly gets bushy.',
                '**Squash and merge**: combines the whole branch into **a single commit** on `main`, whose message is the pull request title. A linear history, one commit per feature: hence a title in the Conventional Commits format.',
                '**Rebase and merge**: replays each commit on top of `main`, without a merge commit. A linear, detailed history; the commits get new hashes.',
              ],
            },
            {
              type: 'paragraph',
              text: 'In every case, the merge happens **on GitHub**: your local repository only sees it after a `git pull`. After a squash or a rebase, your local branch is not part of `main` as is: delete it rather than keep working on it.',
            },
          ],
        },
        {
          heading: 'Protecting important branches',
          blocks: [
            {
              type: 'paragraph',
              text: 'A **branch protection rule** (Settings → Branches) prevents changing `main` unchecked. It can require a pull request, a number of approvals and green CI. A protected branch always refuses forced pushes and deletion. A direct `git push` is then rejected by the server:',
            },
            {
              type: 'code',
              code: 'remote: error: GH006: Protected branch update failed for refs/heads/main.\nremote: error: Changes must be made through a pull request.\n ! [remote rejected] main -> main (protected branch hook declined)',
            },
            {
              type: 'paragraph',
              text: 'This is not your mistake: it signals that you must go through a branch and a pull request. Your commit is still there, locally; create a branch from it and push that.',
            },
          ],
        },
      ],
    },
  },
};
