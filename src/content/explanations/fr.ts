import { plural, type ExplanationText } from './types';

export const fr = {
  'init.created':
    'Un dossier caché `.git` vient d’être créé : c’est lui, le dépôt. Il contiendra tout l’historique. Tu es sur la branche `{branch}`, encore vide jusqu’au premier commit.',
  'init.reinitialized':
    'Ce dossier était déjà un dépôt Git. Relancer `git init` est sans danger : rien n’a été effacé.',

  'add.staged': ({ count, paths }) =>
    `${plural(count, 'Le fichier', 'Les fichiers')} ${String(paths)} ${plural(count, 'est maintenant dans', 'sont maintenant dans')} l’index (la zone de préparation). Ils feront partie du prochain commit.`,
  'add.nothingChanged':
    'Rien de nouveau : ces fichiers sont déjà dans l’index tels qu’ils sont sur le disque.',
  'add.nothingSpecified':
    'Il faut dire à Git quels fichiers ajouter, par exemple `git add README.md` ou `git add .` pour tout le dossier.',
  'add.resolvedConflicts': ({ count }) =>
    `${String(count)} ${plural(count, 'conflit est marqué comme résolu', 'conflits sont marqués comme résolus')}. Quand tous le sont, termine l’opération (\`git commit\` ou \`--continue\`).`,

  'status.clean':
    'Tout est propre : le disque, l’index et le dernier commit contiennent exactement la même chose.',
  'status.changes': ({ staged, unstaged, untracked }) =>
    `En résumé : ${String(staged)} prêt(s) pour le commit (en vert), ${String(unstaged)} modifié(s) mais pas encore ajouté(s) et ${String(untracked)} inconnu(s) de Git (en rouge). \`git add\` fait passer un fichier du rouge au vert.`,

  'commit.createdRoot':
    'Premier commit ! `{hash}` est la racine de l’historique : il n’a pas de parent. La branche `{branch}` existe désormais et pointe sur lui.',
  'commit.created':
    'Nouveau commit `{hash}` : une photo de l’index a été enregistrée. La branche `{branch}` avance d’un cran pour pointer dessus.',
  'commit.createdDetached':
    'Commit `{hash}` créé en HEAD détaché : aucune branche ne le suit. Crée-en une (`git switch -c <nom>` ou `git checkout -b <nom>`) avant de partir, sinon il sera difficile à retrouver.',
  'commit.createdMerge':
    'Commit de fusion `{hash}` : il a deux parents et réunit les deux historiques sur `{branch}`. La fusion est terminée.',
  'commit.amended':
    'Le dernier commit a été remplacé : `{previous}` devient `{hash}`. C’est un nouveau commit, l’ancien n’est plus sur la branche. Ne le fais pas sur un commit déjà partagé.',
  'commit.nothingToCommit':
    'Rien à enregistrer : l’index est identique au dernier commit. Ajoute d’abord des changements avec `git add`.',

  'log.shown': ({ count }) =>
    `${String(count)} ${plural(count, 'commit affiché', 'commits affichés')}, du plus récent au plus ancien, en remontant les parents depuis HEAD.`,

  'branch.listed':
    'Voici les branches locales. L’astérisque marque celle sur laquelle tu te trouves.',
  'branch.created':
    'La branche `{name}` est créée sur `{commit}`. Ce n’est qu’une étiquette : aucun fichier n’est copié et tu restes sur ta branche actuelle.',
  'branch.reset':
    'La branche `{name}` a été déplacée de force sur `{commit}`. Les commits qu’elle seule désignait peuvent devenir introuvables.',
  'branch.deleted': ({ names, count }) =>
    `${plural(count, 'La branche', 'Les branches')} ${String(names)} ${plural(count, 'est supprimée', 'sont supprimées')}. Seule l’étiquette disparaît : les commits restent tant qu’une autre référence y mène.`,
  'branch.renamed': 'La branche `{from}` s’appelle maintenant `{to}`. Ses commits n’ont pas bougé.',

  'checkout.switchedBranch': ({ branch, leftBehind }) =>
    `Tu es maintenant sur \`${String(branch)}\` : HEAD pointe sur cette branche et les fichiers du dossier ont été remplacés par ceux de son dernier commit.${Number(leftBehind) > 0 ? ` Attention : ${String(leftBehind)} commit(s) créé(s) en HEAD détaché ne sont plus sur aucune branche.` : ''}`,
  'checkout.alreadyOn': 'Tu es déjà sur `{branch}` : rien ne change.',
  'checkout.createdBranch':
    'Raccourci de `git branch` + `git checkout` : la branche `{branch}` est créée et tu es déjà dessus. Tes prochains commits la feront avancer.',
  'checkout.detached': ({ commit, leftBehind }) =>
    `HEAD est détaché sur \`${String(commit)}\` : tu regardes ce commit sans être sur une branche. Tu peux explorer librement ; pour garder un travail fait ici, crée une branche.${Number(leftBehind) > 0 ? ` ${String(leftBehind)} commit(s) laissé(s) derrière ne sont plus sur aucune branche.` : ''}`,
  'checkout.nothingToDo':
    'Sans argument, `git checkout` ne fait rien. Indique une branche, un commit ou des fichiers.',
  'checkout.restoredPaths': ({ count, source }) =>
    `${String(count)} ${plural(count, 'fichier restauré', 'fichiers restaurés')} depuis ${source === 'index' ? 'l’index' : `\`${String(source)}\``}. Les modifications non enregistrées de ces fichiers sont perdues.`,

  'merge.upToDate': '`{target}` est déjà contenu dans ta branche : il n’y a rien à fusionner.',
  'merge.fastForward':
    'Fusion en avance rapide (fast-forward) : ta branche n’avait rien de nouveau, son étiquette a simplement glissé de `{from}` à `{to}`. Aucun commit de fusion n’est nécessaire.',
  'merge.merged':
    'Les deux branches avaient divergé : Git a combiné leurs changements depuis l’ancêtre commun et créé le commit de fusion `{commit}`, qui a deux parents.',
  'merge.conflicts': ({ target, count }) =>
    `La fusion de \`${String(target)}\` s’arrête sur ${String(count)} ${plural(count, 'conflit', 'conflits')} : les deux côtés ont modifié les mêmes lignes. Ouvre les fichiers, choisis le bon contenu entre les marqueurs <<<<<<< et >>>>>>>, puis \`git add\` et \`git commit\`. \`git merge --abort\` annule tout.`,
  'merge.aborted': 'Fusion abandonnée : tout est revenu à l’état d’avant `git merge`.',

  'rebase.upToDate':
    'Ta branche part déjà du dernier commit de `{upstream}` : il n’y a rien à rejouer.',
  'rebase.done': ({ count }) =>
    `Rebase terminé : ${String(count)} ${plural(count, 'commit a été rejoué', 'commits ont été rejoués')} au-dessus de la nouvelle base. Ce sont de nouveaux commits (nouveaux hash) ; les anciens ne sont plus sur la branche.`,
  'rebase.conflicts':
    'Le rebase s’arrête en rejouant `{commit}` : conflit. Corrige les fichiers, `git add`, puis `git rebase --continue`. `git rebase --abort` remet tout comme avant.',
  'rebase.aborted': 'Rebase abandonné : ta branche est revenue exactement à son état de départ.',

  'cherry-pick.done': ({ count }) =>
    `${plural(count, 'Le commit a été copié', `${String(count)} commits ont été copiés`)} sur ta branche. ${plural(count, 'La copie a', 'Les copies ont')} le même contenu mais un nouveau hash : l’original reste où il était.`,
  'cherry-pick.conflicts':
    'La copie de `{commit}` provoque un conflit. Corrige les fichiers, `git add`, puis `git cherry-pick --continue` (ou `--abort` pour annuler).',
  'cherry-pick.aborted': 'Cherry-pick abandonné : ta branche est revenue à son état de départ.',

  'revert.done': ({ count }) =>
    `${plural(count, 'Un commit inverse a été ajouté', `${String(count)} commits inverses ont été ajoutés`)} : ils annulent les changements visés sans réécrire l’historique. C’est la façon sûre d’annuler un commit déjà partagé.`,
  'revert.conflicts':
    'Annuler `{commit}` provoque un conflit avec des changements plus récents. Corrige les fichiers, `git add`, puis `git revert --continue` (ou `--abort`).',
  'revert.aborted': 'Revert abandonné : ta branche est revenue à son état de départ.',

  'reset.soft':
    'Reset --soft : la branche recule sur `{commit}`, mais l’index et tes fichiers restent intacts. Les changements des commits retirés t’attendent, prêts à être recommités.',
  'reset.mixed':
    'Reset --mixed : la branche recule sur `{commit}` et l’index est vidé de ces changements. Tes fichiers sur le disque, eux, n’ont pas bougé.',
  'reset.hard':
    'Reset --hard : la branche, l’index ET tes fichiers reviennent à `{commit}`. Les modifications non commitées sont définitivement perdues.',
  'reset.paths': ({ count }) =>
    `${String(count)} ${plural(count, 'chemin retiré', 'chemins retirés')} de l’index : c’est l’inverse de \`git add\`. Tes fichiers sur le disque ne changent pas.`,

  'stash.saved':
    'Tes modifications sont mises de côté dans la pile du stash et ton dossier est revenu à l’état du dernier commit. `git stash pop` les ramènera.',
  'stash.nothingToSave': 'Il n’y a aucune modification à mettre de côté.',
  'stash.listed': ({ count }) =>
    `${String(count)} ${plural(count, 'entrée', 'entrées')} dans le stash. \`stash@{0}\` est la plus récente.`,
  'stash.applied':
    '`{reference}` a été réappliqué sur tes fichiers. L’entrée reste dans la pile (`git stash drop` pour la supprimer).',
  'stash.popped': '`{reference}` a été réappliqué puis retiré de la pile.',
  'stash.conflicts':
    'Réappliquer `{reference}` provoque des conflits. Résous-les ; l’entrée est conservée dans la pile pour ne rien perdre.',
  'stash.dropped': '`{reference}` est supprimé de la pile. Ces modifications sont perdues.',

  'tag.listed': ({ count }) => `${String(count)} ${plural(count, 'tag', 'tags')} dans ce dépôt.`,
  'tag.created':
    'Tag léger `{name}` posé sur `{commit}`. Contrairement à une branche, il ne bougera jamais : idéal pour marquer une version.',
  'tag.createdAnnotated':
    'Tag annoté `{name}` posé sur `{commit}`, avec un auteur, une date et un message. C’est le format recommandé pour les versions publiées.',
  'tag.deleted': 'Tag(s) {names} supprimé(s). Les commits, eux, ne bougent pas.',

  'shell.help': 'Voici les commandes du terminal simulé. Les commandes Git commencent par `git`.',
  'shell.gitUsage': 'Liste des commandes Git disponibles dans Agitz.',
  'shell.version': 'La version de Git simulée par Agitz.',
  'shell.printed': '',
  'shell.listed': '',
  'shell.empty': '',
  'shell.fileWritten':
    'Le fichier `{path}` a été écrit. Si Git le suit déjà, il apparaît comme modifié dans `git status`.',
  'shell.fileAppended': 'Une ligne a été ajoutée à la fin de `{path}`.',
  'shell.fileCreated':
    'Fichier(s) créé(s) : {path}. Pour Git, un nouveau fichier est « non suivi ».',
  'shell.fileRemoved':
    'Supprimé du disque : {path}. Si Git le suivait, `git status` montre une suppression à ajouter avec `git add`.',
  'shell.implicitDirectories':
    'Git ne suit que des fichiers : un dossier vide n’existe pas pour lui. Crée directement un fichier dans le dossier.',
  'shell.error': 'La commande `{command}` a échoué : relis le message juste au-dessus.',
  'shell.syntaxError':
    'La ligne n’a pas pu être analysée : vérifie les guillemets et les redirections (`>`).',
  'shell.redirectUnsupported':
    'Dans Agitz, seule `echo` accepte une redirection : `echo "texte" > fichier.txt`.',
  'shell.commandNotFound':
    '`{command}` n’existe pas dans ce terminal. Tape `help` pour voir les commandes disponibles.',
  'shell.unknownGitCommand': ({ command, suggestions }) =>
    `\`git ${String(command)}\` n’est pas une commande Git.${suggestions === '' ? '' : ` Tu voulais peut-être : ${String(suggestions)}.`}`,
  'shell.notImplemented':
    '`git {command}` existe bien dans Git, mais Agitz ne la simule pas encore. Elle arrivera dans une prochaine version.',

  'error.notAGitRepository': 'Ce dossier n’est pas (encore) un dépôt Git. Commence par `git init`.',
  'error.noCommitsYet':
    'La branche `{branch}` n’a encore aucun commit : fais d’abord un premier commit.',
  'error.noInitialCommit': 'Il faut au moins un commit avant de pouvoir utiliser le stash.',
  'error.unknownRevision':
    'Git ne trouve ni commit ni fichier nommé `{revision}`. Vérifie le nom de la branche ou le hash.',
  'error.ambiguousRevision':
    'Le hash court `{revision}` correspond à plusieurs commits : tape quelques caractères de plus.',
  'error.badRevision': '`{revision}` ne désigne aucun commit connu.',
  'error.invalidObjectName': '`{name}` ne désigne aucun commit connu.',
  'error.invalidReference': '`{reference}` n’est ni une branche ni un commit existant.',
  'error.invalidUpstream': '`{upstream}` n’est ni une branche ni un commit sur lequel rebaser.',
  'error.invalidBranchName':
    '`{name}` n’est pas un nom de branche valide : pas d’espace, de `..`, de `~`, `^`, `:` ni de `/` en fin de nom.',
  'error.invalidInitialBranchName': '`{name}` ne peut pas servir de nom de branche initiale.',
  'error.branchAlreadyExists':
    'La branche `{name}` existe déjà. Choisis un autre nom, ou bascule dessus avec `git checkout {name}`.',
  'error.branchNotFound': 'Aucune branche ne s’appelle `{name}`. `git branch` liste les branches.',
  'error.noBranchNamed': 'Aucune branche ne s’appelle `{name}`.',
  'error.invalidStartPoint':
    '`{startPoint}` ne désigne aucun commit : impossible de créer `{branch}` à partir de là.',
  'error.cannotDeleteCurrentBranch':
    'Impossible de supprimer `{name}` : tu es dessus. Bascule d’abord sur une autre branche.',
  'error.cannotForceUpdateCurrentBranch':
    'Impossible de déplacer de force `{name}` : tu es dessus. Utilise plutôt `git reset`.',
  'error.branchNotFullyMerged':
    '`{name}` contient des commits qui ne sont fusionnés nulle part : les supprimer les perdrait. Fusionne-la d’abord, ou force avec `git branch -D {name}` si tu es sûr.',
  'error.detachedHeadRename':
    'En HEAD détaché, il n’y a pas de branche courante à renommer. Précise l’ancien et le nouveau nom.',
  'error.emptyCommitMessage':
    'Un commit a toujours besoin d’un message : `git commit -m "feat: add login form"`.',
  'error.nothingToAmend': 'Il n’y a pas encore de commit à modifier.',
  'error.amendDuringMerge':
    'Une fusion est en cours : termine-la avec `git commit` avant de modifier un commit.',
  'error.unmergedFiles':
    'Des fichiers sont encore en conflit. Corrige-les, marque-les résolus avec `git add`, puis réessaie.',
  'error.unresolvedIndex': ({ count }) =>
    `${String(count)} ${plural(count, 'fichier est encore en conflit', 'fichiers sont encore en conflit')}. Résous ${plural(count, 'le', 'les')} et fais \`git add\` avant de continuer.`,
  'error.operationInProgress': ({ operation }) =>
    `${operation === 'merge' ? 'Une fusion' : `Un ${String(operation)}`} est déjà en cours. Termine l’opération avec \`--continue\` (ou \`git commit\` pour une fusion) ou annule-la avec \`--abort\` avant de lancer autre chose.`,
  'error.noOperationInProgress': ({ operation, action }) =>
    `${operation === 'merge' ? 'Aucune fusion' : `Aucun ${String(operation)}`} n’est en cours : il n’y a rien à \`--${String(action)}\`.`,
  'error.notMergeable':
    '`{target}` n’est ni une branche ni un commit : impossible de le fusionner.',
  'error.notPossibleToFastForward':
    'Avec `--ff-only`, Git refuse de créer un commit de fusion : les branches ont divergé.',
  'error.unrelatedHistories':
    'Ces deux historiques n’ont aucun ancêtre commun : Git refuse de les fusionner par prudence.',
  'error.mergeCommitWithoutMainline':
    '`{commit}` est un commit de fusion : il a deux parents et Git ne sait pas par rapport auquel le rejouer. Agitz ne gère pas encore l’option `-m`.',
  'error.dirtyWorkingTree':
    'Impossible de lancer `git {operation}` avec des modifications non commitées. Commite-les ou mets-les de côté avec `git stash`.',
  'error.localChangesWouldBeOverwritten': ({ count }) =>
    `Git refuse pour protéger tes modifications : ${String(count)} ${plural(count, 'fichier modifié serait écrasé', 'fichiers modifiés seraient écrasés')}. Commite-les ou fais \`git stash\` d’abord.`,
  'error.untrackedFilesWouldBeOverwritten': ({ count }) =>
    `${String(count)} ${plural(count, 'fichier non suivi serait écrasé', 'fichiers non suivis seraient écrasés')} par cette opération. Déplace-${plural(count, 'le', 'les')} ou ajoute-${plural(count, 'le', 'les')} d’abord.`,
  'error.invalidPath': '`{path}` est en dehors du dépôt.',
  'error.pathspecNotMatched':
    'Aucun fichier ne correspond à `{pathspec}`. Vérifie le nom avec `ls`.',
  'error.pathspecNotKnown': 'Git ne connaît aucun fichier nommé `{pathspec}`.',
  'error.resetWithPaths':
    '`git reset --{mode}` déplace toute la branche : il ne s’applique pas à des fichiers isolés.',
  'error.noStashEntries': 'Le stash est vide : rien à réappliquer ou supprimer.',
  'error.invalidStashReference':
    '`{reference}` n’existe pas dans le stash. `git stash list` les liste.',
  'error.invalidTagName': '`{name}` n’est pas un nom de tag valide.',
  'error.tagAlreadyExists':
    'Le tag `{name}` existe déjà. Un tag ne se déplace pas : supprime-le d’abord avec `git tag -d {name}`.',
  'error.tagNotFound': 'Aucun tag ne s’appelle `{name}`.',
  'error.emptyTagMessage':
    'Un tag annoté a besoin d’un message : `git tag -a v1.0.0 -m "First release"`.',
  'error.usage': 'La commande est mal formée : la syntaxe attendue est affichée juste au-dessus.',
  'error.commandLine': 'Les options passées ne sont pas valides : relis le message au-dessus.',
  'error.notSupported':
    'Cette option existe dans Git, mais Agitz ne la simule pas encore : {feature}.',
} as const satisfies Record<string, ExplanationText>;
