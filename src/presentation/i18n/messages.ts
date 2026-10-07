import type { Language } from '@/shared/language';

export type { Language } from '@/shared/language';

const fr = {
  'header.themeToLight': 'Passer au thème clair',
  'header.themeToDark': 'Passer au thème sombre',
  'header.languageSwitch': 'Switch to English',
  'header.languageShort': 'EN',

  'header.docs': 'Documentation',

  'docs.title': 'Documentation',
  'docs.intro':
    'Une fiche par commande et des guides de bonnes pratiques. Dans le terminal, F1 ouvre la fiche de la commande en cours.',
  'docs.close': 'Fermer la documentation',
  'docs.back': 'Page précédente',
  'docs.home': 'Sommaire',
  'docs.search': 'Rechercher une commande ou un guide',
  'docs.noResults': 'Aucun résultat pour « {query} ».',
  'docs.commands': 'Commandes',
  'docs.guides': 'Bonnes pratiques',
  'docs.guide': 'Guide',
  'docs.category.basics': 'Les bases',
  'docs.category.branches': 'Branches et historique',
  'docs.category.undo': 'Annuler et mettre de côté',
  'docs.category.shell': 'Terminal',
  'docs.section.description': 'Ce qu’elle fait',
  'docs.section.options': 'Syntaxe et options',
  'docs.section.examples': 'Exemples',
  'docs.section.underTheHood': 'Sous le capot',
  'docs.section.pitfalls': 'Pièges courants',
  'docs.related': 'Voir aussi',

  'files.title': 'Fichiers',
  'files.empty': 'Aucun fichier pour l’instant. Crée-en un depuis le terminal :',
  'files.notTracked': 'Pas encore de dépôt : Git ne suit aucun de ces fichiers.',
  'files.status.untracked': 'Non suivi : Git ne connaît pas encore ce fichier',
  'files.status.stagedAdded': 'Nouveau fichier ajouté à l’index',
  'files.status.stagedModified': 'Modification ajoutée à l’index',
  'files.status.stagedDeleted': 'Suppression ajoutée à l’index',
  'files.status.modified': 'Modifié depuis le dernier git add',
  'files.status.deleted': 'Supprimé du disque, pas encore dans l’index',
  'files.status.conflict': 'Conflit : corrige les marqueurs <<<<<<< puis fais git add',

  'graph.label': 'Graphe des commits',
  'graph.noRepository.title': 'Aucun dépôt Git ici',
  'graph.noRepository.body': 'Tape cette commande dans le terminal pour en créer un :',
  'graph.noCommits.title': 'Dépôt prêt, aucun commit',
  'graph.noCommits.body': 'Crée un fichier, ajoute-le à l’index, puis enregistre-le :',
  'graph.head': 'Tu es ici : HEAD désigne le commit sur lequel tu travailles',
  'graph.headDetached': 'HEAD détaché : tu n’es sur aucune branche',
  'graph.unreachable': 'Aucune branche ne mène plus à ce commit',
  'graph.mergeCommit': 'Commit de fusion : il réunit deux historiques',
  'graph.tag': 'Tag : un nom fixe posé sur ce commit',
  'graph.summary': 'Commits : {count}, du plus récent au plus ancien. HEAD : {head}.',
  'graph.summaryDetached': 'détaché sur {commit}',
  'graph.controls': 'Contrôles du graphe',
  'graph.zoomIn': 'Zoomer',
  'graph.zoomOut': 'Dézoomer',
  'graph.fitView': 'Afficher tout le graphe',
  'graph.minimap': 'Vue d’ensemble du graphe',

  'terminal.label': 'Terminal',
  'terminal.inputLabel': 'Commande',
  'terminal.welcome.title': 'Bienvenue dans Agitz.',
  'terminal.welcome.body':
    'Ce terminal simule un vrai shell avec Git. Tape help pour voir les commandes, ou commence par :',
  'terminal.completions': 'Suggestions :',
  'terminal.keyboardHelp':
    'Entrée exécute la commande, flèches haut et bas pour l’historique, Tab complète une commande commencée, Échap quitte le terminal.',
} as const;

export type MessageKey = keyof typeof fr;

const en: Record<MessageKey, string> = {
  'header.themeToLight': 'Switch to light theme',
  'header.themeToDark': 'Switch to dark theme',
  'header.languageSwitch': 'Passer en français',
  'header.languageShort': 'FR',

  'header.docs': 'Documentation',

  'docs.title': 'Documentation',
  'docs.intro':
    'One page per command, plus best practice guides. In the terminal, F1 opens the page of the command being typed.',
  'docs.close': 'Close the documentation',
  'docs.back': 'Previous page',
  'docs.home': 'Contents',
  'docs.search': 'Search a command or a guide',
  'docs.noResults': 'No results for "{query}".',
  'docs.commands': 'Commands',
  'docs.guides': 'Best practices',
  'docs.guide': 'Guide',
  'docs.category.basics': 'Basics',
  'docs.category.branches': 'Branches and history',
  'docs.category.undo': 'Undo and set aside',
  'docs.category.shell': 'Terminal',
  'docs.section.description': 'What it does',
  'docs.section.options': 'Syntax and options',
  'docs.section.examples': 'Examples',
  'docs.section.underTheHood': 'Under the hood',
  'docs.section.pitfalls': 'Common pitfalls',
  'docs.related': 'See also',

  'files.title': 'Files',
  'files.empty': 'No files yet. Create one from the terminal:',
  'files.notTracked': 'No repository yet: Git does not track any of these files.',
  'files.status.untracked': 'Untracked: Git does not know this file yet',
  'files.status.stagedAdded': 'New file added to the index',
  'files.status.stagedModified': 'Change added to the index',
  'files.status.stagedDeleted': 'Deletion added to the index',
  'files.status.modified': 'Modified since the last git add',
  'files.status.deleted': 'Deleted from disk, not in the index yet',
  'files.status.conflict': 'Conflict: fix the <<<<<<< markers, then run git add',

  'graph.label': 'Commit graph',
  'graph.noRepository.title': 'No Git repository here',
  'graph.noRepository.body': 'Type this command in the terminal to create one:',
  'graph.noCommits.title': 'Repository ready, no commits yet',
  'graph.noCommits.body': 'Create a file, add it to the index, then record it:',
  'graph.head': 'You are here: HEAD is the commit you are working on',
  'graph.headDetached': 'Detached HEAD: you are not on any branch',
  'graph.unreachable': 'No branch leads to this commit anymore',
  'graph.mergeCommit': 'Merge commit: it joins two histories',
  'graph.tag': 'Tag: a fixed name on this commit',
  'graph.summary': 'Commits: {count}, newest first. HEAD: {head}.',
  'graph.summaryDetached': 'detached at {commit}',
  'graph.controls': 'Graph controls',
  'graph.zoomIn': 'Zoom in',
  'graph.zoomOut': 'Zoom out',
  'graph.fitView': 'Show the whole graph',
  'graph.minimap': 'Graph overview',

  'terminal.label': 'Terminal',
  'terminal.inputLabel': 'Command',
  'terminal.welcome.title': 'Welcome to Agitz.',
  'terminal.welcome.body':
    'This terminal simulates a real shell with Git. Type help to list the commands, or start with:',
  'terminal.completions': 'Suggestions:',
  'terminal.keyboardHelp':
    'Enter runs the command, up and down arrows browse history, Tab completes a started command, Escape leaves the terminal.',
};

export const MESSAGES: Record<Language, Record<MessageKey, string>> = { fr, en };
