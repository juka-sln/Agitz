/** Texts of the file editor and conflict resolver, merged into the interface dictionary. */
export const EDITOR_FR = {
  'header.editor': 'Éditeur',
  'header.conflicts': 'Fichiers en conflit : {count}',

  'files.newFile': 'Nouveau fichier',
  'files.newFilePath': 'Chemin du nouveau fichier',
  'files.create': 'Créer',
  'files.openInEditor': 'Ouvrir {path} dans l’éditeur',

  'terminal.resolveConflicts': 'Résoudre dans l’éditeur',

  'editor.title': 'Éditeur',
  'editor.close': 'Fermer l’éditeur',
  'editor.overview': 'Vue d’ensemble',
  'editor.intro':
    'Clique sur un fichier de l’explorateur pour le modifier. Quand une commande s’arrête sur un conflit, c’est ici que tu le résous.',
  'editor.problem.invalidPath': 'Ce chemin sort du projet ou vise le dossier .git.',
  'editor.problem.isDirectory': 'Un dossier porte déjà ce nom.',
  'editor.problem.parentIsFile': 'Un fichier occupe déjà la place d’un des dossiers de ce chemin.',
  'editor.cancel': 'Annuler',
  'editor.run': 'Exécuter dans le terminal',
  'editor.runCommand': 'Exécuter dans le terminal : {command}',

  'editor.scenario.title': 'Scénario guidé : un conflit de fusion',
  'editor.scenario.body':
    'Alice et Bob modifient la même ligne de README.md sur deux branches, puis Alice fusionne la branche de Bob : Git s’arrête sur un conflit. Les commandes sont tapées pour toi dans leurs deux terminaux ; à toi de résoudre le conflit.',
  'editor.scenario.start': 'Lancer le scénario',
  'editor.scenario.resetWarning':
    'Le scénario part d’une session vierge : les fichiers, dépôts et terminaux actuels seront effacés.',
  'editor.scenario.confirm': 'Tout effacer et lancer',

  'editor.operation.merge': 'Fusion en cours',
  'editor.operation.rebase': 'Rebase en cours',
  'editor.operation.cherry-pick': 'Cherry-pick en cours',
  'editor.operation.revert': 'Revert en cours',
  'editor.operation.stash': 'Conflits laissés par git stash',
  'editor.steps.resolve': 'Corrige chaque fichier',
  'editor.steps.resolveBody':
    'Garde la bonne version entre les marqueurs <<<<<<< et >>>>>>>, puis enregistre.',
  'editor.steps.stage': 'Marque-les comme résolus',
  'editor.steps.stageBody': 'git add dit à Git que le contenu du fichier est le bon.',
  'editor.steps.conclude': 'Termine l’opération',
  'editor.steps.concludeWaiting': 'Disponible une fois tous les fichiers marqués comme résolus :',
  'editor.steps.stashDone':
    'Plus rien à résoudre. L’entrée du stash a été conservée : supprime-la avec git stash drop si tout est bon.',
  'editor.steps.abort': 'Pour tout annuler et revenir à l’état d’avant :',
  'editor.fileStep.resolve': 'à corriger',
  'editor.fileStep.stage': 'prêt pour git add',
  'editor.fileStep.done': 'résolu',

  'editor.unsaved': 'non enregistré',
  'editor.save': 'Enregistrer',
  'editor.discard': 'Annuler les modifications',
  'editor.saveShortcut': 'Ctrl+S enregistre le fichier.',
  'editor.changedOnDisk':
    'Le fichier a changé sur le disque depuis que tu l’as ouvert (une commande l’a réécrit).',
  'editor.reload': 'Recharger',
  'editor.missing': 'Ce fichier n’existe pas sur le poste de {user}.',
  'editor.missingConflict':
    'Le fichier a été supprimé d’un côté. Pour garder la suppression, marque-la avec git add ; pour le garder, recrée-le.',
  'editor.recreate': 'Recréer le fichier',
  'editor.content': 'Contenu de {path}',
  'editor.mode': 'Affichage',
  'editor.mode.guided': 'Résolution guidée',
  'editor.mode.text': 'Texte brut',
  'editor.remaining': 'Conflits dans ce fichier : {count}',
  'editor.markersHint':
    'Les lignes <<<<<<<, ======= et >>>>>>> sont écrites par Git pour délimiter les deux versions : elles doivent disparaître du fichier.',
  'editor.rebaseHint':
    'Pendant un rebase, les rôles s’inversent : HEAD est la branche sur laquelle tes commits sont rejoués, et la version entrante est ton propre commit.',
  'editor.conflict.heading': 'Conflit {index} sur {count}',
  'editor.conflict.ours': 'Version actuelle',
  'editor.conflict.theirs': 'Version entrante',
  'editor.conflict.base': 'Ancêtre commun',
  'editor.conflict.empty': '(aucune ligne)',
  'editor.accept.ours': 'Garder l’actuelle',
  'editor.accept.theirs': 'Garder l’entrante',
  'editor.accept.both': 'Garder les deux',
  'editor.next.save': 'Enregistre pour écrire le fichier sur le disque.',
  'editor.next.markersLeft':
    'Le fichier enregistré contient encore des marqueurs de conflit : Git les committerait tels quels.',
  'editor.next.stage': 'Plus aucun marqueur : dis à Git que ce conflit est réglé.',
  'editor.next.nextFile': 'Fichier suivant : {path}',
  'editor.next.conclude': 'Tous les conflits sont réglés. Termine l’opération :',
  'editor.next.overview': 'Voir les étapes restantes',
};

