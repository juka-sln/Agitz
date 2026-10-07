import type { CommandDoc } from '../model';

export const commitDoc: CommandDoc = {
  kind: 'command',
  id: 'commit',
  title: 'git commit',
  category: 'basics',
  related: ['add', 'log', 'reset', 'commit-messages'],
  text: {
    fr: {
      summary: 'Enregistre le contenu de l’index comme un nouveau point de l’historique.',
      description: [
        'Un commit est une photo complète de ton projet à un instant donné, accompagnée d’un message, d’un auteur et d’une date. Il est identifié par un hash (ex. `a1b2c3d`) calculé à partir de tout ce contenu.',
        'Seul ce qui est dans l’index part dans le commit. Le cycle de base est donc toujours : modifier → `git add` → `git commit`.',
        '`--amend` remplace le dernier commit par un nouveau, pour corriger un message ou ajouter un fichier oublié.',
      ],
      options: [
        { syntax: 'git commit -m "<message>"', text: 'Crée le commit avec ce message.' },
        {
          syntax: 'git commit -a -m "<message>"',
          text: 'Ajoute d’abord tous les fichiers déjà suivis (`--all`), puis commite. Les nouveaux fichiers ne sont pas inclus.',
        },
        {
          syntax: 'git commit --amend -m "<message>"',
          text: 'Remplace le dernier commit (nouveau message et contenu actuel de l’index).',
        },
        {
          syntax: 'git commit --amend --no-edit',
          text: 'Remplace le dernier commit en gardant son message.',
        },
        {
          syntax: 'git commit --allow-empty -m "<message>"',
          text: 'Autorise un commit sans changement.',
        },
      ],
      examples: [
        {
          command: 'git commit -m "feat: add login form"',
          text: 'Un message au format Conventional Commits.',
        },
        {
          command: 'git commit -am "fix: correct typo in title"',
          text: 'Ajoute les fichiers suivis et commite en une fois.',
        },
        {
          command: 'git commit --amend --no-edit',
          text: 'Ajoute au dernier commit un fichier oublié (après `git add`).',
        },
      ],
      underTheHood: [
        'Une nouvelle station apparaît sur la ligne de la branche courante, reliée à la précédente (son **parent**). L’étiquette de la branche avance sur cette station, et HEAD la suit.',
        'Avec `--amend`, la dernière station est remplacée par une nouvelle (nouveau hash) : l’ancienne n’est plus sur aucune ligne. C’est une réécriture de l’historique.',
        'Pour terminer une fusion en conflit, `git commit` crée un commit à **deux parents** : les deux lignes se rejoignent.',
      ],
      pitfalls: [
        'Écrire des messages vagues (« update », « fix ») : dans six mois personne ne saura ce qui a changé. Voir le guide sur les messages de commit.',
        'Amender un commit déjà poussé et partagé : tes coéquipiers auront un historique différent du tien.',
        'Oublier `git add` : « nothing added to commit » signifie que l’index est vide de changements.',
      ],
    },
    en: {
      summary: 'Records the content of the index as a new point in history.',
      description: [
        'A commit is a full snapshot of your project at a given moment, with a message, an author and a date. It is identified by a hash (e.g. `a1b2c3d`) computed from all that content.',
        'Only what is in the index goes into the commit. The basic cycle is always: edit → `git add` → `git commit`.',
        '`--amend` replaces the last commit with a new one, to fix a message or add a forgotten file.',
      ],
      options: [
        { syntax: 'git commit -m "<message>"', text: 'Creates the commit with this message.' },
        {
          syntax: 'git commit -a -m "<message>"',
          text: 'First stages every tracked file (`--all`), then commits. New files are not included.',
        },
        {
          syntax: 'git commit --amend -m "<message>"',
          text: 'Replaces the last commit (new message and current content of the index).',
        },
        {
          syntax: 'git commit --amend --no-edit',
          text: 'Replaces the last commit and keeps its message.',
        },
        {
          syntax: 'git commit --allow-empty -m "<message>"',
          text: 'Allows a commit without changes.',
        },
      ],
      examples: [
        {
          command: 'git commit -m "feat: add login form"',
          text: 'A message following Conventional Commits.',
        },
        {
          command: 'git commit -am "fix: correct typo in title"',
          text: 'Stages tracked files and commits in one go.',
        },
        {
          command: 'git commit --amend --no-edit',
          text: 'Adds a forgotten file to the last commit (after `git add`).',
        },
      ],
      underTheHood: [
        'A new station appears on the line of the current branch, linked to the previous one (its **parent**). The branch label moves onto that station and HEAD follows it.',
        'With `--amend`, the last station is replaced by a new one (new hash): the old one is no longer on any line. This rewrites history.',
        'To conclude a conflicted merge, `git commit` creates a commit with **two parents**: both lines join.',
      ],
      pitfalls: [
        'Writing vague messages ("update", "fix"): in six months nobody will know what changed. See the guide on commit messages.',
        'Amending a commit you already pushed and shared: your teammates will have a different history.',
        'Forgetting `git add`: "nothing added to commit" means the index holds no changes.',
      ],
    },
  },
};
