import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { CopyButton } from '@/components/copy-button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'
import { DEFAULT_LOGO, DEFAULT_SYSTEM_NAME } from '@/lib/constants'

import '../home.css'

const fallbackBrandName = 'Stable'
const stableLogo = '/stable-logo.png'
const titleMark = 'Stable API'
// Ice-blue wash over white: three soft radials, drawn top layer last.
const pageBackground = [
  'radial-gradient(ellipse 48% 34% at 50% -6%, rgba(219,234,254,0.9), rgba(255,255,255,0) 70%)',
  'radial-gradient(ellipse 34% 26% at 94% 10%, rgba(224,242,254,0.85), rgba(255,255,255,0) 70%)',
  'radial-gradient(ellipse 38% 26% at 4% 88%, rgba(237,244,255,0.9), rgba(255,255,255,0) 74%)',
  '#ffffff',
].join(', ')

export function PlatformHome() {
  const { t } = useTranslation()
  const { systemName, logo } = useSystemConfig()
  const brandName =
    systemName !== '' && systemName !== DEFAULT_SYSTEM_NAME
      ? systemName
      : fallbackBrandName
  const showLogo = logo !== '' && logo !== DEFAULT_LOGO
  const showBrandText = showLogo || brandName !== fallbackBrandName
  const apiAddress = t('API address placeholder')
  const title = t(
    'Connect to quality models worldwide through a Stable API platform'
  )
  const titleMarkIndex = title.indexOf(titleMark)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlBackground = html.style.background
    const previousBodyBackground = body.style.background
    const previousBodyMinHeight = body.style.minHeight
    const previousHtmlOverscroll = html.style.overscrollBehavior
    const previousBodyOverscroll = body.style.overscrollBehavior
    const previousHomeViewportHeight = html.style.getPropertyValue('--home-vh')
    // Viewport units can disagree with the visible content area (Edge was
    // measured resolving 100svh 63px taller than the visible height, leaving a
    // blank strip below the pinned footer). Measure the real height instead.
    const syncViewportHeight = () => {
      html.style.setProperty('--home-vh', `${html.clientHeight}px`)
    }
    syncViewportHeight()
    // Chromium/Edge can keep reporting a stale, larger viewport until the page
    // has settled (innerHeight, visualViewport and svh all stay on the
    // pre-settle value), which leaves a scrollable blank strip that only heals
    // once something forces a new measurement — opening DevTools does exactly
    // that. Re-measure on every signal of a viewport change, and once after the
    // first paint.
    const deferredSync = window.requestAnimationFrame(() => {
      syncViewportHeight()
      window.requestAnimationFrame(syncViewportHeight)
    })
    const settleTimer = window.setTimeout(syncViewportHeight, 400)
    window.addEventListener('resize', syncViewportHeight)
    window.addEventListener('orientationchange', syncViewportHeight)
    window.visualViewport?.addEventListener('resize', syncViewportHeight)
    window.visualViewport?.addEventListener('scroll', syncViewportHeight)
    const viewportObserver = new ResizeObserver(syncViewportHeight)
    viewportObserver.observe(html)
    // The themed body color would show past this light page, and the
    // viewport min-height would scroll into empty space.
    html.style.background = pageBackground
    body.style.background = pageBackground
    body.style.minHeight = '0px'
    // Chromium rubber-band overscroll (Edge especially) would otherwise drag
    // the page past its end and reveal a blank sheet underneath.
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    return () => {
      window.cancelAnimationFrame(deferredSync)
      window.clearTimeout(settleTimer)
      viewportObserver.disconnect()
      window.removeEventListener('resize', syncViewportHeight)
      window.removeEventListener('orientationchange', syncViewportHeight)
      window.visualViewport?.removeEventListener('resize', syncViewportHeight)
      window.visualViewport?.removeEventListener('scroll', syncViewportHeight)
      html.style.background = previousHtmlBackground
      body.style.background = previousBodyBackground
      body.style.minHeight = previousBodyMinHeight
      html.style.overscrollBehavior = previousHtmlOverscroll
      body.style.overscrollBehavior = previousBodyOverscroll
      if (previousHomeViewportHeight) {
        html.style.setProperty('--home-vh', previousHomeViewportHeight)
      } else {
        html.style.removeProperty('--home-vh')
      }
    }
  }, [])

  return (
    <div
      className='relative flex min-h-[var(--home-vh,100svh)] flex-col overflow-x-clip font-sans text-[#17243D]'
      style={{ background: pageBackground }}
    >
      <div aria-hidden className='home-backdrop'>
        <div className='home-grid' />
        <div className='home-glow home-glow-a' />
        <div className='home-glow home-glow-b' />
        <div className='home-frame' />
        <svg
          className='absolute -top-8 -right-10 h-[640px] w-[480px]'
          viewBox='0 0 480 640'
          fill='none'
        >
          <path
            d='M90 30C250 50 430 190 450 360C470 530 330 630 160 600'
            stroke='#DCE9FB'
            strokeWidth='64'
            strokeLinecap='round'
          />
          <path
            d='M170 0C320 50 470 210 440 390'
            stroke='#EFF5FF'
            strokeWidth='40'
            strokeLinecap='round'
          />
        </svg>
      </div>

      <header className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#DCE7F7] to-transparent'
        />
        <div className='mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-6'>
          <Link to='/' className='inline-flex items-center gap-2.5'>
            {showLogo ? (
              <img
                src={logo}
                alt=''
                className='size-8 rounded-lg object-contain'
              />
            ) : (
              <img
                src={stableLogo}
                alt={showBrandText ? '' : brandName}
                className='h-8 w-auto'
              />
            )}
            {showBrandText ? (
              <span className='text-[15px] font-semibold tracking-wide'>
                {brandName}
              </span>
            ) : null}
          </Link>
          <nav className='flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#64748B] sm:w-auto sm:justify-end'>
            <Link to='/about' className='hover:text-[#17243D]'>
              {t('Docs')}
            </Link>
            <LanguageSwitcher className='text-[#64748B] hover:bg-[#F8FAFD] hover:text-[#17243D]' />
            <Button
              variant='outline'
              className='h-9 rounded-full border-[#E2E8F0] bg-white px-4 text-[#17243D] hover:bg-[#F8FAFD] hover:text-[#17243D]'
              render={<Link to='/dashboard' />}
            >
              {t('Console')}
            </Button>
          </nav>
        </div>
      </header>

      <main className='relative flex flex-1 flex-col justify-center'>
        {/* min-h-[56svh]: the hero claims a share of the viewport so a tall
            screen reads as intentional breathing room instead of one big hole
            between the copy and the pinned footer. */}
        <section className='mx-auto flex min-h-[calc(var(--home-vh,100svh)*0.56)] w-full max-w-[1240px] flex-col items-center justify-center px-5 py-10 text-center sm:px-6 lg:py-14'>
          <AnimateInView delay={0}>
            <p className='inline-flex rounded-full border border-[#DCE7F7] bg-white/70 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-[#64748B] backdrop-blur-md'>
              {t('Models on this site share one address')}
            </p>
          </AnimateInView>
          <AnimateInView delay={80}>
            <h1 className='mt-5 max-w-[18em] text-4xl leading-[1.15] font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem]'>
              {titleMarkIndex === -1 ? (
                title
              ) : (
                <>
                  <span className='block'>
                    {title.slice(0, titleMarkIndex)}
                  </span>
                  <span className='block'>
                    <span className='text-[#1E3A8A]'>{titleMark}</span>
                    {title.slice(titleMarkIndex + titleMark.length)}
                  </span>
                </>
              )}
            </h1>
          </AnimateInView>
          <AnimateInView delay={160}>
            <p className='mt-5 max-w-xl text-base leading-7 text-[#64748B]'>
              {t(
                'One API for the models on this site, so developers can connect and focus on the product.'
              )}
            </p>
          </AnimateInView>
          <AnimateInView delay={240} className='flex flex-col items-center'>
            <Button
              className='mt-8 h-12 rounded-lg bg-[#2563EB] px-8 text-white shadow-[0_18px_38px_-16px_rgba(37,99,235,0.65),0_2px_6px_-2px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.28)] hover:-translate-y-px hover:bg-[#1D4ED8]! hover:shadow-[0_22px_44px_-16px_rgba(37,99,235,0.7),0_2px_6px_-2px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.32)]'
              render={<Link to='/dashboard' />}
            >
              {t('Enter the console')}
              <ArrowRight aria-hidden />
            </Button>
            {/* The only hard fact on the page: where requests go. Kept next
                to the CTA so returning users can copy it without the console. */}
            <div className='mt-6 flex max-w-full items-center gap-1 rounded-full border border-[#D7E4F7] bg-white/70 py-1.5 ps-4 pe-1.5 shadow-[0_10px_30px_-18px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md'>
              <span className='truncate font-mono text-[13px] text-[#475569]'>
                {apiAddress}
              </span>
              <CopyButton
                value={apiAddress}
                className='size-7 shrink-0 text-[#64748B] hover:bg-[#F8FAFD] hover:text-[#17243D]'
              />
            </div>
          </AnimateInView>
        </section>
        <section className='mx-auto grid w-full max-w-[980px] gap-3 px-5 pb-12 sm:grid-cols-3 sm:px-6'>
          {[
            {
              title: t('Model Square'),
              description: t('Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.'),
            },
            {
              title: t('API Keys'),
              description: t('Create an API key and start calling models with a familiar API format.'),
            },
            {
              title: t('Usage Records'),
              description: t('Track requests, tokens, and spending in one clear view.'),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className='rounded-xl border border-[#DCE7F7] bg-white/70 p-5 backdrop-blur-md'
            >
              <h2 className='text-sm font-semibold text-[#17243D]'>{feature.title}</h2>
              <p className='mt-2 text-xs leading-5 text-[#64748B]'>{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className='relative mt-auto border-t border-[#E7ECF3]'>
        <div className='mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-5 py-5 text-xs text-[#64748B] sm:px-6'>
          <span className='me-auto font-medium text-[#17243D]'>{brandName}</span>
          <Link to='/user-agreement' className='hover:text-[#17243D]'>
            {t('User Agreement')}
          </Link>
          <Link to='/privacy-policy' className='hover:text-[#17243D]'>
            {t('Privacy Policy')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
