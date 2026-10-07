import type { CommandDoc } from '../model';

export const tagDoc: CommandDoc = {
  kind: 'command',
  id: 'tag',
  title: 'git tag',
  category: 'branches',
  related: ['branch', 'log', 'semver'],
  text: {
    fr: {
      summary: 'Pose un nom fixe sur un commit, typiquement un numéro de version.',
      description: [
        'Un tag ressemble à une branche, à une différence près : **il ne bouge jamais**. On s’en sert pour marquer les versions publiées (`v1.0.0`, `v1.1.0`…), afin de pouvoir y revenir à tout moment.',
        'Un tag **léger** n’est qu’un nom. Un tag **annoté** (`-a`) enregistre en plus un auteur, une date et un message : c’est le format recommandé pour les versions.',
      ],
      options: [
        { syntax: 'git tag', text: 'Liste les tags (`-l`).' },
        {
          syntax: 'git tag <nom> [<commit>]',
          text: 'Crée un tag léger sur HEAD ou sur le commit indiqué.',
        },
        { syntax: 'git tag -a <nom> -m "<message>"', text: 'Crée un tag annoté.' },
        { syntax: 'git tag -d <nom>', text: 'Supprime un tag.' },
        {
          syntax: 'git tag -f <nom> <commit>',
          text: 'Remplace un tag existant (à éviter sur une version publiée).',
        },
      ],
      examples: [
        {
          command: 'git tag -a v1.0.0 -m "First stable release"',
          text: 'Marque la première version stable.',
        },
        { command: 'git tag v0.1.0 a1b2c3d', text: 'Marque après coup un commit plus ancien.' },
        { command: 'git checkout v1.0.0', text: 'Revient sur la version 1.0.0 (en HEAD détaché).' },
      ],
      underTheHood: [
        'Sur le graphe, le tag apparaît comme une étiquette sur la station concernée. Les commits suivants ne l’emportent pas : il reste ancré.',
        'Se placer sur un tag détache HEAD, car un tag ne peut pas avancer avec de nouveaux commits.',
      ],
      pitfalls: [
        'Déplacer ou supprimer un tag déjà publié : d’autres personnes s’y fient pour retrouver une version précise.',
        'Choisir des noms incohérents : adopte le Semantic Versioning (`vMAJEUR.MINEUR.CORRECTIF`).',
      ],
    },
    en: {
      summary: 'Puts a fixed name on a commit, typically a version number.',
      description: [
        'A tag looks like a branch, with one difference: **it never moves**. It marks published versions (`v1.0.0`, `v1.1.0`…) so you can come back to them at any time.',
        'A **lightweight** tag is just a name. An **annotated** tag (`-a`) also records an author, a date and a message: the recommended format for releases.',
      ],
      options: [
        { syntax: 'git tag', text: 'Lists tags (`-l`).' },
        {
          syntax: 'git tag <name> [<commit>]',
          text: 'Creates a lightweight tag on HEAD or on the given commit.',
        },
        { syntax: 'git tag -a <name> -m "<message>"', text: 'Creates an annotated tag.' },
        { syntax: 'git tag -d <name>', text: 'Deletes a tag.' },
        {
          syntax: 'git tag -f <name> <commit>',
          text: 'Replaces an existing tag (avoid it on a published release).',
        },
      ],
      examples: [
        {
          command: 'git tag -a v1.0.0 -m "First stable release"',
          text: 'Marks the first stable release.',
        },
        { command: 'git tag v0.1.0 a1b2c3d', text: 'Marks an older commit afterwards.' },
        {
          command: 'git checkout v1.0.0',
          text: 'Goes back to version 1.0.0 (on a detached HEAD).',
        },
      ],
      underTheHood: [
        'On the graph, the tag shows as a label on its station. Later commits do not carry it along: it stays anchored.',
        'Checking out a tag detaches HEAD, because a tag cannot move forward with new commits.',
      ],
      pitfalls: [
        'Moving or deleting a tag that is already published: other people rely on it to find an exact version.',
        'Picking inconsistent names: adopt Semantic Versioning (`vMAJOR.MINOR.PATCH`).',
      ],
    },
  },
};
