import '@testing-library/jest-dom/vitest';

/* React Flow measures the DOM with APIs jsdom does not implement. */
class ResizeObserverStub {
  observe(): undefined {
    return undefined;
  }

  unobserve(): undefined {
    return undefined;
  }

  disconnect(): undefined {
    return undefined;
  }
}

class DOMMatrixReadOnlyStub {
  readonly m22: number;

  constructor(transform?: string) {
    const scale = /scale\(([\d.]+)\)/.exec(transform ?? '')?.[1];
    this.m22 = scale === undefined ? 1 : Number(scale);
  }
}

Object.assign(globalThis, {
  ResizeObserver: ResizeObserverStub,
  DOMMatrixReadOnly: DOMMatrixReadOnlyStub,
});

/* jsdom has no modal dialogs: opening and closing only toggle the `open` attribute. */
Object.assign(HTMLDialogElement.prototype, {
  showModal(this: HTMLDialogElement) {
    this.open = true;
  },
  close(this: HTMLDialogElement) {
    if (this.open) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    }
  },
});
