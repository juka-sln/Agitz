/** Texts of the virtual GitHub panel, merged into the interface dictionary. */
export const GITHUB_FR = {
  'header.github': 'GitHub',

  'github.close': 'Fermer GitHub',
  'github.signedInAs': 'connecté en tant que {login}',
  'github.allRepositories': 'Dépôts',
  'github.repositories': 'Dépôts sur GitHub',
  'github.repositoriesIntro':
    'Un GitHub simulé, sans compte ni connexion. Tout ce que tu fais ici, tu le fais au nom du coéquipier actif.',
  'github.noRepositories': 'Aucun dépôt pour l’instant.',
  'github.newRepository': 'Nouveau dépôt',
  'github.repositoryName': 'Nom du dépôt (sous {owner}/)',
  'github.create': 'Créer',
  'github.forkedFrom': 'fork de {parent}',
  'github.forkedFromPrefix': 'fork de',
  'github.emptyRepository': 'Dépôt vide',
  'github.defaultBranch': 'branche par défaut : {branch}',
  'github.openPullRequests': 'pull requests ouvertes : {count}',
  'github.openIssues': 'issues ouvertes : {count}',
  'github.fork': 'Fork',
  'github.yourFork': 'Ton fork : {name}',
  'github.repositoryNavigation': 'Navigation du dépôt',
  'github.tab.code': 'Code',
  'github.tab.pulls': 'Pull requests',
  'github.tab.issues': 'Issues',
  'github.tab.actions': 'Actions',

  'github.cloneTitle': 'Cloner ce dépôt',
  'github.upstreamHint':
    'C’est un fork : pour récupérer les nouveautés du dépôt d’origine, ajoute-le comme remote `upstream` (`origin` reste ton fork).',
  'github.copy': 'Copier',
  'github.copied': 'Copié',
  'github.quickSetup': 'Mise en route',
  'github.quickSetupIntro':
    'Ce dépôt est vide. Depuis un dépôt local qui a déjà un commit, publie ta branche :',
  'github.branches': 'Branches : {count}',
  'github.default': 'par défaut',
  'github.protected': 'protégée',
  'github.compareAndPullRequest': 'Comparer et ouvrir une PR',
  'github.deleteBranch': 'Supprimer la branche',
  'github.tags': 'Tags',

  'github.checks.passed': 'CI réussie',
  'github.checks.failed': 'CI en échec',
  'github.checks.success': 'Réussi',
  'github.checks.failure': 'Échec',
  'github.checks.allPassed': 'Toutes les vérifications sont passées.',
  'github.checks.someFailed': 'Certaines vérifications ont échoué.',
  'github.checks.none':
    'Aucune CI n’a tourné sur ce commit : le dépôt n’a pas de workflow dans `.github/workflows/`.',
  'github.checks.commitNotConventional':
    '`{commit}` « {subject} » ne suit pas Conventional Commits (`type: description`).',
  'github.checks.conflictMarkers':
    '`{path}` contient encore des marqueurs de conflit `<<<<<<<` : le code ne compile pas.',
  'github.job.commitlint': 'vérifie les messages des nouveaux commits',
  'github.job.build': 'construit le projet',

  'github.state.open': 'Ouverte',
  'github.state.merged': 'Fusionnée',
  'github.state.closed': 'Fermée',

  'github.pulls.filter': 'Filtrer les pull requests',
  'github.pulls.open': 'Ouvertes : {count}',
  'github.pulls.closed': 'Fermées : {count}',
  'github.pulls.new': 'Nouvelle pull request',
  'github.pulls.empty':
    'Aucune pull request ici. Pousse une branche, puis propose-la avec « Nouvelle pull request ».',
  'github.pulls.summary': '#{number} ouverte par {author} · {head} → {base}',

  'github.newPull.title': 'Ouvrir une pull request',
  'github.newPull.intro':
    'Choisis la branche à fusionner (`compare`) et la branche qui la recevra (`base`). Depuis un fork, la base est le dépôt d’origine.',
  'github.newPull.baseRepository': 'Dépôt de base',
  'github.newPull.base': 'base',
  'github.newPull.headRepository': 'Dépôt source',
  'github.newPull.compare': 'compare',
  'github.newPull.chooseBranches': 'Choisis une branche à comparer.',
  'github.newPull.nothingToCompare': 'Rien à comparer : {head} n’a aucun commit absent de {base}.',
  'github.newPull.ableToMerge': '✓ Fusion possible : ces branches se fusionnent sans conflit.',
  'github.newPull.notMergeable':
    '⚠ Ces branches sont en conflit. Tu peux ouvrir la pull request, mais il faudra résoudre le conflit avant de fusionner.',
  'github.newPull.titleLabel': 'Titre',
  'github.newPull.titleHint':
    'Au format Conventional Commits : en « squash », il devient le message du commit.',
  'github.newPull.bodyLabel': 'Description',
  'github.newPull.bodyPlaceholder':
    'Pourquoi ce changement ? Écris « Closes #3 » pour fermer l’issue 3 à la fusion.',
  'github.newPull.submit': 'Créer la pull request',

  'github.commits': 'Commits : {count}',
  'github.filesChanged': 'Fichiers modifiés : {count}',
  'github.fileChange.added': 'fichier ajouté',
  'github.fileChange.modified': 'fichier modifié',
  'github.fileChange.deleted': 'fichier supprimé',
  'github.line.added': 'ajouté :',
  'github.line.removed': 'supprimé :',

  'github.pull.sections': 'Sections de la pull request',
  'github.pull.conversation': 'Conversation',
  'github.pull.wantsToMerge': '{author} veut fusionner {count} commit(s) dans {base} depuis {head}',
  'github.pull.mergedSummary': '{author} a fusionné {count} commit(s) dans {base} depuis {head}',
  'github.pull.opened': 'a ouvert cette pull request',
  'github.pull.noDescription': 'Aucune description.',
  'github.pull.branchGone': 'La branche n’existe plus : impossible d’afficher ses changements.',

  'github.review.timeline': 'Revues et commentaires',
  'github.review.commented': 'a commenté',
  'github.review.approved': 'a approuvé ces changements',
  'github.review.requestedChanges': 'a demandé des modifications',
  'github.review.title': 'Ta revue',
  'github.review.bodyLabel': 'Commentaire de {login}',
  'github.review.verdict': 'Verdict',
  'github.review.comment': 'Commenter',
  'github.review.approve': 'Approuver',
  'github.review.requestChanges': 'Demander des modifications',
  'github.review.authorHint':
    'C’est ta pull request : tu peux la commenter, mais seule une autre personne peut l’approuver.',
  'github.review.submit': 'Envoyer la revue',
  'github.review.requestFrom': 'Demander une revue à',
  'github.review.request': 'Demander',

  'github.remark.looksGood':
    'Titre clair, description présente, commits au bon format et CI au vert : bon pour moi !',
  'github.remark.titleNotConventional':
    'Le titre « {title} » ne suit pas Conventional Commits. En squash, il deviendra le message du commit : par exemple `feat: add login form`.',
  'github.remark.emptyDescription':
    'Ajoute une description : explique pourquoi ce changement, et comment le tester.',
  'github.remark.commitNotConventional':
    'Le commit « {subject} » ne suit pas Conventional Commits. Corrige-le (`git rebase`, `git commit --amend`) ou choisis le squash à la fusion.',
  'github.remark.conflictMarkers':
    '`{path}` contient encore des marqueurs de conflit `<<<<<<<`. Termine la résolution avant de pousser.',
  'github.remark.checksFailing':
    'La CI est rouge : regarde l’onglet Actions et corrige avant la fusion.',

  'github.blocker.closed': 'Cette pull request n’est pas ouverte.',
  'github.blocker.branchMissing': 'Une des deux branches n’existe plus.',
  'github.blocker.nothingToMerge': 'Tout est déjà dans la base : rien à fusionner.',
  'github.blocker.conflicts':
    'Conflit avec la base dans : {paths}. Fusionne la base dans ta branche en local (`git pull origin {base}`), résous, puis pousse.',
  'github.blocker.approvals':
    'Revue obligatoire : {current} approbation(s) sur {required} demandée(s) par la protection de la branche.',
  'github.blocker.changesRequested': 'Des modifications ont été demandées par : {reviewers}.',
  'github.blocker.checks':
    'La CI doit être verte sur le dernier commit (règle de protection de la branche).',
  'github.mergeable': '✓ Cette branche peut être fusionnée.',
  'github.mergeMethod': 'Méthode de fusion',
  'github.method.merge': 'Merge commit',
  'github.method.merge.hint':
    'Garde tous les commits de la branche et ajoute un commit de fusion : l’historique montre la branche.',
  'github.method.merge.button': 'Fusionner la pull request',
  'github.method.squash': 'Squash and merge',
  'github.method.squash.hint':
    'Réunit tous les commits en un seul sur la base, avec le titre de la PR comme message : historique linéaire et propre.',
  'github.method.squash.button': 'Squash and merge',
  'github.method.rebase': 'Rebase and merge',
  'github.method.rebase.hint':
    'Rejoue chaque commit au-dessus de la base, sans commit de fusion : historique linéaire, mais nouveaux hash.',
  'github.method.rebase.button': 'Rebase and merge',
  'github.closePullRequest': 'Fermer sans fusionner',
  'github.closedNotice': 'Cette pull request a été fermée sans être fusionnée.',
  'github.reopen': 'Rouvrir',
  'github.merged.merge':
    '{login} a fusionné cette pull request dans {base} (commit de fusion {commit}).',
  'github.merged.squash':
    '{login} a fusionné cette pull request dans {base} en un seul commit {commit}.',
  'github.merged.rebase':
    '{login} a fusionné cette pull request dans {base} en rejouant ses commits (dernier : {commit}).',
  'github.merged.pullHint':
    'La fusion a eu lieu sur GitHub : les dépôts locaux ne la voient pas encore. Récupère-la sur `{base}` :',
  'github.merged.deleteHint': 'La branche a fait son travail : tu peux la supprimer sur GitHub.',

  'github.issues.intro': 'Les issues décrivent un bug ou une idée, avant d’écrire du code.',
  'github.issues.new': 'Nouvelle issue',
  'github.issues.empty': 'Aucune issue.',
  'github.issues.titleLabel': 'Titre',
  'github.issues.bodyLabel': 'Description',
  'github.issues.labels': 'Labels',
  'github.issues.submit': 'Créer l’issue',
  'github.issues.openedBy': 'ouverte par {author}',
  'github.issues.closedBy': 'Fermée automatiquement par la fusion de la pull request #{number}.',
  'github.issues.closingHint':
    'Écris `Closes #{number}` dans la description d’une pull request : sa fusion fermera cette issue.',
  'github.issues.close': 'Fermer l’issue',
  'github.issues.reopen': 'Rouvrir l’issue',

  'github.actions.intro':
    'GitHub Actions lance un workflow à chaque push. Ici, la CI vérifie les messages des commits (`commitlint`) et l’absence de marqueurs de conflit (`build`).',
  'github.actions.empty':
    'Aucun workflow n’a tourné. GitHub n’exécute que les workflows déclarés dans `.github/workflows/` : ajoute ce fichier à ton dépôt et pousse-le.',
  'github.actions.run': 'Exécution n°{id}',
  'github.actions.trigger': 'push sur {branch} ({commit})',

  'github.problem.repositoryNotFound': 'Ce dépôt n’existe pas.',
  'github.problem.notOwner': 'Seul le propriétaire ({owner}) peut faire cela.',
  'github.problem.invalidRepositoryName':
    'Nom invalide : lettres, chiffres, points, tirets et soulignés uniquement.',
  'github.problem.repositoryExists': 'Le dépôt {name} existe déjà.',
  'github.problem.cannotForkOwnRepository':
    'Tu ne peux pas forker ton propre dépôt. Change de coéquipier pour le forker.',
  'github.problem.alreadyForked': 'Tu as déjà un fork : {name}.',
  'github.problem.unrelatedRepositories':
    'Une pull request relie un dépôt à lui-même ou à l’un de ses forks.',
  'github.problem.titleRequired': 'Le titre est obligatoire.',
  'github.problem.sameBranch': 'Choisis deux branches différentes.',
  'github.problem.branchNotFound': 'Cette branche n’existe pas (ou plus) sur GitHub.',
  'github.problem.nothingToCompare': 'Rien à comparer : {head} n’a aucun commit absent de {base}.',
  'github.problem.pullRequestExists':
    'Une pull request est déjà ouverte pour ces branches : #{number}.',
  'github.problem.pullRequestNotFound': 'La pull request #{number} n’existe pas.',
  'github.problem.pullRequestNotOpen': 'La pull request #{number} n’est pas ouverte.',
  'github.problem.pullRequestNotClosed': 'La pull request #{number} n’est pas fermée.',
  'github.problem.cannotApproveOwn': 'On ne peut pas approuver sa propre pull request.',
  'github.problem.cannotRequestChangesOwn':
    'On ne peut pas demander des modifications sur sa propre pull request.',
  'github.problem.reviewBodyRequired': 'Écris un commentaire.',
  'github.problem.mergeBlocked': 'La fusion est bloquée : regarde les conditions listées.',
  'github.problem.cannotDeleteDefaultBranch':
    'La branche par défaut {branch} ne peut pas être supprimée.',
  'github.problem.cannotDeleteProtectedBranch':
    'La branche {branch} est protégée : retire d’abord sa règle de protection.',
  'github.problem.invalidApprovalCount': 'Entre 0 et {max} approbations.',
  'github.problem.unknownLabel': 'Label inconnu : {label}.',
  'github.problem.issueNotFound': 'L’issue #{number} n’existe pas.',
} as const;