export const EDITOR_EN: Record<keyof typeof EDITOR_FR, string> = {
  'header.editor': 'Editor',
  'header.conflicts': 'Files in conflict: {count}',

  'files.newFile': 'New file',
  'files.newFilePath': 'Path of the new file',
  'files.create': 'Create',
  'files.openInEditor': 'Open {path} in the editor',

  'terminal.resolveConflicts': 'Resolve in the editor',

  'editor.title': 'Editor',
  'editor.close': 'Close the editor',
  'editor.overview': 'Overview',
  'editor.intro':
    'Click a file in the explorer to edit it. When a command stops on a conflict, this is where you resolve it.',
  'editor.problem.invalidPath': 'This path leaves the project or points into the .git folder.',
  'editor.problem.isDirectory': 'A folder already has this name.',
  'editor.problem.parentIsFile': 'A file stands where one of the folders of this path should be.',
  'editor.cancel': 'Cancel',
  'editor.run': 'Run in the terminal',
  'editor.runCommand': 'Run in the terminal: {command}',

  'editor.scenario.title': 'Guided scenario: a merge conflict',
  'editor.scenario.body':
    'Alice and Bob change the same line of README.md on two branches, then Alice merges Bob’s branch: Git stops on a conflict. The commands are typed for you in both terminals; resolving the conflict is up to you.',
  'editor.scenario.start': 'Start the scenario',
  'editor.scenario.resetWarning':
    'The scenario starts from a blank session: the current files, repositories and terminals will be erased.',
  'editor.scenario.confirm': 'Erase everything and start',

  'editor.operation.merge': 'Merge in progress',
  'editor.operation.rebase': 'Rebase in progress',
  'editor.operation.cherry-pick': 'Cherry-pick in progress',
  'editor.operation.revert': 'Revert in progress',
  'editor.operation.stash': 'Conflicts left by git stash',
  'editor.steps.resolve': 'Fix each file',
  'editor.steps.resolveBody':
    'Keep the right version between the <<<<<<< and >>>>>>> markers, then save.',
  'editor.steps.stage': 'Mark them as resolved',
  'editor.steps.stageBody': 'git add tells Git the content of the file is the right one.',
  'editor.steps.conclude': 'Finish the operation',
  'editor.steps.concludeWaiting': 'Available once every file is marked as resolved:',
  'editor.steps.stashDone':
    'Nothing left to resolve. The stash entry was kept: remove it with git stash drop if everything is fine.',
  'editor.steps.abort': 'To cancel everything and go back to how things were:',
  'editor.fileStep.resolve': 'to fix',
  'editor.fileStep.stage': 'ready for git add',
  'editor.fileStep.done': 'resolved',

  'editor.unsaved': 'unsaved',
  'editor.save': 'Save',
  'editor.discard': 'Discard changes',
  'editor.saveShortcut': 'Ctrl+S saves the file.',
  'editor.changedOnDisk': 'The file changed on disk since you opened it (a command rewrote it).',
  'editor.reload': 'Reload',
  'editor.missing': 'This file does not exist on {user}’s workstation.',
  'editor.missingConflict':
    'The file was deleted on one side. To keep the deletion, record it with git add; to keep the file, create it again.',
  'editor.recreate': 'Create the file again',
  'editor.content': 'Content of {path}',
  'editor.mode': 'Display',
  'editor.mode.guided': 'Guided resolution',
  'editor.mode.text': 'Plain text',
  'editor.remaining': 'Conflicts in this file: {count}',
  'editor.markersHint':
    'The <<<<<<<, ======= and >>>>>>> lines are written by Git to separate both versions: they must be gone from the file.',
  'editor.rebaseHint':
    'During a rebase the roles are swapped: HEAD is the branch your commits are replayed onto, and the incoming version is your own commit.',
  'editor.conflict.heading': 'Conflict {index} of {count}',
  'editor.conflict.ours': 'Current version',
  'editor.conflict.theirs': 'Incoming version',
  'editor.conflict.base': 'Common ancestor',
  'editor.conflict.empty': '(no lines)',
  'editor.accept.ours': 'Keep current',
  'editor.accept.theirs': 'Keep incoming',
  'editor.accept.both': 'Keep both',
  'editor.next.save': 'Save to write the file to disk.',
  'editor.next.markersLeft':
    'The saved file still holds conflict markers: Git would commit them as they are.',
  'editor.next.stage': 'No markers left: tell Git this conflict is settled.',
  'editor.next.nextFile': 'Next file: {path}',
  'editor.next.conclude': 'Every conflict is settled. Finish the operation:',
  'editor.next.overview': 'See the remaining steps',
};
