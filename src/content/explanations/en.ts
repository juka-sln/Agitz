import type { fr } from './fr';
import { plural, type ExplanationText } from './types';

/** Added when `git push -u` just set the upstream of the pushed branch. */
const upstreamNote = (upstream: string | number | undefined) =>
  upstream === '' || upstream === undefined
    ? ''
    : ` Your branch now tracks \`${String(upstream)}\`: next time, plain \`git push\` and \`git pull\` are enough.`;

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

  'branch.listedRemote':
    'The `origin/…` branches are remote-tracking branches: where the branches of the remote repository were at the last contact (`fetch`, `pull` or `push`). They never move when you commit.',
  'branch.createdTracking':
    'The branch `{name}` was created on `{commit}` and tracks `{upstream}`: `git status` will tell whether you are ahead or behind, and `git pull` / `git push` know where to go without arguments.',
  'branch.upstreamSet':
    '`{name}` now tracks `{upstream}`. That is its upstream branch: the reference for `git status`, `git pull` and `git push`.',
  'branch.upstreamUnset':
    '`{name}` no longer tracks any remote branch. `git pull` and `git push` will now ask where to go.',

  'checkout.switchedBranch': ({ branch, leftBehind }) =>
    `You are now on \`${String(branch)}\`: HEAD points to this branch and the files in the folder were replaced by those of its last commit.${Number(leftBehind) > 0 ? ` Careful: ${String(leftBehind)} commit(s) made on the detached HEAD are no longer on any branch.` : ''}`,
  'checkout.alreadyOn': 'You already are on `{branch}`: nothing changes.',
  'checkout.createdBranch':
    'A shortcut for `git branch` + `git checkout`: the branch `{branch}` was created and you are already on it. Your next commits will move it forward.',
  'checkout.createdTrackingBranch':
    'There was no local branch `{branch}`, but `{upstream}` exists: Git created a local copy that tracks it, and you are on it. Work on it, then `git push`.',
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

  'clone.cloned':
    'The repository `{url}` is copied to your workstation: the whole history ({count} commit(s)), a remote named `origin` pointing to it, remote-tracking branches `origin/…`, and your local branch `{branch}` tracking `{tracking}`.',
  'clone.empty':
    'The repository `{url}` is still empty: you get a local repository linked to `origin`, without any commit. Make your first commit, then `git push` to fill the remote repository.',

  'remote.none':
    'No remote: this repository does not know any other copy yet. Add one with `git remote add origin <url>`.',
  'remote.listed': ({ count }) =>
    `${String(count)} ${plural(count, 'remote', 'remotes')} configured. A remote is just a nickname for a URL: by convention \`origin\` is the repository you cloned from.`,
  'remote.added':
    'The remote `{name}` now points to `{url}`. Nothing was exchanged yet: `git fetch {name}` downloads its content, `git push -u {name} <branch>` publishes yours.',
  'remote.removed':
    'The remote `{name}` is forgotten, together with its remote-tracking branches. The remote repository itself is untouched.',
  'remote.renamed':
    'The remote `{from}` is now called `{to}`; its remote-tracking branches were renamed too.',
  'remote.urlChanged': 'The remote `{name}` now points to `{url}`.',

  'fetch.noRemote': 'No remote is configured: there is nothing to fetch.',
  'fetch.upToDate':
    'Nothing new on `{remote}`: your remote-tracking branches are already up to date.',
  'fetch.updated': ({ remote, count }) =>
    `${String(count)} ${plural(count, 'reference', 'references')} updated from \`${String(remote)}\`. Only the remote-tracking branches (\`${String(remote)}/…\`) moved: your branches and files are untouched. \`git status\` now tells whether you are behind, and \`git merge\` or \`git pull\` brings these commits in.`,

  'pull.upToDate': 'Your branch already contains everything on `{target}`: nothing to integrate.',
  'pull.fastForward':
    '`git pull` = `git fetch` + `git merge`. You had not committed anything: your branch simply moved up to `{target}` (fast-forward) and your files are up to date.',
  'pull.merged':
    'You and the remote both had new commits: `git pull` joined them in the merge commit `{commit}`. Remember to `git push` to share it.',
  'pull.mergeConflicts':
    'The remote commits and yours change the same lines: the merge stops on a conflict. Fix the files, `git add`, then `git commit` (or `git merge --abort`).',
  'pull.rebased':
    'With `--rebase`, your local commits were replayed on top of `{target}`: the history stays linear, without a merge commit. They have new hashes; you can now `git push`.',
  'pull.rebaseConflicts':
    'Replaying your commits on top of `{target}` hits a conflict. Fix it, `git add`, then `git rebase --continue` (or `git rebase --abort`).',
  'pull.divergent':
    'Your branch and `{target}` each have commits the other lacks. Git does not choose for you: run again with `git pull --no-rebase` (merge), `git pull --rebase` (replay your commits) or `git pull --ff-only` (refuse). The remote commits are already downloaded.',
  'pull.started':
    'Your branch had no commit yet: it starts right on `{target}` (`{commit}`) and your files were filled in.',

  'push.created': (p) =>
    `The branch \`${String(p.branch)}\` is published on \`${String(p.remote)}\`: the remote repository received your commits and the branch was created there.${upstreamNote(p.upstream)}`,
  'push.updated': (p) =>
    `The remote repository received your new commits: \`${String(p.branch)}\` moved forward there (fast-forward), and so did \`${String(p.remote)}/${String(p.branch)}\` on your side.${upstreamNote(p.upstream)}`,
  'push.forced':
    'Forced push: the `{branch}` branch of the remote was replaced by yours. Commits only it contained are lost for everyone. Keep it for your own branches, preferably with `--force-with-lease`.',
  'push.deleted':
    'The branch `{branch}` is deleted from the remote (and `{remote}/{branch}` from your repository). Your local branch, if any, is untouched.',
  'push.tags':
    'Your tags are published on `{remote}`: others will get them on their next `git fetch`.',
  'push.upToDate': 'The remote already has all these commits: nothing to send.',
  'push.upstreamSet': (p) =>
    `Nothing to send, the remote is already up to date.${upstreamNote(p.upstream)}`,
  'push.rejectedFetchFirst':
    'Rejected: someone pushed commits to `{branch}` that you do not have. Git refuses to overwrite their work. Run `git pull` to integrate them, then push again.',
  'push.rejectedNonFastForward':
    'Rejected: your branch is behind `{remote}/{branch}` or diverged from it (after a rebase or an amend, for instance). Integrate the remote commits first with `git pull`. If you rewrote your own history, `--force-with-lease` is the safe option.',
  'push.rejectedStale':
    'Rejected by `--force-with-lease`: `{branch}` moved on the remote since your last `fetch`. Someone pushed in the meantime; get their work before forcing.',
  'push.rejectedTag':
    'Rejected: the tag already exists on the remote with another commit. A published tag should never move.',
  'push.deleteMissing':
    'This branch does not exist on `{remote}`: there is nothing to delete. `git branch -r` shows the known remote branches.',

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
  'error.remoteAlreadyExists':
    'A remote named `{name}` already exists. `git remote -v` shows its URL.',
  'error.noSuchRemote': 'No remote is called `{name}`. `git remote` lists the existing ones.',
  'error.invalidRemoteName': '`{name}` is not a valid remote name (no spaces, for instance).',
  'error.notARemoteRepository':
    '`{name}` is not a configured remote. Check with `git remote -v`, or add it with `git remote add {name} <url>`.',
  'error.repositoryNotFound':
    'No repository exists at `{url}`. Check the URL: in Agitz, the shared repository is https://github.com/alice/project.git.',
  'error.cloneDestinationNotEmpty':
    'This workstation already holds a project. To clone, switch to another user (or add one) whose workstation is empty.',
  'error.remoteRefNotFound':
    'The remote has no branch `{ref}`. `git branch -r` lists the ones you know.',
  'error.noPushDestination':
    'Git does not know where to send your commits: this repository has no remote. Add it with `git remote add origin <url>`.',
  'error.noUpstreamBranch':
    'The branch `{branch}` has no upstream branch yet. The first time, use `git push -u {remote} {branch}`: it is created on the remote and tracked from then on.',
  'error.pushFromDetachedHead':
    'On a detached HEAD there is no branch to push. Create a branch, or name the destination: `git push {remote} HEAD:<branch>`.',
  'error.sourceRefspec':
    'Nothing is called `{refspec}` in your repository: no branch or tag by that name. Did you make at least one commit on that branch?',
  'error.noTrackingInformation':
    'The branch `{branch}` tracks no remote branch: Git does not know what to fetch. Name it (`git pull origin main`) or set up tracking with `git branch -u origin/<branch>`.',
  'error.pullFromDetachedHead':
    'On a detached HEAD, `git pull` does not know which branch to update. Go back to a branch first.',
  'error.pullBranchNotSpecified':
    'Your branch does not track `{remote}`: name the remote branch too, for instance `git pull {remote} main`.',
  'error.upstreamRefNotFetched':
    'The branch `{branch}` you track no longer exists on the remote (it was probably deleted after a merge). `git branch --unset-upstream` removes the tracking.',
  'error.upstreamBranchNotFound':
    '`{name}` does not exist on your side yet. Run `git fetch` to get the remote branches, or publish yours with `git push -u`.',
  'error.noUpstreamConfigured': 'The branch `{branch}` already tracks no remote branch.',
  'error.noUpstreamForBranch':
    '`@{u}` means the upstream branch, but `{branch}` has none. Set it with `git branch -u origin/<branch>`.',
  'error.localUpstreamNotSupported':
    'Agitz only supports tracking a remote branch, such as `origin/{name}`.',
  'error.detachedHeadUpstream':
    'On a detached HEAD there is no branch to attach `{upstream}` to. Switch to a branch first.',
  'error.usage': 'The command is malformed: the expected syntax is printed right above.',
  'error.commandLine': 'The options are not valid: read the message above.',
  'error.notSupported': 'This option exists in Git, but Agitz does not simulate it yet: {feature}.',
};