export type GitHubMessageKey = keyof typeof GITHUB_FR;

export const GITHUB_EN: Record<GitHubMessageKey, string> = {
  'header.github': 'GitHub',

  'github.close': 'Close GitHub',
  'github.signedInAs': 'signed in as {login}',
  'github.allRepositories': 'Repositories',
  'github.repositories': 'Repositories on GitHub',
  'github.repositoriesIntro':
    'A simulated GitHub, without account or connection. Everything you do here is done as the active teammate.',
  'github.noRepositories': 'No repository yet.',
  'github.newRepository': 'New repository',
  'github.repositoryName': 'Repository name (under {owner}/)',
  'github.create': 'Create',
  'github.forkedFrom': 'forked from {parent}',
  'github.forkedFromPrefix': 'forked from',
  'github.emptyRepository': 'Empty repository',
  'github.defaultBranch': 'default branch: {branch}',
  'github.openPullRequests': 'open pull requests: {count}',
  'github.openIssues': 'open issues: {count}',
  'github.fork': 'Fork',
  'github.yourFork': 'Your fork: {name}',
  'github.repositoryNavigation': 'Repository navigation',
  'github.tab.code': 'Code',
  'github.tab.pulls': 'Pull requests',
  'github.tab.issues': 'Issues',
  'github.tab.actions': 'Actions',

  'github.cloneTitle': 'Clone this repository',
  'github.upstreamHint':
    'This is a fork: to get the news of the original repository, add it as the `upstream` remote (`origin` stays your fork).',
  'github.copy': 'Copy',
  'github.copied': 'Copied',
  'github.quickSetup': 'Quick setup',
  'github.quickSetupIntro':
    'This repository is empty. From a local repository with at least one commit, publish your branch:',
  'github.branches': 'Branches: {count}',
  'github.default': 'default',
  'github.protected': 'protected',
  'github.compareAndPullRequest': 'Compare & pull request',
  'github.deleteBranch': 'Delete branch',
  'github.tags': 'Tags',

  'github.checks.passed': 'CI passed',
  'github.checks.failed': 'CI failed',
  'github.checks.success': 'Success',
  'github.checks.failure': 'Failure',
  'github.checks.allPassed': 'All checks have passed.',
  'github.checks.someFailed': 'Some checks were not successful.',
  'github.checks.none':
    'No CI ran on this commit: the repository has no workflow in `.github/workflows/`.',
  'github.checks.commitNotConventional':
    '`{commit}` "{subject}" does not follow Conventional Commits (`type: description`).',
  'github.checks.conflictMarkers':
    '`{path}` still holds `<<<<<<<` conflict markers: the code does not compile.',
  'github.job.commitlint': 'checks the messages of the new commits',
  'github.job.build': 'builds the project',

  'github.state.open': 'Open',
  'github.state.merged': 'Merged',
  'github.state.closed': 'Closed',

  'github.pulls.filter': 'Filter pull requests',
  'github.pulls.open': 'Open: {count}',
  'github.pulls.closed': 'Closed: {count}',
  'github.pulls.new': 'New pull request',
  'github.pulls.empty':
    'No pull requests here. Push a branch, then propose it with "New pull request".',
  'github.pulls.summary': '#{number} opened by {author} · {head} → {base}',

  'github.newPull.title': 'Open a pull request',
  'github.newPull.intro':
    'Choose the branch to merge (`compare`) and the branch that will receive it (`base`). From a fork, the base is the original repository.',
  'github.newPull.baseRepository': 'Base repository',
  'github.newPull.base': 'base',
  'github.newPull.headRepository': 'Head repository',
  'github.newPull.compare': 'compare',
  'github.newPull.chooseBranches': 'Choose a branch to compare.',
  'github.newPull.nothingToCompare':
    'Nothing to compare: {head} has no commit missing from {base}.',
  'github.newPull.ableToMerge': '✓ Able to merge: these branches merge without conflicts.',
  'github.newPull.notMergeable':
    '⚠ These branches conflict. You can still open the pull request, but the conflict must be resolved before merging.',
  'github.newPull.titleLabel': 'Title',
  'github.newPull.titleHint':
    'Use the Conventional Commits format: with "squash", it becomes the commit message.',
  'github.newPull.bodyLabel': 'Description',
  'github.newPull.bodyPlaceholder':
    'Why this change? Write "Closes #3" to close issue 3 when merged.',
  'github.newPull.submit': 'Create pull request',

  'github.commits': 'Commits: {count}',
  'github.filesChanged': 'Files changed: {count}',
  'github.fileChange.added': 'file added',
  'github.fileChange.modified': 'file modified',
  'github.fileChange.deleted': 'file deleted',
  'github.line.added': 'added:',
  'github.line.removed': 'removed:',

  'github.pull.sections': 'Pull request sections',
  'github.pull.conversation': 'Conversation',
  'github.pull.wantsToMerge': '{author} wants to merge {count} commit(s) into {base} from {head}',
  'github.pull.mergedSummary': '{author} merged {count} commit(s) into {base} from {head}',
  'github.pull.opened': 'opened this pull request',
  'github.pull.noDescription': 'No description provided.',
  'github.pull.branchGone': 'The branch no longer exists: its changes cannot be shown.',

  'github.review.timeline': 'Reviews and comments',
  'github.review.commented': 'commented',
  'github.review.approved': 'approved these changes',
  'github.review.requestedChanges': 'requested changes',
  'github.review.title': 'Your review',
  'github.review.bodyLabel': 'Comment by {login}',
  'github.review.verdict': 'Verdict',
  'github.review.comment': 'Comment',
  'github.review.approve': 'Approve',
  'github.review.requestChanges': 'Request changes',
  'github.review.authorHint':
    'This is your pull request: you can comment on it, but only someone else can approve it.',
  'github.review.submit': 'Submit review',
  'github.review.requestFrom': 'Request a review from',
  'github.review.request': 'Request',

  'github.remark.looksGood':
    'Clear title, a description, well-formed commits and green CI: looks good to me!',
  'github.remark.titleNotConventional':
    'The title "{title}" does not follow Conventional Commits. With squash, it becomes the commit message: `feat: add login form`, for instance.',
  'github.remark.emptyDescription':
    'Please add a description: explain why this change is needed and how to test it.',
  'github.remark.commitNotConventional':
    'The commit "{subject}" does not follow Conventional Commits. Fix it (`git rebase`, `git commit --amend`) or squash when merging.',
  'github.remark.conflictMarkers':
    '`{path}` still holds `<<<<<<<` conflict markers. Finish the resolution before pushing.',
  'github.remark.checksFailing': 'CI is red: check the Actions tab and fix it before merging.',

  'github.blocker.closed': 'This pull request is not open.',
  'github.blocker.branchMissing': 'One of the two branches no longer exists.',
  'github.blocker.nothingToMerge': 'Everything is already in the base: nothing to merge.',
  'github.blocker.conflicts':
    'Conflicts with the base in: {paths}. Merge the base into your branch locally (`git pull origin {base}`), resolve, then push.',
  'github.blocker.approvals':
    'Review required: {current} of {required} approval(s) asked by the branch protection.',
  'github.blocker.changesRequested': 'Changes were requested by: {reviewers}.',
  'github.blocker.checks': 'CI must pass on the last commit (branch protection rule).',
  'github.mergeable': '✓ This branch can be merged.',
  'github.mergeMethod': 'Merge method',
  'github.method.merge': 'Merge commit',
  'github.method.merge.hint':
    'Keeps every commit of the branch and adds a merge commit: the history shows the branch.',
  'github.method.merge.button': 'Merge pull request',
  'github.method.squash': 'Squash and merge',
  'github.method.squash.hint':
    'Combines every commit into one on the base, with the pull request title as message: a clean, linear history.',
  'github.method.squash.button': 'Squash and merge',
  'github.method.rebase': 'Rebase and merge',
  'github.method.rebase.hint':
    'Replays each commit on top of the base, without a merge commit: a linear history, but new hashes.',
  'github.method.rebase.button': 'Rebase and merge',
  'github.closePullRequest': 'Close without merging',
  'github.closedNotice': 'This pull request was closed without being merged.',
  'github.reopen': 'Reopen',
  'github.merged.merge': '{login} merged this pull request into {base} (merge commit {commit}).',
  'github.merged.squash':
    '{login} merged this pull request into {base} as a single commit {commit}.',
  'github.merged.rebase':
    '{login} merged this pull request into {base} by replaying its commits (last one: {commit}).',
  'github.merged.pullHint':
    'The merge happened on GitHub: local repositories do not see it yet. Get it on `{base}`:',
  'github.merged.deleteHint': 'The branch did its job: you can delete it on GitHub.',

  'github.issues.intro': 'Issues describe a bug or an idea, before anyone writes code.',
  'github.issues.new': 'New issue',
  'github.issues.empty': 'No issues.',
  'github.issues.titleLabel': 'Title',
  'github.issues.bodyLabel': 'Description',
  'github.issues.labels': 'Labels',
  'github.issues.submit': 'Submit new issue',
  'github.issues.openedBy': 'opened by {author}',
  'github.issues.closedBy': 'Closed automatically when pull request #{number} was merged.',
  'github.issues.closingHint':
    'Write `Closes #{number}` in a pull request description: merging it will close this issue.',
  'github.issues.close': 'Close issue',
  'github.issues.reopen': 'Reopen issue',

  'github.actions.intro':
    'GitHub Actions runs a workflow on every push. Here, CI checks commit messages (`commitlint`) and that no conflict markers are left (`build`).',
  'github.actions.empty':
    'No workflow ran yet. GitHub only runs workflows declared in `.github/workflows/`: add this file to your repository and push it.',
  'github.actions.run': 'Run #{id}',
  'github.actions.trigger': 'push to {branch} ({commit})',

  'github.problem.repositoryNotFound': 'This repository does not exist.',
  'github.problem.notOwner': 'Only the owner ({owner}) can do that.',
  'github.problem.invalidRepositoryName':
    'Invalid name: letters, digits, dots, hyphens and underscores only.',
  'github.problem.repositoryExists': 'The repository {name} already exists.',
  'github.problem.cannotForkOwnRepository':
    'You cannot fork your own repository. Switch teammates to fork it.',
  'github.problem.alreadyForked': 'You already have a fork: {name}.',
  'github.problem.unrelatedRepositories':
    'A pull request links a repository to itself or to one of its forks.',
  'github.problem.titleRequired': 'A title is required.',
  'github.problem.sameBranch': 'Choose two different branches.',
  'github.problem.branchNotFound': 'This branch does not exist (anymore) on GitHub.',
  'github.problem.nothingToCompare':
    'Nothing to compare: {head} has no commit missing from {base}.',
  'github.problem.pullRequestExists':
    'A pull request is already open for these branches: #{number}.',
  'github.problem.pullRequestNotFound': 'Pull request #{number} does not exist.',
  'github.problem.pullRequestNotOpen': 'Pull request #{number} is not open.',
  'github.problem.pullRequestNotClosed': 'Pull request #{number} is not closed.',
  'github.problem.cannotApproveOwn': 'You cannot approve your own pull request.',
  'github.problem.cannotRequestChangesOwn': 'You cannot request changes on your own pull request.',
  'github.problem.reviewBodyRequired': 'Write a comment.',
  'github.problem.mergeBlocked': 'Merging is blocked: check the listed conditions.',
  'github.problem.cannotDeleteDefaultBranch': 'The default branch {branch} cannot be deleted.',
  'github.problem.cannotDeleteProtectedBranch':
    'The branch {branch} is protected: remove its protection rule first.',
  'github.problem.invalidApprovalCount': 'Between 0 and {max} approvals.',
  'github.problem.unknownLabel': 'Unknown label: {label}.',
  'github.problem.issueNotFound': 'Issue #{number} does not exist.',
};
