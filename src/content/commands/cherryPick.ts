import type { CommandDoc } from '../model';

export const cherryPickDoc: CommandDoc = {
  kind: 'command',
  id: 'cherry-pick',
  title: 'git cherry-pick',
  category: 'branches',
  related: ['rebase', 'revert', 'log'],
  text: {
    fr: {
      summary: 'Copie un ou plusieurs commits précis sur la branche courante.',
      description: [
        '`git cherry-pick <commit>` reprend les changements introduits par ce commit et les applique sur ta branche, sous la forme d’un nouveau commit. Pratique pour récupérer un correctif fait sur une autre branche sans tout fusionner.',
        'Le commit d’origine reste à sa place : tu obtiens une copie avec le même message et le même contenu, mais un hash différent.',
      ],
      options: [
        {
          syntax: 'git cherry-pick <commit>...',
          text: 'Copie un ou plusieurs commits, dans l’ordre donné.',
        },
        { syntax: 'git cherry-pick --continue', text: 'Reprend après avoir résolu un conflit.' },
        {
          syntax: 'git cherry-pick --skip',
          text: 'Ignore le commit en conflit et passe au suivant.',
        },
        {
          syntax: 'git cherry-pick --abort',
          text: 'Annule l’opération et revient à l’état de départ.',
        },
      ],
      examples: [
        { command: 'git log --oneline --all', text: 'Repère d’abord le hash du commit à copier.' },
        { command: 'git cherry-pick a1b2c3d', text: 'Copie ce commit sur ta branche.' },
        {
          command: 'git cherry-pick hotfix',
          text: 'Copie le dernier commit de la branche `hotfix`.',
        },
      ],
      underTheHood: [
        'Une nouvelle station apparaît au bout de ta ligne, avec le même message que l’originale. Aucun lien n’est tracé entre les deux : pour Git, ce sont deux commits indépendants.',
        'Git calcule la différence entre le commit choisi et son parent, puis l’applique à ton code actuel. Si ton code a trop changé à ces endroits, c’est un conflit.',
      ],
      pitfalls: [
        'Cherry-picker puis fusionner la même branche : le changement existera deux fois dans l’historique, sous deux hash différents.',
        'Un commit de fusion ne peut pas être copié simplement (il a deux parents).',
        'S’en servir comme stratégie habituelle : préfère `merge` ou `rebase`, et garde `cherry-pick` pour les cas ponctuels.',
      ],
    },
    en: {
      summary: 'Copies one or more specific commits onto the current branch.',
      description: [
        '`git cherry-pick <commit>` takes the changes introduced by that commit and applies them to your branch as a new commit. Handy to grab a fix made on another branch without merging everything.',
        'The original commit stays where it is: you get a copy with the same message and content, but a different hash.',
      ],
      options: [
        {
          syntax: 'git cherry-pick <commit>...',
          text: 'Copies one or more commits, in the given order.',
        },
        { syntax: 'git cherry-pick --continue', text: 'Resumes after resolving a conflict.' },
        {
          syntax: 'git cherry-pick --skip',
          text: 'Skips the conflicting commit and moves on to the next.',
        },
        {
          syntax: 'git cherry-pick --abort',
          text: 'Cancels the operation and goes back to the start.',
        },
      ],
      examples: [
        { command: 'git log --oneline --all', text: 'First find the hash of the commit to copy.' },
        { command: 'git cherry-pick a1b2c3d', text: 'Copies that commit onto your branch.' },
        {
          command: 'git cherry-pick hotfix',
          text: 'Copies the last commit of the `hotfix` branch.',
        },
      ],
      underTheHood: [
        'A new station appears at the end of your line, with the same message as the original. No link is drawn between them: to Git they are two unrelated commits.',
        'Git computes the difference between the chosen commit and its parent, then applies it to your current code. If your code changed too much in those places, it is a conflict.',
      ],
      pitfalls: [
        'Cherry-picking and then merging the same branch: the change will exist twice in history, under two different hashes.',
        'A merge commit cannot simply be copied (it has two parents).',
        'Using it as your usual strategy: prefer `merge` or `rebase`, and keep `cherry-pick` for one-off cases.',
      ],
    },
  },
};
