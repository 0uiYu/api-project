import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Code2,
  KeyRound,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'
import { DEFAULT_LOGO, DEFAULT_SYSTEM_NAME } from '@/lib/constants'

const fallbackBrandName = 'Stable'
const stableLogo = '/stable-logo.png'
const titleMark = 'Stable API'
const pageBackground = [
  'radial-gradient(ellipse 42% 32% at 100% 0%, rgba(219,234,254,0.8), rgba(255,255,255,0) 70%)',
  'radial-gradient(ellipse 32% 26% at 0% 16%, rgba(237,244,255,0.95), rgba(255,255,255,0) 72%)',
  'radial-gradient(ellipse 36% 24% at 90% 100%, rgba(237,244,255,0.7), rgba(255,255,255,0) 74%)',
  '#ffffff',
].join(', ')

const featuredModels = [
  { name: 'Claude', vendor: 'Anthropic' },
  { name: 'GPT', vendor: 'OpenAI' },
  { name: 'Gemini', vendor: 'Google' },
  { name: 'Grok', vendor: 'xAI' },
] as const

const featuredModelMarks = {
  Claude:
    'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
  GPT: 'M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z',
  Gemini:
    'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81',
  Grok: 'M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815',
} as const

function FeaturedModelMark(props: {
  name: (typeof featuredModels)[number]['name']
}) {
  return (
    <svg viewBox='0 0 24 24' className='size-10 shrink-0' aria-hidden>
      <path
        fill='#0F172A'
        fillRule='evenodd'
        d={featuredModelMarks[props.name]}
      />
    </svg>
  )
}

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
  const exampleKey = t('your key')
  const exampleModel = t('Example model name')
  const exampleGreeting = t('Example greeting')
  const exampleBody = [
    `'{"model":"${exampleModel}",`,
    `    "messages":[{"role":"user","content":"${exampleGreeting}"}]}'`,
  ].join('\n')
  const exampleCommand = [
    `curl -X POST \\`,
    `  ${apiAddress}/chat/completions \\`,
    `  -H "Authorization: Bearer ${exampleKey}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d ${exampleBody}`,
  ].join('\n')
  const title = t(
    'Connect to quality models worldwide through a Stable API platform'
  )
  const titleMarkIndex = title.indexOf(titleMark)
  const steps: Array<{
    number: string
    icon: LucideIcon
    title: string
    detail: string
  }> = [
    {
      number: '01',
      icon: KeyRound,
      title: t('Get an API key'),
      detail: t('Create a key in the console.'),
    },
    {
      number: '02',
      icon: Code2,
      title: t('Set the API address'),
      detail: t(
        'Set the request address and model parameters from the docs.'
      ),
    },
    {
      number: '03',
      icon: Rocket,
      title: t('Start calling the API'),
      detail: t('Connect the API to your own application.'),
    },
  ]

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlBackground = html.style.background
    const previousBodyBackground = body.style.background
    const previousBodyMinHeight = body.style.minHeight
    // The themed body color would show past this light page, and the
    // viewport min-height would scroll into empty space.
    html.style.background = pageBackground
    body.style.background = pageBackground
    body.style.minHeight = '0px'
    return () => {
      html.style.background = previousHtmlBackground
      body.style.background = previousBodyBackground
      body.style.minHeight = previousBodyMinHeight
    }
  }, [])

  return (
    <div
      className='relative flex min-h-svh flex-col overflow-x-clip font-sans text-[#17243D]'
      style={{ background: pageBackground }}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 overflow-hidden'
      >
        <svg
          className='absolute -top-8 -right-10 h-[640px] w-[480px]'
          viewBox='0 0 480 640'
          fill='none'
        >
          <path
            d='M90 30C250 50 430 190 450 360C470 530 330 630 160 600'
            stroke='#E4EDFC'
            strokeWidth='64'
            strokeLinecap='round'
          />
          <path
            d='M170 0C320 50 470 210 440 390'
            stroke='#F4F8FF'
            strokeWidth='40'
            strokeLinecap='round'
          />
        </svg>
      </div>

      <header className='relative'>
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
            <Link to='/pricing' className='hover:text-[#17243D]'>
              {t('Model list')}
            </Link>
            <Link to='/about' className='hover:text-[#17243D]'>
              {t('Docs')}
            </Link>
            <LanguageSwitcher className='text-[#64748B] hover:bg-[#F8FAFD] hover:text-[#17243D]' />
            <Button
              className='h-9 rounded-full bg-[#2563EB] px-4 text-white hover:bg-[#1D4ED8]!'
              render={<Link to='/dashboard' />}
            >
              {t('Console')}
            </Button>
          </nav>
        </div>
      </header>

      <main className='relative'>
        <section className='mx-auto grid max-w-[1240px] items-center gap-10 px-5 pt-10 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.92fr)] lg:gap-16 lg:pt-16 lg:pb-16'>
          <div>
            <p className='inline-flex rounded-full border border-[#E4EDFC] bg-white/80 px-3 py-1 text-xs text-[#64748B]'>
              {t('Models on this site share one address')}
            </p>
            <h1 className='mt-5 max-w-[11em] text-4xl leading-[1.15] font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem]'>
              {titleMarkIndex === -1 ? (
                title
              ) : (
                <>
                  <span className='block'>
                    {title.slice(0, titleMarkIndex)}
                  </span>
                  <span className='block'>
                    <span className='text-[#2563EB]'>{titleMark}</span>
                    {title.slice(titleMarkIndex + titleMark.length)}
                  </span>
                </>
              )}
            </h1>
            <p className='mt-5 max-w-md text-base leading-7 text-[#64748B]'>
              {t(
                'One API for the models on this site, so developers can connect and focus on the product.'
              )}
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Button
                className='h-11 rounded-full bg-[#2563EB] px-5 text-white hover:bg-[#1D4ED8]!'
                render={<Link to='/dashboard' />}
              >
                {t('Enter the console')}
                <ArrowRight aria-hidden />
              </Button>
              <Button
                variant='outline'
                className='h-11 rounded-full border-[#E7ECF3] bg-white px-5 text-[#17243D] hover:bg-[#F8FAFD] hover:text-[#17243D]'
                render={<Link to='/pricing' />}
              >
                {t('View models')}
              </Button>
            </div>
          </div>

          <div className='w-full min-w-0 max-w-[540px] rounded-2xl border border-[#E4EDFC] bg-white p-3 shadow-[0_10px_30px_rgba(23,36,61,0.06)] lg:ms-auto'>
            <div className='mb-2.5 flex items-center gap-3 px-1.5 pt-1'>
              <div className='flex items-center gap-1.5' aria-hidden>
                <span className='size-2.5 rounded-full bg-[#ff5f57]' />
                <span className='size-2.5 rounded-full bg-[#febc2e]' />
                <span className='size-2.5 rounded-full bg-[#28c840]' />
              </div>
              <div className='ms-auto text-xs text-[#94A3B8]'>
                {t('API call example')}
              </div>
              <CopyButton
                value={exampleCommand}
                className='size-7 text-[#64748B] hover:bg-[#F8FAFD] hover:text-[#17243D]'
              />
            </div>
            <pre className='rounded-xl bg-[#0F172A] px-4 py-3.5 font-mono text-[12px] leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap text-[#E2E8F0]'>
              <span className='text-[#93C5FD]'>% </span>
              <span>curl </span>
              <span>-X POST</span>
              <span> \</span>
              {'\n'}
              <span>  </span>
              <span className='text-[#FDE68A]'>{apiAddress}</span>
              <span className='text-[#FDE68A]'>/chat/completions</span>
              <span> \</span>
              {'\n'}
              <span className='text-[#94A3B8]'>  -H </span>
              <span className='text-[#FDE68A]'>
                &quot;Authorization: Bearer {exampleKey}&quot;
              </span>
              <span> \</span>
              {'\n'}
              <span className='text-[#94A3B8]'>  -H </span>
              <span className='text-[#FDE68A]'>
                &quot;Content-Type: application/json&quot;
              </span>
              <span> \</span>
              {'\n'}
              <span className='text-[#94A3B8]'>  -d </span>
              <span className='text-[#FDE68A]'>{exampleBody}</span>
            </pre>
          </div>
        </section>

        <section className='mx-auto max-w-[1240px] px-5 pb-16 sm:px-6'>
          <ul className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {featuredModels.map((model) => (
              <li key={model.name}>
                <Link
                  to='/models'
                  aria-label={`${model.name} ${model.vendor}`}
                  className='flex items-center gap-3 rounded-lg border border-[#E7ECF3] bg-white px-4 py-3.5 hover:border-[#D5DEEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]'
                >
                  <FeaturedModelMark name={model.name} />
                  <span className='min-w-0'>
                    <span className='block text-[15px] font-semibold text-[#17243D]'>
                      {model.name}
                    </span>
                    <span className='mt-0.5 block text-xs text-[#64748B]'>
                      {model.vendor}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className='mx-auto max-w-[1240px] px-5 pb-16 sm:px-6'>
          <ol className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <li
                  key={step.number}
                  className='flex h-full flex-col rounded-2xl border border-[#E7ECF3] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,61,0.04)]'
                >
                  <div className='flex items-center gap-3'>
                    <span className='flex size-7 items-center justify-center rounded-full bg-[#EDF4FF] text-xs font-semibold text-[#2563EB]'>
                      {step.number}
                    </span>
                    <Icon className='size-5 text-[#2563EB]' aria-hidden />
                  </div>
                  <h2 className='mt-5 text-base font-semibold'>{step.title}</h2>
                  <p className='mt-2 flex-1 text-sm leading-6 text-[#64748B]'>
                    {step.detail}
                  </p>
                  <ArrowRight
                    className='mt-4 size-4 text-[#C5D0E0]'
                    aria-hidden
                  />
                </li>
              )
            })}
          </ol>
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
