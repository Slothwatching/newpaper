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
import { Link } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Footer } from '@/components/layout/components/footer'
import { PublicLayout } from '@/components/layout/components/public-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { guides, resources, scenes } from './content'

export function NewpaperLayout(props: { children: ReactNode; title: string }) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${props.title} · newpaper`
  }, [props.title])
  const navLinks = [
    { title: t('Home'), href: '/' },
    { title: t('Learning materials'), href: '/learn' },
    { title: t('Resources'), href: '/resources' },
    {
      title: t('Open Sloth Code'),
      href: 'https://slothcode.dev',
      external: true,
    },
  ]
  return (
    <PublicLayout
      siteName='newpaper'
      navLinks={navLinks}
      showAuthButtons={false}
      showNotifications={false}
      showMainContainer={false}
    >
      <main className='bg-[#f7f5ee] text-[#262f27] dark:bg-[#171c18] dark:text-[#e8e9dd]'>
        <div className='mx-auto max-w-6xl px-5 pt-28 pb-20 sm:px-8 lg:pt-36'>
          {props.children}
        </div>
      </main>
      <Footer name='newpaper' />
    </PublicLayout>
  )
}

export function SlothCodeLink() {
  const { t } = useTranslation()
  return (
    <Button
      role='link'
      render={
        <a
          href='https://slothcode.dev'
          target='_blank'
          rel='noopener noreferrer'
        />
      }
      variant='outline'
      size='lg'
    >
      {t('Open Sloth Code')} ↗
    </Button>
  )
}

export function ChineseMaterialsNote() {
  const { t } = useTranslation()
  return (
    <p className='text-muted-foreground mt-4 text-sm'>
      {t('Chinese learning materials')} ·{' '}
      {t('These original guides and prompts are written in Chinese.')}
    </p>
  )
}

export function GuideCards() {
  const { t } = useTranslation()
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {guides.map((guide, index) => (
        <Link
          key={guide.id}
          to='/learn/$articleId'
          params={{ articleId: guide.id }}
          className='group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4'
        >
          <Card className='h-full rounded-2xl bg-white/65 py-7 transition-colors group-hover:bg-[#edf0e4] dark:bg-white/5 dark:group-hover:bg-white/10'>
            <CardContent className='space-y-4 px-7'>
              <p
                className='text-xs tracking-wider text-[#64704d] dark:text-[#b0c28c]'
                lang='zh-CN'
              >
                {String(index + 1).padStart(2, '0')} / {guide.tag}
              </p>
              <div lang='zh-CN'>
                <h3 className='text-xl leading-relaxed font-semibold'>
                  {guide.title}
                </h3>
                <p className='text-muted-foreground mt-3 leading-relaxed'>
                  {guide.desc}
                </p>
              </div>
              <span className='inline-block pt-3 text-sm font-medium'>
                {t('Read guide')} →
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function PracticeScenes() {
  const { t } = useTranslation()
  return (
    <Tabs
      defaultValue='first'
      className='mt-7 gap-0 overflow-hidden rounded-2xl border border-[#d5d9c9] dark:border-white/15'
    >
      <TabsList
        aria-label={t('Choose a task to practice')}
        className='grid h-auto! w-full grid-cols-1 rounded-none bg-[#e9eddf] p-2 sm:grid-cols-3 dark:bg-white/5'
      >
        <TabsTrigger value='first' className='min-h-12 whitespace-normal'>
          {t('Read a passage')}
        </TabsTrigger>
        <TabsTrigger value='outline' className='min-h-12 whitespace-normal'>
          {t('Discuss an outline')}
        </TabsTrigger>
        <TabsTrigger value='revise' className='min-h-12 whitespace-normal'>
          {t('Revise a draft')}
        </TabsTrigger>
      </TabsList>
      {scenes.map((scene) => (
        <TabsContent
          key={scene.article}
          value={scene.article}
          className='bg-white/50 p-5 sm:p-8 dark:bg-white/5'
        >
          <div lang='zh-CN'>
            <h3 className='text-xl font-semibold'>{scene.title}</h3>
            <p className='text-muted-foreground mt-3 leading-relaxed'>
              {scene.desc}
            </p>
          </div>
          <PromptBox prompt={scene.prompt} />
          <div className='mt-5 flex flex-wrap items-center justify-between gap-4'>
            <CopyButton
              value={scene.prompt}
              size='default'
              variant='outline'
              aria-label={t('Copy practice prompt')}
            >
              {t('Copy practice prompt')}
            </CopyButton>
            <Link
              to='/learn/$articleId'
              params={{ articleId: scene.article }}
              className='text-sm font-medium underline-offset-4 hover:underline'
            >
              {t('Read the full guide')} →
            </Link>
          </div>
          <p className='text-muted-foreground mt-4 text-xs'>
            {t('A prompt example, not a tested model response.')}
          </p>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function PromptBox(props: { prompt: string }) {
  return (
    <pre
      lang='zh-CN'
      className='mt-5 overflow-x-auto rounded-xl border border-[#dadccf] bg-[#f3f1e8] p-5 font-sans text-sm leading-8 break-words whitespace-pre-wrap dark:border-white/10 dark:bg-black/20'
    >
      {props.prompt}
    </pre>
  )
}

export function ResourceCards(props: { preview?: boolean }) {
  const { t } = useTranslation()
  const items = props.preview ? resources.slice(0, 3) : resources
  return (
    <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
      {items.map((resource) => (
        <Card
          key={resource.id}
          className='rounded-2xl bg-white/60 py-6 dark:bg-white/5'
        >
          <CardContent className='flex h-full flex-col gap-4 px-6'>
            <div className='flex-1 space-y-3' lang='zh-CN'>
              <p className='text-xs font-medium text-[#64704d] dark:text-[#b0c28c]'>
                {resource.tag}
              </p>
              <h3 className='text-lg leading-relaxed font-semibold'>
                {resource.title}
              </h3>
              <p className='text-muted-foreground text-xs'>{resource.source}</p>
              <p className='text-sm leading-relaxed'>{resource.desc}</p>
              <p className='text-muted-foreground border-t border-current/10 pt-3 text-xs leading-relaxed'>
                {resource.limit}
              </p>
            </div>
            <div className='flex flex-wrap gap-4 text-sm font-medium'>
              <a
                href={resource.url}
                target='_blank'
                rel='noopener noreferrer'
                className='underline-offset-4 hover:underline'
              >
                {t('Read the source')} ↗
              </a>
              {'video' in resource && (
                <a
                  href={resource.video}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline-offset-4 hover:underline'
                >
                  {t('Watch the lecture')} ↗
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function NextTask() {
  const { t } = useTranslation()
  return (
    <section className='mt-20 flex flex-col justify-between gap-6 rounded-2xl bg-[#e4e9d8] p-7 sm:flex-row sm:items-center sm:p-10 dark:bg-[#283527]'>
      <div>
        <h2 className='text-2xl font-semibold'>
          {t('Bring one question to your next task.')}
        </h2>
        <p className='mt-3 max-w-xl text-sm leading-relaxed'>
          {t(
            'Newpaper provides learning materials. Tool setup takes place on Sloth Code.'
          )}
        </p>
      </div>
      <SlothCodeLink />
    </section>
  )
}
