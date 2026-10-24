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
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { PublicHeader } from '../public-header'

let client: QueryClient
beforeEach(() => {
  window.localStorage.clear()
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
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

async function renderHeader(custom: boolean) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <PublicHeader
          navLinks={
            custom
              ? [{ title: 'Learning materials', href: '/learn' }]
              : undefined
          }
          showAuthButtons={false}
          showNotifications={false}
          showThemeSwitch={false}
          showLanguageSwitcher={false}
        />
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

it('uses explicit public links on desktop and after opening the mobile menu when server links exist', async () => {
  await renderHeader(true)
  expect(
    await screen.findAllByRole('link', { name: 'Learning materials' })
  ).toHaveLength(2)
  expect(
    screen.queryByRole('link', { name: 'Console' })
  ).not.toBeInTheDocument()
  await userEvent.click(
    screen.getByRole('button', { name: 'Toggle navigation menu' })
  )
  expect(
    screen.getAllByRole('link', { name: 'Learning materials' })[1]
  ).toHaveAttribute('href', '/learn')
})

it('keeps dynamic server navigation when no explicit public links are supplied', async () => {
  await renderHeader(false)
  expect(await screen.findAllByRole('link', { name: 'Console' })).toHaveLength(
    2
  )
})
