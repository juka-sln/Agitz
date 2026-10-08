import type { CommandDoc } from '../model';

export const statusDoc: CommandDoc = {
  kind: 'command',
  id: 'status',
  title: 'git status',
  category: 'basics',
  related: ['add', 'commit', 'checkout'],
  text: {
    fr: {
      summary: 'Montre où en sont tes fichiers : modifiés, prêts à être commités ou inconnus.',
      description: [
        '`git status` compare trois états : le dernier commit, l’index et tes fichiers sur le disque. Il ne modifie rien, tu peux le lancer aussi souvent que tu veux, et c’est une excellente habitude avant chaque commande.',
        'Il indique aussi la branche courante et les opérations en cours (fusion, rebase…) avec les commandes pour les terminer ou les annuler.',
      ],
      options: [
        { syntax: 'git status', text: 'Affichage complet, avec des conseils.' },
        {
          syntax: 'git status -s',
          text: 'Affichage court (`--short`) : deux colonnes, index à gauche et disque à droite.',
        },
      ],
      examples: [
        { command: 'git status', text: 'Fais le point avant de commiter.' },
        {
          command: 'git status -s',
          text: '`A` = ajouté, `M` = modifié, `??` = non suivi, `UU` = conflit.',
        },
      ],
      underTheHood: [
        '**Changes to be committed** (en vert) : la différence entre le dernier commit et l’index. C’est exactement ce que contiendra le prochain commit.',
        '**Changes not staged** (en rouge) : la différence entre l’index et le disque. **Untracked files** : les fichiers que Git n’a jamais vus. Les mêmes informations s’affichent dans l’explorateur de fichiers à gauche.',
      ],
      pitfalls: [
        'Un même fichier peut apparaître en vert ET en rouge : une version est dans l’index, et tu l’as modifié depuis.',
        'Un fichier ignoré par `.gitignore` n’apparaît pas du tout : c’est voulu.',
      ],
    },
    en: {
      summary: 'Shows where your files stand: modified, ready to commit or unknown.',
      description: [
        '`git status` compares three states: the last commit, the index and your files on disk. It changes nothing, so run it as often as you like; it is a great habit before every command.',
        'It also shows the current branch and any operation in progress (merge, rebase…) with the commands to finish or abort it.',
      ],
      options: [
        { syntax: 'git status', text: 'Full output, with hints.' },
        {
          syntax: 'git status -s',
          text: 'Short output (`--short`): two columns, index on the left and disk on the right.',
        },
      ],
      examples: [
        { command: 'git status', text: 'Take stock before committing.' },
        {
          command: 'git status -s',
          text: '`A` = added, `M` = modified, `??` = untracked, `UU` = conflict.',
        },
      ],
      underTheHood: [
        '**Changes to be committed** (green): the difference between the last commit and the index. That is exactly what the next commit will hold.',
        '**Changes not staged** (red): the difference between the index and the disk. **Untracked files**: files Git has never seen. The same information shows in the file explorer on the left.',
      ],
      pitfalls: [
        'The same file can be both green AND red: one version is in the index and you edited it since.',
        'A file ignored by `.gitignore` does not show at all: that is on purpose.',
      ],
    },
  },
};
