import type { GuideDoc } from '../model';

export const commitMessagesGuide: GuideDoc = {
  kind: 'guide',
  id: 'commit-messages',
  related: ['commit', 'semver', 'code-review'],
  text: {
    fr: {
      title: 'Écrire de bons messages de commit',
      summary:
        'La convention Conventional Commits : des messages courts, en anglais, qui disent ce que fait le commit et pourquoi.',
      sections: [
        {
          heading: 'Le format',
          blocks: [
            {
              type: 'code',
              code: '<type>(<scope optionnel>): <sujet>\n\n<corps optionnel>\n\n<pied optionnel>',
            },
            {
              type: 'paragraph',
              text: 'Le **sujet** tient en une ligne de **50 caractères maximum**, sans point final. Le **corps**, séparé par une ligne vide, explique le **pourquoi** du changement (le « quoi » se lit déjà dans le diff).',
            },
          ],
        },
        {
          heading: 'Les types',
          blocks: [
            {
              type: 'list',
              items: [
                '`feat` : une nouvelle fonctionnalité pour l’utilisateur.',
                '`fix` : la correction d’un bug.',
                '`docs` : uniquement de la documentation.',
                '`refactor` : une restructuration du code sans changement de comportement.',
                '`test` : l’ajout ou la correction de tests.',
                '`perf` : une amélioration des performances.',
                '`style` : la mise en forme (espaces, indentation), sans effet sur le code.',
                '`chore` : l’outillage, les dépendances, la configuration.',
              ],
            },
          ],
        },
        {
          heading: 'Les règles d’or',
          blocks: [
            {
              type: 'list',
              items: [
                'Toujours **en anglais** : c’est la langue commune des équipes et des projets open source.',
                'À l’**impératif présent** : `add`, `fix`, `remove`, et non `added` ou `fixes`. Le message complète la phrase « If applied, this commit will… ».',
                'Un commit = **une seule** intention. Si le message contient « and », c’est souvent qu’il faut deux commits.',
                'Pas de messages vagues comme `update`, `wip` ou `fix stuff`.',
                'Un changement qui casse la compatibilité se signale par `!` (`feat!: …`) ou par `BREAKING CHANGE:` dans le pied.',
              ],
            },
          ],
        },
        {
          heading: 'Exemples',
          blocks: [
            {
              type: 'code',
              code: 'feat: add password reset form\nfix(auth): reject expired tokens\ndocs: explain local setup in README\nrefactor: extract price calculation\nperf: cache repository graph layout\nchore: upgrade vite to version 8',
            },
            {
              type: 'paragraph',
              text: 'À éviter : `Fixed bug`, `modifs`, `feat: Added the new login page and fixed header.`',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Writing good commit messages',
      summary:
        'The Conventional Commits convention: short messages, in English, that say what the commit does and why.',
      sections: [
        {
          heading: 'The format',
          blocks: [
            {
              type: 'code',
              code: '<type>(<optional scope>): <subject>\n\n<optional body>\n\n<optional footer>',
            },
            {
              type: 'paragraph',
              text: 'The **subject** fits on one line of **50 characters at most**, with no trailing period. The **body**, after a blank line, explains **why** the change was made (the "what" is already in the diff).',
            },
          ],
        },
        {
          heading: 'The types',
          blocks: [
            {
              type: 'list',
              items: [
                '`feat`: a new feature for the user.',
                '`fix`: a bug fix.',
                '`docs`: documentation only.',
                '`refactor`: restructured code with no change in behavior.',
                '`test`: added or fixed tests.',
                '`perf`: a performance improvement.',
                '`style`: formatting (whitespace, indentation) with no effect on the code.',
                '`chore`: tooling, dependencies, configuration.',
              ],
            },
          ],
        },
        {
          heading: 'Golden rules',
          blocks: [
            {
              type: 'list',
              items: [
                'Always **in English**: it is the common language of teams and open source projects.',
                'In the **imperative mood**: `add`, `fix`, `remove`, not `added` or `fixes`. The message completes the sentence "If applied, this commit will…".',
                'One commit = **one** intent. If the message needs an "and", you probably need two commits.',
                'No vague messages such as `update`, `wip` or `fix stuff`.',
                'A breaking change is flagged with `!` (`feat!: …`) or with `BREAKING CHANGE:` in the footer.',
              ],
            },
          ],
        },
        {
          heading: 'Examples',
          blocks: [
            {
              type: 'code',
              code: 'feat: add password reset form\nfix(auth): reject expired tokens\ndocs: explain local setup in README\nrefactor: extract price calculation\nperf: cache repository graph layout\nchore: upgrade vite to version 8',
            },
            {
              type: 'paragraph',
              text: 'Avoid: `Fixed bug`, `changes`, `feat: Added the new login page and fixed header.`',
            },
          ],
        },
      ],
    },
  },
};
