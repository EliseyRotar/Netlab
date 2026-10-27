/**
 * ECharts integration.
 *
 * A tiny registry: every view mounts a chart with an option factory, and
 * the factory is kept around so charts can be rebuilt when the theme, the
 * language or the layout change (dark/light palette is read from CSS
 * custom properties at render time, never baked in).
 *
 * Chart init is best-effort: in non-rendering environments (jsdom tests)
 * it fails silently and the view simply shows no chart.
 */

import * as echarts from 'echarts/core'
import { PieChart, TreemapChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'

echarts.use([PieChart, TreemapChart, TooltipComponent, LegendComponent, SVGRenderer])

type OptionFactory = () => EChartsCoreOption

const factories = new Map<HTMLElement, OptionFactory>()

/**
 * Read a design token from the live CSS custom properties.
 *
 * The palette is written in OKLCH, but zrender (ECharts' renderer) only
 * understands legacy colour syntax, so oklch() values are resolved to
 * hex through a canvas fillStyle probe — the browser does the maths.
 * If the engine cannot parse the value the raw string is returned
 * unchanged (charts only run where a DOM exists anyway).
 */
export function cssVar(name: string): string {
  if (typeof document === 'undefined') return ''
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value.startsWith('oklch(')) return value
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return value
    ctx.fillStyle = '#010203' // sentinel: an unchanged read means "unparsed"
    ctx.fillStyle = value
    const parsed = ctx.fillStyle
    return typeof parsed === 'string' && parsed !== '#010203' ? parsed : value
  } catch {
    return value
  }
}

function isLight(): boolean {
  return document.documentElement.dataset['theme'] === 'light'
}

/**
 * Deterministic slice palette: Okabe-Ito hues tuned per theme (azure,
 * amber, green, purple, vermillion, gold, blue — colour-blind safe).
 * Hex is baked in because zrender cannot evaluate OKLCH tokens, and the
 * two ramps need opposite label ink: white on the light ramp, dark on
 * the bright dark-mode ramp (both verified >= 4.5:1).
 */
const SERIES_RAMPS = {
  light: ['#006495', '#7d4800', '#00603d', '#82427d', '#933125', '#5f4f00', '#3a59a4'],
  dark: ['#5eade2', '#d28b3e', '#24af76', '#ce89c8', '#e47a6a', '#aa943d', '#7ea2f4'],
} as const

export function seriesColor(index: number): string {
  const ramp = isLight() ? SERIES_RAMPS.light : SERIES_RAMPS.dark
  return ramp[index % ramp.length] ?? ramp[0]
}

/** Ink for labels drawn on top of a series colour (AA on both themes). */
export function seriesLabelColor(): string {
  return isLight() ? '#ffffff' : cssVar('--color-bg')
}

/** Ink for labels on neutral "free" slices: the inverse of series ink. */
export function dimLabelColor(): string {
  return isLight() ? cssVar('--color-text') : '#ffffff'
}

export function textColor(): string {
  return cssVar('--color-text')
}

export function mutedColor(): string {
  return cssVar('--color-text-muted')
}

export function surfaceColor(): string {
  return cssVar('--color-surface')
}

/** Colour for "remaining/free" slices: deliberately neutral. */
export function dimColor(): string {
  return cssVar('--color-border-strong')
}

/** Mount (or update) the chart living inside `host`. */
export function renderChart(host: HTMLElement, factory: OptionFactory): void {
  factories.set(host, factory)
  // Hidden hosts (inactive view, jsdom tests) have no size: skip until a
  // refresh runs while the container is actually visible.
  if (host.clientWidth === 0 || host.clientHeight === 0) return
  try {
    const chart: EChartsType = echarts.getInstanceByDom(host) ?? echarts.init(host, undefined, {
      renderer: 'svg',
    })
    chart.setOption(factory(), true)
  } catch {
    // No rendering engine available (tests): leave the container empty.
  }
}

/** Dispose the chart of a container that is about to be discarded. */
export function clearChart(host: HTMLElement): void {
  factories.delete(host)
  try {
    echarts.getInstanceByDom(host)?.dispose()
  } catch {
    // nothing to dispose
  }
}

/**
 * Rebuild every live chart: resize (views start hidden with width 0) and
 * re-apply the factory so colours and labels follow theme/language.
 */
export function refreshCharts(): void {
  for (const [host, factory] of factories) {
    if (!host.isConnected) {
      factories.delete(host)
      continue
    }
    try {
      const chart = echarts.getInstanceByDom(host)
      if (!chart) {
        renderChart(host, factory)
        continue
      }
      chart.resize()
      chart.setOption(factory(), true)
    } catch {
      // keep going: one broken chart must not break the others
    }
  }
}

let refreshPending = false

/** Coalesce chart rebuilds onto the next animation frame. */
export function scheduleRefresh(): void {
  if (refreshPending) return
  refreshPending = true
  const run = (): void => {
    refreshPending = false
    refreshCharts()
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run)
  else run()
}

if (typeof window !== 'undefined') {
  let resizePending = false
  window.addEventListener('resize', () => {
    if (resizePending) return
    resizePending = true
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        resizePending = false
        refreshCharts()
      })
    } else {
      resizePending = false
      refreshCharts()
    }
  })
}
