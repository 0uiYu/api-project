import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout, UserPortalHeading, UserPortalPage } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

import {
  LoadingSkeleton,
  EmptyState,
  SearchBar,
  PricingTable,
  PricingToolbar,
  ModelDetailsDrawer,
} from './components'
import { ModelCatalog } from './components/model-catalog'
import { PortalModelFilters } from './components/portal-model-filters'
import { EXCLUDED_GROUPS, FILTER_ALL, VIEW_MODES } from './constants'
import { useFilters } from './hooks/use-filters'
import { usePricingData } from './hooks/use-pricing-data'
import type { PricingSearch } from './search'

export interface PricingProps {
  /**
   * `console` renders the catalog inside the console shell: no public hero,
   * decorative backdrop or sticky filter column, so the model list is the
   * first thing on screen.
   */
  variant?: 'public' | 'console'
  /** Search params of the owning route, used as the initial filter state. */
  search?: PricingSearch
}

export function Pricing(props: PricingProps) {
  const { t } = useTranslation()
  const consoleVariant = props.variant === 'console'
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )

  const {
    models,
    vendors,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const {
    searchInput,
    sortBy,
    vendorFilter,
    groupFilter,
    capabilityFilter,
    priceFilter,
    tagFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setSortBy,
    setVendorFilter,
    setGroupFilter,
    setCapabilityFilter,
    setPriceFilter,
    setTagFilter,
    setTokenUnit,
    setViewMode,
    setShowRechargePrice,
    filteredModels,
    hasActiveFilters,
    activeFilterCount,
    availableTags,
    clearFilters,
    clearSearch,
  } = useFilters(models || [], props.search)

  const handleModelClick = useCallback((modelName: string) => {
    setSelectedModelName(modelName)
  }, [])

  const handleModelToggle = useCallback((modelName: string) => {
    setSelectedModelName((current) =>
      current === modelName ? null : modelName
    )
  }, [])

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (models || []).find(
            (model) => model.model_name === selectedModelName
          ) || null
        : null,
    [models, selectedModelName]
  )

  const availableGroups = useMemo(
    () =>
      Object.keys(usableGroup || {}).filter(
        (g) => !EXCLUDED_GROUPS.includes(g)
      ),
    [usableGroup]
  )

  const modelOptions = useMemo(() => {
    const seen = new Set<string>()
    return (models || [])
      .filter((model) => {
        if (seen.has(model.model_name)) return false
        seen.add(model.model_name)
        return true
      })
      .sort((a, b) => a.model_name.localeCompare(b.model_name))
  }, [models])
  const ratioOptions = useMemo(
    () => [...new Set(Object.values(groupRatio || {}).map((ratio) => `x${ratio}`))].sort(),
    [groupRatio]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    clearSearch()
  }, [clearFilters, clearSearch])

  const renderPricingContent = () => {
    if (filteredModels.length === 0) {
      return (
        <EmptyState
          searchQuery={searchInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    if (viewMode === VIEW_MODES.CARD) {
      return (
        <ModelCatalog
          models={filteredModels}
          expandedModelName={selectedModelName}
          onToggle={handleModelToggle}
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          selectedGroup={groupFilter === FILTER_ALL ? undefined : groupFilter}
          usableGroup={usableGroup || {}}
        />
      )
    }

    return (
      <PricingTable
        models={filteredModels}
        priceRate={priceRate}
        usdExchangeRate={usdExchangeRate}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
        selectedGroup={groupFilter}
        onModelClick={handleModelClick}
      />
    )
  }

  if (isLoading && !consoleVariant) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <LoadingSkeleton viewMode={viewMode} />
        </div>
      </PublicLayout>
    )
  }

  const searchBarProps = {
    value: searchInput,
    onChange: setSearchInput,
    onClear: clearSearch,
    placeholder: t('Search model name, provider, or tag'),
  }

  const toolbar = (
    <PricingToolbar
      simple={consoleVariant}
      filteredCount={filteredModels.length}
      totalCount={models?.length}
      sortBy={sortBy}
      onSortChange={setSortBy}
      tokenUnit={tokenUnit}
      onTokenUnitChange={setTokenUnit}
      showRechargePrice={showRechargePrice}
      onRechargePriceChange={setShowRechargePrice}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      vendorFilter={vendorFilter}
      capabilityFilter={capabilityFilter}
      priceFilter={priceFilter}
      groupFilter={groupFilter}
      tagFilter={tagFilter}
      onVendorChange={setVendorFilter}
      onCapabilityChange={setCapabilityFilter}
      onPriceChange={setPriceFilter}
      onGroupChange={setGroupFilter}
      onTagChange={setTagFilter}
      vendors={vendors || []}
      groups={availableGroups}
      groupRatios={groupRatio}
      tags={availableTags}
      models={models || []}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
    />
  )

  // The catalog expands rows in place; the sheet belongs to the table view.
  const detailsDrawer =
    selectedModel && viewMode === VIEW_MODES.TABLE ? (
      <ModelDetailsDrawer
        open={Boolean(selectedModel)}
        onOpenChange={(open) => {
          if (!open) setSelectedModelName(null)
        }}
        model={selectedModel}
        groupRatio={groupRatio || {}}
        usableGroup={usableGroup || {}}
        endpointMap={
          (endpointMap as Record<string, { path?: string; method?: string }>) ||
          {}
        }
        autoGroups={autoGroups || []}
        priceRate={priceRate ?? 1}
        usdExchangeRate={usdExchangeRate ?? 1}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
      />
    ) : null

  if (consoleVariant) {
    return (
      <UserPortalPage>
        <UserPortalHeading title={t('Model Square')} />
        <PortalModelFilters
          vendors={vendors || []}
          vendorFilter={vendorFilter}
          onVendorChange={setVendorFilter}
          models={modelOptions}
          modelFilter={searchInput}
          onModelChange={setSearchInput}
          ratios={ratioOptions}
          ratioFilter={groupFilter}
          onRatioChange={(value) => setGroupFilter(value === FILTER_ALL ? FILTER_ALL : value.replace(/^x/, ''))}
        />
        {isLoading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : (
          <PricingTable
            models={filteredModels}
            priceRate={priceRate}
            usdExchangeRate={usdExchangeRate}
            tokenUnit={tokenUnit}
            showRechargePrice={showRechargePrice}
            selectedGroup={groupFilter}
            onModelClick={handleModelClick}
          />
        )}
        {detailsDrawer}
      </UserPortalPage>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-20 dark:opacity-[0.10]'
          style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 50% 70%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />
        <PageTransition className='relative mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <header className='mx-auto mb-5 max-w-3xl pt-5 text-center sm:mb-10 sm:pt-10'>
            <h1 className='text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.15] font-bold tracking-tight'>
              {t('Model Square')}
            </h1>
            <p className='text-muted-foreground/80 mt-3 text-sm sm:mt-4 sm:text-base'>
              {t('This site currently has {{count}} models enabled', {
                count: models?.length || 0,
              })}
            </p>
            <p className='text-muted-foreground/60 mx-auto mt-2 max-w-2xl text-xs leading-relaxed sm:text-sm'>
              {t(
                'Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.'
              )}
            </p>
            <SearchBar
              {...searchBarProps}
              className='mx-auto mt-4 max-w-2xl sm:mt-6'
            />
          </header>

          {/* The catalog owns the full width: filters live in one horizontal
              bar instead of a permanent left column. */}
          <div className='min-w-0 space-y-4'>
            {toolbar}

            {renderPricingContent()}
          </div>

          {detailsDrawer}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}
