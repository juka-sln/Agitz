import type { CommandDoc } from '../model';

export const revertDoc: CommandDoc = {
  kind: 'command',
  id: 'revert',
  title: 'git revert',
  category: 'undo',
  related: ['reset', 'cherry-pick', 'commit'],
  text: {
    fr: {
      summary: 'Annule un commit en ajoutant un nouveau commit qui fait l’inverse.',
      description: [
        '`git revert <commit>` calcule les changements introduits par ce commit et crée un nouveau commit qui les défait : les lignes ajoutées sont retirées, les lignes retirées reviennent.',
        'L’historique n’est pas réécrit : le commit fautif reste visible, suivi de son annulation. C’est donc la seule façon sûre d’annuler un commit déjà partagé avec d’autres.',
      ],
      options: [
        {
          syntax: 'git revert <commit>...',
          text: 'Annule un ou plusieurs commits (un commit inverse chacun).',
        },
        {
          syntax: 'git revert --no-edit <commit>',
          text: 'Garde le message proposé par Git (`Revert "…"`).',
        },
        { syntax: 'git revert --continue', text: 'Reprend après avoir résolu un conflit.' },
        { syntax: 'git revert --abort', text: 'Annule l’opération en cours.' },
      ],
      examples: [
        { command: 'git revert HEAD', text: 'Annule le dernier commit.' },
        {
          command: 'git revert a1b2c3d',
          text: 'Annule un commit plus ancien, sans toucher aux suivants.',
        },
      ],
      underTheHood: [
        'Une nouvelle station s’ajoute au bout de la ligne, avec le message `Revert "…"`. Rien ne disparaît : le graphe ne fait que s’allonger.',
        'Si des commits plus récents ont retouché les mêmes lignes, Git ne peut pas défaire automatiquement : c’est un conflit à résoudre comme pour une fusion.',
      ],
      pitfalls: [
        'Confondre `revert` et `reset` : `reset` déplace la branche en arrière (réécriture), `revert` ajoute un commit (aucune réécriture).',
        'Annuler un commit de fusion demande l’option `-m`, qu’Agitz ne simule pas encore.',
        'Revert d’un revert : c’est possible, et cela réapplique le changement d’origine.',
      ],
    },
    en: {
      summary: 'Undoes a commit by adding a new commit that does the opposite.',
      description: [
        '`git revert <commit>` computes the changes introduced by that commit and creates a new commit that undoes them: added lines are removed, removed lines come back.',
        'History is not rewritten: the faulty commit stays visible, followed by its undoing. That makes it the only safe way to undo a commit already shared with others.',
      ],
      options: [
        {
          syntax: 'git revert <commit>...',
          text: 'Undoes one or more commits (one inverse commit each).',
        },
        {
          syntax: 'git revert --no-edit <commit>',
          text: 'Keeps the message Git suggests (`Revert "…"`).',
        },
        { syntax: 'git revert --continue', text: 'Resumes after resolving a conflict.' },
        { syntax: 'git revert --abort', text: 'Cancels the operation in progress.' },
      ],
      examples: [
        { command: 'git revert HEAD', text: 'Undoes the last commit.' },
        {
          command: 'git revert a1b2c3d',
          text: 'Undoes an older commit without touching the ones after it.',
        },
      ],
      underTheHood: [
        'A new station is added at the end of the line, with the message `Revert "…"`. Nothing disappears: the graph only grows.',
        'If more recent commits touched the same lines, Git cannot undo automatically: it is a conflict, resolved just like for a merge.',
      ],
      pitfalls: [
        'Mixing up `revert` and `reset`: `reset` moves the branch back (rewriting), `revert` adds a commit (no rewriting).',
        'Reverting a merge commit needs the `-m` option, which Agitz does not simulate yet.',
        'Reverting a revert: it is possible, and it applies the original change again.',
      ],
    },
  },
};
