import { create } from 'zustand';

/** The page shown for the selected repository, like the tabs and sub-pages of github.com. */
export type GitHubView =
  | { readonly page: 'code' }
  | { readonly page: 'pulls' }
  | { readonly page: 'newPull'; readonly head?: string | undefined }
  | { readonly page: 'pull'; readonly number: number }
  | { readonly page: 'issues' }
  | { readonly page: 'newIssue' }
  | { readonly page: 'issue'; readonly number: number }
  | { readonly page: 'actions' }
  | { readonly page: 'settings' };

export type GitHubTab = 'code' | 'pulls' | 'issues' | 'actions' | 'settings';

interface GitHubPanelState {
  readonly isOpen: boolean;
  /** Canonical URL of the repository on screen, `null` for the list of repositories. */
  readonly repository: string | null;
  readonly view: GitHubView;
  readonly open: (repository?: string | null, view?: GitHubView) => void;
  readonly navigate: (view: GitHubView) => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

const CODE: GitHubView = { page: 'code' };

export const useGitHubStore = create<GitHubPanelState>()((set) => ({
  isOpen: false,
  repository: null,
  view: CODE,
  open: (repository = null, view = CODE) => {
    set({ isOpen: true, repository, view });
  },
  navigate: (view) => {
    set({ view });
  },
  close: () => {
    set({ isOpen: false });
  },
  toggle: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
}));

/** The tab a view belongs to, highlighted in the repository navigation. */
export function tabOf(view: GitHubView): GitHubTab {
  switch (view.page) {
    case 'newPull':
    case 'pull':
      return 'pulls';
    case 'newIssue':
    case 'issue':
      return 'issues';
    default:
      return view.page;
  }
}
