import { selectCurrentPage, useDocsStore } from './docsStore';

describe('docsStore', () => {
  beforeEach(() => {
    useDocsStore.setState({ isOpen: false, history: [null] });
  });

  it('opens on the requested page', () => {
    useDocsStore.getState().open('commit');
    expect(useDocsStore.getState().isOpen).toBe(true);
    expect(selectCurrentPage(useDocsStore.getState())).toBe('commit');
  });

  it('remembers the pages visited and goes back', () => {
    const { open, back } = useDocsStore.getState();
    open();
    open('merge');
    open('merge');
    open('merge-vs-rebase');
    expect(useDocsStore.getState().history).toEqual([null, 'merge', 'merge-vs-rebase']);

    back();
    back();
    back();
    expect(useDocsStore.getState().history).toEqual([null]);
  });

  it('starts a fresh history each time it opens', () => {
    const { open, close } = useDocsStore.getState();
    open('merge');
    open('rebase');
    close();
    open('tag');
    expect(useDocsStore.getState().history).toEqual(['tag']);
  });

  it('toggles from the table of contents', () => {
    const { toggle } = useDocsStore.getState();
    toggle();
    expect(useDocsStore.getState()).toMatchObject({ isOpen: true, history: [null] });
    toggle();
    expect(useDocsStore.getState().isOpen).toBe(false);
  });
});
