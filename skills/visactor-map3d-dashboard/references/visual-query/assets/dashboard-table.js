/* CSS is the palette authority; this adapter resolves its tokens for Canvas. */
window.DashboardTable = (() => {
  let library
  function load() {
    if (window.VTable?.ListTable) return Promise.resolve(window.VTable)
    if (!library)
      library = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        const fail = () => {
          clearTimeout(timer)
          script.remove()
          library = undefined
          reject(new Error('明细模块加载失败，请重试'))
        }
        const timer = setTimeout(fail, 30000)
        script.src = 'https://cdn.jsdelivr.net/npm/@visactor/vtable@1.23.1/dist/vtable.min.js'
        script.onload = () => {
          clearTimeout(timer)
          if (window.VTable?.ListTable) resolve(window.VTable)
          else fail()
        }
        script.onerror = fail
        document.head.append(script)
      })
    return library
  }
  function readTokens(host) {
    const style = getComputedStyle(host)
    const probe = document.createElement('span')
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
    host.append(probe)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const color = (name) => {
      // Resolve var()/color-mix() in the host, then normalize to VRender-compatible RGBA.
      probe.style.color = `var(${name})`
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = getComputedStyle(probe).color
      context.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`
    }
    try {
      return {
        color,
        number: (name) => parseFloat(style.getPropertyValue(name)),
        fontFamily: style.getPropertyValue('--font-ui').trim(),
        dispose: () => probe.remove(),
      }
    } catch (error) {
      probe.remove()
      throw error
    }
  }
  const animation = () =>
    matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { type: 'all', duration: 220, delay: 0 }
  function options(base, host) {
    const tokens = readTokens(host)
    try {
      const color = tokens.color
      const normal = color('--table-body')
      const stripe = color('--table-stripe')
      const divider = color('--table-divider')
      const hover = {
        cellBgColor: color('--table-hover'),
        inlineRowBgColor: color('--table-hover-row'),
        inlineColumnBgColor: color('--table-canvas'),
      }
      const common = {
        fontFamily: tokens.fontFamily,
        fontSize: tokens.number('--table-font-size'),
        color: color('--table-text'),
        padding: [10, 12, 10, 12],
        borderColor: divider,
        borderLineWidth: [0, 0, 1, 0],
      }
      return {
        ...base,
        columns: base.columns.map((column) => ({
          ...column,
          headerStyle: { ...column.headerStyle, textAlign: column.style?.textAlign || 'left' },
        })),
        autoFillWidth: true,
        autoWrapText: false,
        heightMode: 'standard',
        defaultRowHeight: tokens.number('--table-row-height'),
        defaultHeaderRowHeight: tokens.number('--table-header-height'),
        hover: { highlightMode: 'row' },
        select: { highlightMode: 'row', headerSelectMode: 'cell' },
        animationAppear: animation(),
        theme: {
          underlayBackgroundColor: color('--table-canvas'),
          defaultStyle: common,
          bodyStyle: {
            ...common,
            bgColor: ({ row, table }) => ((row - table.columnHeaderLevelCount) % 2 ? stripe : normal),
            hover,
          },
          headerStyle: {
            ...common,
            fontSize: tokens.number('--table-header-font-size'),
            fontWeight: 600,
            color: color('--table-header-text'),
            bgColor: color('--table-header'),
            hover,
          },
          selectionStyle: {
            cellBorderLineWidth: tokens.number('--table-selection-width'),
            cellBorderColor: color('--table-selected-border'),
            cellBgColor: color('--table-selected'),
            inlineRowBgColor: color('--table-selected-row'),
            inlineColumnBgColor: color('--table-canvas'),
            selectionFillMode: 'overlay',
          },
          frameStyle: {
            borderColor: color('--table-frame'),
            borderLineWidth: 1,
            cornerRadius: tokens.number('--table-radius'),
          },
          scrollStyle: {
            visible: 'scrolling',
            hoverOn: true,
            width: 5,
            scrollSliderCornerRadius: 3,
            scrollSliderColor: color('--table-scroll-thumb'),
            scrollRailColor: color('--table-scroll-rail'),
          },
          columnResize: { lineColor: color('--table-selected-border'), lineWidth: 1 },
        },
      }
    } finally {
      tokens.dispose()
    }
  }
  function overview(Builder, columns, rows, host) {
    const records = rows.map((values) => Object.fromEntries(values.map((value, index) => [`c${index}`, value ?? '—'])))
    const dimensions = columns.map((alias, index) => ({ id: `c${index}`, alias, encoding: 'column' }))
    const base = records.length
      ? Builder.from({ chartType: 'table', dataset: records, dimensions, measures: [] }).build()
      : { records, columns: dimensions.map(({ id, alias }) => ({ field: id, title: alias })) }
    base.columns = columns.map((title, index) => ({
      ...base.columns.find((column) => column.field === `c${index}`),
      field: `c${index}`,
      title,
      width: index === 0 ? 170 : Math.max(130, Math.min(210, title.length * 12 + 24)),
      style: { textAlign: index === 0 ? 'left' : 'right' },
    }))
    base.widthMode = 'standard'
    const resolved = options(base, host)
    host.style.height = `${Math.min(
      parseFloat(getComputedStyle(host).getPropertyValue('--table-overview-max-height')),
      resolved.defaultHeaderRowHeight + Math.max(1, rows.length) * resolved.defaultRowHeight + 2,
    )}px`
    return resolved
  }
  function setRecords(table, records, { animate = true } = {}) {
    table.clearSelected()
    table.options.animationAppear = animate ? animation() : false
    table.setRecords(records)
  }
  return { load, options, overview, setRecords }
})()
