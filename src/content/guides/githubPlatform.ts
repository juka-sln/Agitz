import type { GuideDoc } from '../model';

export const githubPlatformGuide: GuideDoc = {
  kind: 'guide',
  id: 'github-platform',
  related: ['github-collaboration', 'semver', 'commit-messages', 'tag'],
  text: {
    fr: {
      title: 'GitHub au-delà de Git : issues, Actions, releases',
      summary:
        'Ce que GitHub ajoute autour du code : suivre le travail, automatiser les vérifications, publier des versions.',
      sections: [
        {
          heading: 'Issues, labels et milestones',
          blocks: [
            {
              type: 'paragraph',
              text: 'Une **issue** décrit un problème ou une idée **avant** d’écrire du code : c’est là qu’on discute du besoin. Chaque issue et chaque pull request d’un dépôt partagent la même numérotation (`#1`, `#2`…).',
            },
            {
              type: 'list',
              items: [
                'Les **labels** classent les issues : `bug`, `enhancement`, `documentation`, `good first issue` (idéal pour une première contribution)…',
                'Une **milestone** regroupe les issues prévues pour une version (`v1.2.0`) et montre sa progression.',
                'Un rapport de bug utile donne les étapes pour reproduire, le résultat attendu et le résultat obtenu.',
                'Une pull request qui contient `Closes #7` ferme l’issue 7 quand elle est fusionnée.',
              ],
            },
          ],
        },
        {
          heading: 'GitHub Actions : la CI/CD',
          blocks: [
            {
              type: 'paragraph',
              text: 'L’**intégration continue** (CI) vérifie automatiquement chaque push : compilation, tests, lint. Le **déploiement continu** (CD) met en production ce qui a passé ces vérifications. GitHub Actions exécute les **workflows** décrits en YAML dans `.github/workflows/` :',
            },
            {
              type: 'code',
              code: 'name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test',
            },
            {
              type: 'paragraph',
              text: 'Le résultat apparaît en coche verte ou croix rouge à côté du commit et dans la pull request ; une règle de protection peut exiger qu’il soit vert avant la fusion. Dans Agitz, la CI simulée tourne dès qu’un fichier existe dans `.github/workflows/` : elle vérifie les messages de commit (`commitlint`) et l’absence de marqueurs de conflit (`build`).',
            },
          ],
        },
        {
          heading: 'Releases et tags sémantiques',
          blocks: [
            {
              type: 'paragraph',
              text: 'Une **release** GitHub est une page attachée à un **tag** (`v1.2.0`) : des notes de version, et éventuellement des fichiers à télécharger. On crée le tag en local, on le pousse, puis on rédige la release :',
            },
            {
              type: 'code',
              code: 'git tag -a v1.2.0 -m "Release 1.2.0"\ngit push origin v1.2.0',
            },
            {
              type: 'paragraph',
              text: 'Le numéro suit le **Semantic Versioning** ; des messages Conventional Commits permettent même de générer les notes de version automatiquement.',
            },
          ],
        },
        {
          heading: 'README, LICENSE, CONTRIBUTING',
          blocks: [
            {
              type: 'list',
              items: [
                '`README.md` : la vitrine du projet, affichée sur sa page d’accueil. Ce qu’il fait, comment l’installer, comment l’utiliser.',
                '`LICENSE` : ce que les autres ont le droit de faire du code. Sans licence, personne n’a légalement le droit de le réutiliser.',
                '`CONTRIBUTING.md` : comment contribuer (conventions de branches et de commits, lancement des tests). GitHub le propose à quiconque ouvre une issue ou une pull request.',
                'D’autres fichiers aident l’équipe : `CODE_OF_CONDUCT.md`, des modèles d’issue et de pull request dans `.github/`.',
              ],
            },
          ],
        },
        {
          heading: 'GitHub CLI (gh)',
          blocks: [
            {
              type: 'paragraph',
              text: '`gh` fait depuis le terminal ce que tu fais sur le site : forker, ouvrir et fusionner des pull requests, suivre la CI. Agitz ne le simule pas, mais voici à quoi il ressemble :',
            },
            {
              type: 'code',
              code: 'gh repo fork alice/project --clone\ngh pr create --title "feat: add login form" --body "Closes #3"\ngh pr checks\ngh pr merge --squash --delete-branch\ngh issue list --label bug',
            },
          ],
        },
      ],
    },
    en: {
      title: 'GitHub beyond Git: issues, Actions, releases',
      summary:
        'What GitHub adds around the code: tracking the work, automating checks, publishing versions.',
      sections: [
        {
          heading: 'Issues, labels and milestones',
          blocks: [
            {
              type: 'paragraph',
              text: 'An **issue** describes a problem or an idea **before** any code is written: it is where the need gets discussed. The issues and pull requests of a repository share one sequence of numbers (`#1`, `#2`…).',
            },
            {
              type: 'list',
              items: [
                '**Labels** sort issues: `bug`, `enhancement`, `documentation`, `good first issue` (ideal for a first contribution)…',
                'A **milestone** groups the issues planned for a version (`v1.2.0`) and shows its progress.',
                'A useful bug report gives the steps to reproduce, the expected result and the actual result.',
                'A pull request containing `Closes #7` closes issue 7 when it is merged.',
              ],
            },
          ],
        },
        {
          heading: 'GitHub Actions: CI/CD',
          blocks: [
            {
              type: 'paragraph',
              text: '**Continuous integration** (CI) automatically checks every push: build, tests, lint. **Continuous deployment** (CD) ships what passed these checks. GitHub Actions runs the **workflows** described in YAML in `.github/workflows/`:',
            },
            {
              type: 'code',
              code: 'name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test',
            },
            {
              type: 'paragraph',
              text: 'The result shows as a green tick or a red cross next to the commit and in the pull request; a protection rule can require it to be green before merging. In Agitz, the simulated CI runs as soon as a file exists in `.github/workflows/`: it checks commit messages (`commitlint`) and that no conflict markers are left (`build`).',
            },
          ],
        },
        {
          heading: 'Releases and semantic tags',
          blocks: [
            {
              type: 'paragraph',
              text: 'A GitHub **release** is a page attached to a **tag** (`v1.2.0`): release notes, and possibly files to download. Create the tag locally, push it, then write the release:',
            },
            {
              type: 'code',
              code: 'git tag -a v1.2.0 -m "Release 1.2.0"\ngit push origin v1.2.0',
            },
            {
              type: 'paragraph',
              text: 'The number follows **Semantic Versioning**; Conventional Commits messages even make it possible to generate release notes automatically.',
            },
          ],
        },
        {
          heading: 'README, LICENSE, CONTRIBUTING',
          blocks: [
            {
              type: 'list',
              items: [
                '`README.md`: the project’s showcase, displayed on its home page. What it does, how to install it, how to use it.',
                '`LICENSE`: what others may do with the code. Without a license, nobody is legally allowed to reuse it.',
                '`CONTRIBUTING.md`: how to contribute (branch and commit conventions, running the tests). GitHub points to it whenever someone opens an issue or a pull request.',
                'Other files help the team: `CODE_OF_CONDUCT.md`, issue and pull request templates in `.github/`.',
              ],
            },
          ],
        },
        {
          heading: 'GitHub CLI (gh)',
          blocks: [
            {
              type: 'paragraph',
              text: '`gh` does from the terminal what you do on the website: fork, open and merge pull requests, follow CI. Agitz does not simulate it, but here is what it looks like:',
            },
            {
              type: 'code',
              code: 'gh repo fork alice/project --clone\ngh pr create --title "feat: add login form" --body "Closes #3"\ngh pr checks\ngh pr merge --squash --delete-branch\ngh issue list --label bug',
            },
          ],
        },
      ],
    },
  },
};
