import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, type FormProps, type Navigation } from 'react-router';
import { beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({
  state: 'idle' as Navigation['state'],
  formData: undefined as FormData | undefined,
}));
export const navigation = state;

vi.mock('react-router', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router')>();
  const { createElement } = await import('react');
  return {
    ...actual,
    Form: ({ children, replace: _replace, preventScrollReset: _preventScrollReset, ...props }: FormProps) => createElement('form', props, children),
    useNavigation: () => state,
    useRevalidator: () => ({ state: 'idle', revalidate() {} }),
  };
});

beforeEach(() => {
  navigation.state = 'idle';
  navigation.formData = undefined;
  vi.clearAllMocks();
});

export function renderWithRouter(element: ReactElement, path = '/') {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, element));
}
