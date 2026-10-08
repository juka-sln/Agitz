import type { GuideDoc } from '../model';

export const codeReviewGuide: GuideDoc = {
  kind: 'guide',
  id: 'code-review',
  related: ['commit-messages', 'branching-strategy', 'merge-vs-rebase', 'github-collaboration'],
  text: {
    fr: {
      title: 'Étiquette de la revue de code',
      summary:
        'Relire le code des autres (et faire relire le sien) avec bienveillance et efficacité.',
      sections: [
        {
          heading: 'Quand tu proposes du code',
          blocks: [
            {
              type: 'list',
              items: [
                'Des pull requests **petites et ciblées** : une fonctionnalité ou un correctif à la fois. Au-delà de quelques centaines de lignes, la relecture devient superficielle.',
                'Une description qui explique le **pourquoi**, comment tester, et ce qui mérite une attention particulière.',
                'Relis-toi d’abord : supprime le code de debug, vérifie que les tests passent.',
                'Des commits propres et bien nommés, qui racontent l’histoire du changement.',
              ],
            },
          ],
        },
        {
          heading: 'Quand tu relis',
          blocks: [
            {
              type: 'list',
              items: [
                'Commente le **code**, jamais la personne : « cette fonction pourrait… » plutôt que « tu as oublié… ».',
                'Pose des questions plutôt que d’affirmer : « Que se passe-t-il si la liste est vide ? ».',
                'Distingue l’essentiel du détail : préfixe les remarques mineures par `nit:` (pinaillage).',
                'Explique tes demandes et propose une solution quand c’est possible.',
                'Souligne aussi ce qui est réussi.',
                'Réponds vite : une revue qui traîne bloque toute l’équipe.',
              ],
            },
          ],
        },
        {
          heading: 'Recevoir des remarques',
          blocks: [
            {
              type: 'list',
              items: [
                'Une remarque porte sur le code, pas sur toi : c’est une occasion d’apprendre.',
                'Réponds à chaque commentaire, même par « corrigé » ; si tu n’es pas d’accord, argumente calmement.',
                'Quand une discussion s’éternise par écrit, passe à l’oral.',
              ],
            },
          ],
        },
      ],
    },
    en: {
      title: 'Code review etiquette',
      summary: 'Reviewing other people’s code (and having yours reviewed) kindly and efficiently.',
      sections: [
        {
          heading: 'When you propose code',
          blocks: [
            {
              type: 'list',
              items: [
                '**Small, focused** pull requests: one feature or fix at a time. Beyond a few hundred lines, reviews become shallow.',
                'A description that explains **why**, how to test, and what deserves extra attention.',
                'Review yourself first: remove debug code, make sure the tests pass.',
                'Clean, well-named commits that tell the story of the change.',
              ],
            },
          ],
        },
        {
          heading: 'When you review',
          blocks: [
            {
              type: 'list',
              items: [
                'Comment on the **code**, never the person: "this function could…" rather than "you forgot…".',
                'Ask rather than assert: "What happens if the list is empty?".',
                'Separate what matters from details: prefix minor remarks with `nit:`.',
                'Explain your requests and suggest a solution when you can.',
                'Point out what is done well, too.',
                'Answer quickly: a review that drags blocks the whole team.',
              ],
            },
          ],
        },
        {
          heading: 'Receiving feedback',
          blocks: [
            {
              type: 'list',
              items: [
                'A remark is about the code, not about you: it is a chance to learn.',
                'Reply to every comment, even with "done"; if you disagree, argue calmly.',
                'When a written discussion goes on forever, talk it through instead.',
              ],
            },
          ],
        },
      ],
    },
  },
};
