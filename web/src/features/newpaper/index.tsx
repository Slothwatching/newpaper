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
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import {
  ChineseMaterialsNote,
  GuideCards,
  NewpaperLayout,
  NextTask,
  PracticeScenes,
  ResourceCards,
  SlothCodeLink,
} from './components'

export function NewpaperHome() {
  const { t } = useTranslation()
  return (
    <NewpaperLayout title={t('Learning materials')}>
      <section className='grid items-center gap-12 pb-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16'>
        <div>
          <p className='mb-6 text-xs font-semibold tracking-[0.16em] text-[#64704d] uppercase dark:text-[#b0c28c]'>
            {t('Learn to ask. Learn to think.')}
          </p>
          <h1 className='max-w-2xl font-serif text-4xl leading-[1.22] tracking-tight sm:text-5xl lg:text-6xl'>
            {t('A thoughtful AI companion for your paper.')}
          </h1>
          <p className='mt-6 text-lg leading-relaxed'>
            {t('Small tasks. Clear questions. Your own thinking.')}
          </p>
          <p className='text-muted-foreground mt-3 max-w-lg leading-relaxed'>
            {t(
              'Practical reading and original exercises for students using Codex.'
            )}
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Button
              role='link'
              size='lg'
              className='bg-[#34452e] text-white hover:bg-[#263923]'
              render={
                <Link to='/learn/$articleId' params={{ articleId: 'first' }} />
              }
            >
              {t('Start with a short guide')} →
            </Button>
            <SlothCodeLink />
          </div>
          <ChineseMaterialsNote />
        </div>
        <Card className='rotate-1 rounded-2xl border border-[#d8deca] bg-[#e9eddf] py-8 shadow-lg shadow-[#52673a]/5 dark:border-white/10 dark:bg-[#293326]'>
          <CardContent className='px-7 sm:px-9'>
            <p className='text-xs font-medium tracking-wider'>newpaper</p>
            <div lang='zh-CN'>
              <h2 className='mt-8 font-serif text-3xl leading-relaxed'>
                不只问「怎么写」，
                <br />
                也问「哪里还没想清楚」。
              </h2>
              <blockquote className='mt-7 border-l-2 border-[#758758] pl-5 text-base leading-8'>
                这是我的主题、课程要求和提纲。请指出范围过大或逻辑跳跃的地方，说明理由，先不要替我重写。
              </blockquote>
            </div>
            <p className='text-muted-foreground mt-7 text-xs'>
              {t('A prompt example, not a tested model response.')}
            </p>
          </CardContent>
        </Card>
      </section>
      <section className='border-y border-[#dadccf] py-6 dark:border-white/15'>
        <p className='text-center text-sm tracking-wide'>
          {t('Start small, keep thinking.')}
        </p>
      </section>
      <section className='mt-16'>
        <h2 className='text-3xl font-semibold'>
          {t('Choose a task to practice')}
        </h2>
        <PracticeScenes />
      </section>
      <section className='mt-20'>
        <div className='mb-7 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-semibold'>
              {t('Learning materials')}
            </h2>
            <p className='text-muted-foreground mt-3'>
              {t('Four short guides for your next study task.')}
            </p>
          </div>
          <Link
            to='/learn'
            className='text-sm font-medium underline-offset-4 hover:underline'
          >
            {t('View all materials')} →
          </Link>
        </div>
        <GuideCards />
      </section>
      <section className='mt-20'>
        <div className='mb-7 flex items-end justify-between gap-4'>
          <h2 className='text-3xl font-semibold'>{t('Curated resources')}</h2>
          <Link
            to='/resources'
            className='text-sm font-medium underline-offset-4 hover:underline'
          >
            {t('Resources')} →
          </Link>
        </div>
        <ResourceCards preview />
      </section>
      <NextTask />
    </NewpaperLayout>
  )
}

export function NewpaperLearn() {
  const { t } = useTranslation()
  return (
    <NewpaperLayout title={t('Learning materials')}>
      <header className='mb-12'>
        <p className='mb-4 text-xs tracking-widest'>newpaper</p>
        <h1 className='font-serif text-4xl sm:text-5xl'>
          {t('Start small, keep thinking.')}
        </h1>
        <p className='text-muted-foreground mt-5 text-lg'>
          {t('Four short guides for your next study task.')}
        </p>
        <ChineseMaterialsNote />
      </header>
      <GuideCards />
      <NextTask />
    </NewpaperLayout>
  )
}

export function NewpaperResources() {
  const { t } = useTranslation()
  return (
    <NewpaperLayout title={t('Resources')}>
      <header className='mb-12'>
        <p className='mb-4 text-xs tracking-widest'>{t('Curated resources')}</p>
        <h1 className='font-serif text-4xl sm:text-5xl'>
          {t('Go back to the original source.')}
        </h1>
        <ChineseMaterialsNote />
      </header>
      <ResourceCards />
      <section className='text-muted-foreground mt-10 max-w-3xl text-sm leading-relaxed'>
        <h2 className='mb-3 font-semibold'>{t('Source notes')}</h2>
        <p>
          {t(
            'Original introductions only. Authors and institutions do not endorse Newpaper. Check course rules and current product documentation.'
          )}
        </p>
      </section>
      <NextTask />
    </NewpaperLayout>
  )
}
