import type { fr } from './fr';
import { plural, type ExplanationText } from './types';

export const en: Record<keyof typeof fr, ExplanationText> = {
  'init.created':
    'A hidden `.git` folder was just created: that folder is the repository and will hold the whole history. You are on the branch `{branch}`, empty until the first commit.',
  'init.reinitialized':
    'This folder already was a Git repository. Running `git init` again is safe: nothing was erased.',

  'add.staged': ({ count, paths }) =>
    `${plural(count, 'The file', 'The files')} ${String(paths)} ${plural(count, 'is', 'are')} now in the index (the staging area) and will be part of the next commit.`,
  'add.nothingChanged': 'Nothing new: the index already holds these files as they are on disk.',
  'add.nothingSpecified':
    'Tell Git which files to add, for example `git add README.md`, or `git add .` for the whole folder.',
  'add.resolvedConflicts': ({ count }) =>
    `${String(count)} ${plural(count, 'conflict is', 'conflicts are')} marked as resolved. Once they all are, finish the operation (\`git commit\` or \`--continue\`).`,

  'status.clean':
    'Everything is clean: the disk, the index and the last commit hold exactly the same content.',
  'status.changes': ({ staged, unstaged, untracked }) =>
    `In short: ${String(staged)} ready to be committed (green), ${String(unstaged)} modified but not added yet, and ${String(untracked)} unknown to Git (red). \`git add\` turns a file from red to green.`,

  'commit.createdRoot':
    'First commit! `{hash}` is the root of the history: it has no parent. The branch `{branch}` now exists and points to it.',
  'commit.created':
    'New commit `{hash}`: a snapshot of the index was recorded. The branch `{branch}` moves forward to point to it.',
  'commit.createdDetached':
    'Commit `{hash}` was created on a detached HEAD: no branch follows it. Create one (`git switch -c <name>` or `git checkout -b <name>`) before leaving, or it will be hard to find again.',
  'commit.createdMerge':
    'Merge commit `{hash}`: it has two parents and joins both histories on `{branch}`. The merge is complete.',
  'commit.amended':
    'The last commit was replaced: `{previous}` becomes `{hash}`. It is a brand-new commit and the old one is no longer on the branch. Never do this on a commit you already shared.',
  'commit.nothingToCommit':
    'Nothing to record: the index matches the last commit. Stage some changes with `git add` first.',

  'log.shown': ({ count }) =>
    `${String(count)} ${plural(count, 'commit', 'commits')} shown, newest first, walking up the parents from HEAD.`,

  'branch.listed': 'These are the local branches. The asterisk marks the one you are on.',
  'branch.created':
    'The branch `{name}` was created on `{commit}`. It is just a label: no file is copied and you stay on your current branch.',
  'branch.reset':
    'The branch `{name}` was forced onto `{commit}`. Commits that only it pointed to may become unreachable.',
  'branch.deleted': ({ names, count }) =>
    `${plural(count, 'The branch', 'The branches')} ${String(names)} ${plural(count, 'was', 'were')} deleted. Only the label is gone: the commits remain as long as another reference leads to them.`,
  'branch.renamed': 'The branch `{from}` is now called `{to}`. Its commits did not move.',

  'checkout.switchedBranch': ({ branch, leftBehind }) =>
    `You are now on \`${String(branch)}\`: HEAD points to this branch and the files in the folder were replaced by those of its last commit.${Number(leftBehind) > 0 ? ` Careful: ${String(leftBehind)} commit(s) made on the detached HEAD are no longer on any branch.` : ''}`,
  'checkout.alreadyOn': 'You already are on `{branch}`: nothing changes.',
  'checkout.createdBranch':
    'A shortcut for `git branch` + `git checkout`: the branch `{branch}` was created and you are already on it. Your next commits will move it forward.',
  'checkout.detached': ({ commit, leftBehind }) =>
    `HEAD is detached at \`${String(commit)}\`: you are looking at this commit without being on a branch. Explore freely; to keep work done here, create a branch.${Number(leftBehind) > 0 ? ` ${String(leftBehind)} commit(s) left behind are no longer on any branch.` : ''}`,
  'checkout.nothingToDo':
    'Without arguments, `git checkout` does nothing. Give it a branch, a commit or files.',
  'checkout.restoredPaths': ({ count, source }) =>
    `${String(count)} ${plural(count, 'file', 'files')} restored from ${source === 'index' ? 'the index' : `\`${String(source)}\``}. Uncommitted changes to these files are lost.`,

  'merge.upToDate': '`{target}` is already part of your branch: there is nothing to merge.',
  'merge.fastForward':
    'Fast-forward merge: your branch had nothing new, so its label simply slid from `{from}` to `{to}`. No merge commit is needed.',
  'merge.merged':
    'Both branches had diverged: Git combined their changes since the common ancestor and created the merge commit `{commit}`, which has two parents.',
  'merge.conflicts': ({ target, count }) =>
    `Merging \`${String(target)}\` stopped on ${String(count)} ${plural(count, 'conflict', 'conflicts')}: both sides changed the same lines. Open the files, keep the right content between the <<<<<<< and >>>>>>> markers, then \`git add\` and \`git commit\`. \`git merge --abort\` cancels everything.`,
  'merge.aborted': 'Merge aborted: everything is back to how it was before `git merge`.',

  'rebase.upToDate':
    'Your branch already starts from the latest commit of `{upstream}`: there is nothing to replay.',
  'rebase.done': ({ count }) =>
    `Rebase complete: ${String(count)} ${plural(count, 'commit was', 'commits were')} replayed on top of the new base. They are new commits (new hashes); the old ones are no longer on the branch.`,
  'rebase.conflicts':
    'The rebase stopped while replaying `{commit}`: conflict. Fix the files, `git add`, then `git rebase --continue`. `git rebase --abort` puts everything back.',
  'rebase.aborted': 'Rebase aborted: your branch is exactly as it was before.',

  'cherry-pick.done': ({ count }) =>
    `${plural(count, 'The commit was', `${String(count)} commits were`)} copied onto your branch. ${plural(count, 'The copy has', 'The copies have')} the same content but a new hash: the original stays where it was.`,
  'cherry-pick.conflicts':
    'Copying `{commit}` causes a conflict. Fix the files, `git add`, then `git cherry-pick --continue` (or `--abort` to cancel).',
  'cherry-pick.aborted': 'Cherry-pick aborted: your branch is back to how it was.',

  'revert.done': ({ count }) =>
    `${plural(count, 'An inverse commit was', `${String(count)} inverse commits were`)} added: they undo the targeted changes without rewriting history. This is the safe way to undo a commit you already shared.`,
  'revert.conflicts':
    'Undoing `{commit}` conflicts with more recent changes. Fix the files, `git add`, then `git revert --continue` (or `--abort`).',
  'revert.aborted': 'Revert aborted: your branch is back to how it was.',

  'reset.soft':
    'Soft reset: the branch moves back to `{commit}`, but the index and your files are untouched. The changes of the removed commits are waiting, ready to be committed again.',
  'reset.mixed':
    'Mixed reset: the branch moves back to `{commit}` and those changes leave the index. Your files on disk did not move.',
  'reset.hard':
    'Hard reset: the branch, the index AND your files go back to `{commit}`. Uncommitted changes are lost for good.',
  'reset.paths': ({ count }) =>
    `${String(count)} ${plural(count, 'path', 'paths')} removed from the index: the opposite of \`git add\`. Your files on disk do not change.`,

  'stash.saved':
    'Your changes were put aside on the stash and your folder is back to the last commit. `git stash pop` brings them back.',
  'stash.nothingToSave': 'There are no changes to put aside.',
  'stash.listed': ({ count }) =>
    `${String(count)} ${plural(count, 'entry', 'entries')} in the stash. \`stash@{0}\` is the most recent.`,
  'stash.applied':
    '`{reference}` was applied back onto your files. The entry stays on the stack (`git stash drop` removes it).',
  'stash.popped': '`{reference}` was applied back, then removed from the stack.',
  'stash.conflicts':
    'Applying `{reference}` causes conflicts. Resolve them; the entry is kept on the stack so nothing is lost.',
  'stash.dropped': '`{reference}` was removed from the stack. Those changes are lost.',

  'tag.listed': ({ count }) =>
    `${String(count)} ${plural(count, 'tag', 'tags')} in this repository.`,
  'tag.created':
    'Lightweight tag `{name}` placed on `{commit}`. Unlike a branch, it will never move: perfect to mark a version.',
  'tag.createdAnnotated':
    'Annotated tag `{name}` placed on `{commit}`, with an author, a date and a message. This is the recommended format for published releases.',
  'tag.deleted': 'Tag(s) {names} deleted. The commits do not move.',

  'shell.help': 'These are the commands of the simulated terminal. Git commands start with `git`.',
  'shell.gitUsage': 'The Git commands available in Agitz.',
  'shell.version': 'The Git version Agitz simulates.',
  'shell.printed': '',
  'shell.listed': '',
  'shell.empty': '',
  'shell.fileWritten':
    'The file `{path}` was written. If Git already tracks it, `git status` shows it as modified.',
  'shell.fileAppended': 'A line was added at the end of `{path}`.',
  'shell.fileCreated': 'File(s) created: {path}. To Git, a new file is "untracked".',
  'shell.fileRemoved':
    'Removed from disk: {path}. If Git tracked it, `git status` shows a deletion to stage with `git add`.',
  'shell.implicitDirectories':
    'Git only tracks files: an empty folder does not exist for it. Create a file inside the folder directly.',
  'shell.error': 'The `{command}` command failed: read the message right above.',
  'shell.syntaxError': 'The line could not be parsed: check the quotes and redirections (`>`).',
  'shell.redirectUnsupported':
    'In Agitz, only `echo` accepts a redirection: `echo "text" > file.txt`.',
  'shell.commandNotFound':
    '`{command}` does not exist in this terminal. Type `help` to list the available commands.',
  'shell.unknownGitCommand': ({ command, suggestions }) =>
    `\`git ${String(command)}\` is not a Git command.${suggestions === '' ? '' : ` Did you mean: ${String(suggestions)}?`}`,
  'shell.notImplemented':
    '`git {command}` is a real Git command, but Agitz does not simulate it yet. It will come in a future version.',

  'error.notAGitRepository': 'This folder is not a Git repository (yet). Start with `git init`.',
  'error.noCommitsYet': 'The branch `{branch}` has no commits yet: make a first commit.',
  'error.noInitialCommit': 'You need at least one commit before using the stash.',
  'error.unknownRevision':
    'Git finds no commit or file named `{revision}`. Check the branch name or the hash.',
  'error.ambiguousRevision':
    'The short hash `{revision}` matches several commits: type a few more characters.',
  'error.badRevision': '`{revision}` does not point to any known commit.',
  'error.invalidObjectName': '`{name}` does not point to any known commit.',
  'error.invalidReference': '`{reference}` is neither an existing branch nor a commit.',
  'error.invalidUpstream': '`{upstream}` is neither a branch nor a commit to rebase onto.',
  'error.invalidBranchName':
    '`{name}` is not a valid branch name: no spaces, `..`, `~`, `^`, `:` or trailing `/`.',
  'error.invalidInitialBranchName': '`{name}` cannot be used as the initial branch name.',
  'error.branchAlreadyExists':
    'The branch `{name}` already exists. Pick another name, or switch to it with `git checkout {name}`.',
  'error.branchNotFound': 'No branch is called `{name}`. `git branch` lists them.',
  'error.noBranchNamed': 'No branch is called `{name}`.',
  'error.invalidStartPoint':
    '`{startPoint}` does not point to a commit: `{branch}` cannot be created from it.',
  'error.cannotDeleteCurrentBranch':
    'You cannot delete `{name}` while you are on it. Switch to another branch first.',
  'error.cannotForceUpdateCurrentBranch':
    'You cannot force `{name}` to move while you are on it. Use `git reset` instead.',
  'error.branchNotFullyMerged':
    '`{name}` holds commits that are not merged anywhere: deleting it would lose them. Merge it first, or force with `git branch -D {name}` if you are sure.',
  'error.detachedHeadRename':
    'With a detached HEAD there is no current branch to rename. Give both the old and the new name.',
  'error.emptyCommitMessage':
    'A commit always needs a message: `git commit -m "feat: add login form"`.',
  'error.nothingToAmend': 'There is no commit to amend yet.',
  'error.amendDuringMerge':
    'A merge is in progress: finish it with `git commit` before amending a commit.',
  'error.unmergedFiles':
    'Some files are still in conflict. Fix them, mark them as resolved with `git add`, then try again.',
  'error.unresolvedIndex': ({ count }) =>
    `${String(count)} ${plural(count, 'file is', 'files are')} still in conflict. Resolve ${plural(count, 'it', 'them')} and run \`git add\` before going on.`,
  'error.operationInProgress': ({ operation }) =>
    `A ${String(operation)} is already in progress. Finish it with \`--continue\` (or \`git commit\` for a merge), or cancel it with \`--abort\`, before starting something else.`,
  'error.noOperationInProgress': ({ operation, action }) =>
    `No ${String(operation)} is in progress: there is nothing to \`--${String(action)}\`.`,
  'error.notMergeable': '`{target}` is neither a branch nor a commit: it cannot be merged.',
  'error.notPossibleToFastForward':
    'With `--ff-only`, Git refuses to create a merge commit: the branches have diverged.',
  'error.unrelatedHistories':
    'These two histories share no common ancestor: Git refuses to merge them to be safe.',
  'error.mergeCommitWithoutMainline':
    '`{commit}` is a merge commit: it has two parents and Git does not know which one to replay it against. Agitz does not support the `-m` option yet.',
  'error.dirtyWorkingTree':
    '`git {operation}` cannot start with uncommitted changes. Commit them or put them aside with `git stash`.',
  'error.localChangesWouldBeOverwritten': ({ count }) =>
    `Git refuses to protect your work: ${String(count)} modified ${plural(count, 'file', 'files')} would be overwritten. Commit or \`git stash\` first.`,
  'error.untrackedFilesWouldBeOverwritten': ({ count }) =>
    `${String(count)} untracked ${plural(count, 'file', 'files')} would be overwritten by this operation. Move or add ${plural(count, 'it', 'them')} first.`,
  'error.invalidPath': '`{path}` is outside the repository.',
  'error.pathspecNotMatched': 'No file matches `{pathspec}`. Check the name with `ls`.',
  'error.pathspecNotKnown': 'Git knows no file named `{pathspec}`.',
  'error.resetWithPaths':
    '`git reset --{mode}` moves the whole branch: it does not apply to individual files.',
  'error.noStashEntries': 'The stash is empty: nothing to apply or drop.',
  'error.invalidStashReference': '`{reference}` is not in the stash. `git stash list` lists them.',
  'error.invalidTagName': '`{name}` is not a valid tag name.',
  'error.tagAlreadyExists':
    'The tag `{name}` already exists. A tag never moves: delete it first with `git tag -d {name}`.',
  'error.tagNotFound': 'No tag is called `{name}`.',
  'error.emptyTagMessage':
    'An annotated tag needs a message: `git tag -a v1.0.0 -m "First release"`.',
  'error.usage': 'The command is malformed: the expected syntax is printed right above.',
  'error.commandLine': 'The options are not valid: read the message above.',
  'error.notSupported': 'This option exists in Git, but Agitz does not simulate it yet: {feature}.',
};
