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

import { CopyButton } from '@/components/copy-button'
import { RichContent } from '@/components/rich-content'

import { articleBodies } from './articles'
import {
  ChineseMaterialsNote,
  NewpaperLayout,
  NextTask,
  PromptBox,
} from './components'
import { guides, scenes } from './content'

export function NewpaperArticle(props: { articleId: string }) {
  const { t } = useTranslation()
  const guide = guides.find((item) => item.id === props.articleId)
  const scene = scenes.find((item) => item.article === props.articleId)
  if (!guide) {
    return (
      <NewpaperLayout title={t('Learning materials')}>
        <h1 className='text-3xl font-semibold'>
          {t('This guide is not available.')}
        </h1>
        <Link to='/learn' className='mt-6 inline-block underline'>
          {t('Return to materials')} →
        </Link>
      </NewpaperLayout>
    )
  }
  return (
    <NewpaperLayout title={guide.title}>
      <div className='mx-auto max-w-3xl'>
        <Link
          to='/learn'
          className='text-muted-foreground text-sm underline-offset-4 hover:underline'
        >
          ← {t('Return to materials')}
        </Link>
        <article className='mt-8'>
          <p className='text-xs tracking-wide'>
            {t('Original Newpaper guide')}
          </p>
          <h1
            lang='zh-CN'
            className='mt-4 font-serif text-3xl leading-relaxed sm:text-4xl'
          >
            {guide.title}
          </h1>
          <ChineseMaterialsNote />
          <div lang='zh-CN' className='mt-10'>
            <RichContent content={articleBodies[guide.id]} />
          </div>
          {scene && (
            <section className='mt-10'>
              <PromptBox prompt={scene.prompt} />
              <CopyButton
                value={scene.prompt}
                size='default'
                variant='outline'
                className='mt-4'
                aria-label={t('Copy practice prompt')}
              >
                {t('Copy practice prompt')}
              </CopyButton>
            </section>
          )}
        </article>
        <NextTask />
      </div>
    </NewpaperLayout>
  )
}
