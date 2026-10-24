/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  Outlet,
  useParams,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { NewpaperArticle } from '../article'
import { scenes } from '../content'
import { NewpaperHome, NewpaperLearn, NewpaperResources } from '../index'

let client: QueryClient
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  window.localStorage.clear()
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  useSystemConfigStore.getState().setConfig({ systemName: 'newpaper' })
  useSystemConfigStore.getState().setLoading(false)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: { success: true, data: url === '/api/notice' ? '' : {} },
  }))
})
afterEach(() => {
  client.clear()
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  window.localStorage.clear()
})

async function renderPage(component = NewpaperHome) {
  const root = createRootRoute({ component: Outlet })
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: '/', component }),
      createRoute({
        getParentRoute: () => root,
        path: '/learn',
        component: NewpaperLearn,
      }),
      createRoute({
        getParentRoute: () => root,
        path: '/learn/$articleId',
        component: function ArticlePage() {
          const params = useParams({ strict: false })
          return <NewpaperArticle articleId={params.articleId ?? ''} />
        },
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

it('offers internal learning navigation and external tool access without account actions', async () => {
  await renderPage()
  expect(
    await screen.findByRole('link', { name: /Start with a short guide/ })
  ).toHaveAttribute('href', '/learn/first')
  expect(
    screen.getByRole('link', { name: /View all materials/ })
  ).toHaveAttribute('href', '/learn')
  for (const link of screen.getAllByRole('link', { name: /Open Sloth Code/ })) {
    expect(link).toHaveAttribute('href', 'https://slothcode.dev')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
  expect(
    screen.queryByRole('link', { name: 'Sign in' })
  ).not.toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toHaveTextContent('New API')
})

it('switches the practice task by keyboard and copies its matching prompt', async () => {
  const user = userEvent.setup()
  await renderPage()
  const first = await screen.findByRole('tab', { name: 'Read a passage' })
  first.focus()
  await user.keyboard('{ArrowRight}{Enter}')
  await waitFor(() =>
    expect(
      screen.getByRole('tab', { name: 'Discuss an outline' })
    ).toHaveAttribute('aria-selected', 'true')
  )
  const clipboard = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockResolvedValue()
  await user.click(screen.getByRole('button', { name: 'Copy practice prompt' }))
  expect(clipboard).toHaveBeenCalledWith(scenes[1].prompt)
  expect(
    screen.getByRole('link', { name: /Read the full guide/ })
  ).toHaveAttribute('href', '/learn/outline')
})

it('offers a material-list recovery link when an article is unknown', async () => {
  await renderPage(() => <NewpaperArticle articleId='not-collected' />)
  expect(
    await screen.findByRole('heading', { name: 'This guide is not available.' })
  ).toBeVisible()
  expect(
    screen.getByRole('link', { name: /Return to materials/ })
  ).toHaveAttribute('href', '/learn')
})

it('keeps original-source attribution and product limits alongside external resources', async () => {
  await renderPage(NewpaperResources)
  expect(
    await screen.findAllByRole('link', { name: /Read the source/ })
  ).toHaveLength(6)
  expect(screen.getByText(/OpenAI Academy · Juliann Igo/)).toBeVisible()
  expect(screen.getByText(/原文面向 ChatGPT Edu/)).toBeVisible()
  expect(screen.getByText(/Original introductions only/)).toBeVisible()
})

it('navigates from the home action to the guide and back to the materials list', async () => {
  const user = userEvent.setup()
  await renderPage()
  await user.click(
    await screen.findByRole('link', { name: /Start with a short guide/ })
  )
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: '第一次用 AI 辅助论文，从一个小问题开始',
    })
  ).toBeVisible()
  await user.click(screen.getByRole('link', { name: /Return to materials/ }))
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Start small, keep thinking.',
    })
  ).toBeVisible()
})
