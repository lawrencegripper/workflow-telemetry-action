/**
 * Chartcuterie configuration for workflow telemetry charts
 */

const CHART_WIDTH = 1000
const CHART_HEIGHT = 500

function buildBaseOption(data, stacked) {
  const gridColor = pickGridColor(data.axisColor)

  return {
    backgroundColor: 'transparent',
    title: {
      text: data.label,
      textStyle: {
        color: data.axisColor
      }
    },
    legend: {
      textStyle: {
        color: data.axisColor
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'time',
      name: 'Time',
      nameTextStyle: {
        color: data.axisColor
      },
      axisLine: {
        lineStyle: {
          color: data.axisColor
        }
      },
      axisLabel: {
        color: data.axisColor
      },
      splitLine: {
        lineStyle: {
          color: gridColor
        }
      }
    },
    yAxis: {
      type: 'value',
      name: data.label,
      nameTextStyle: {
        color: data.axisColor
      },
      axisLine: {
        lineStyle: {
          color: data.axisColor
        }
      },
      axisLabel: {
        color: data.axisColor
      },
      splitLine: {
        lineStyle: {
          color: gridColor
        }
      }
    },
    animation: false
  }
}

function pickGridColor(axisColor) {
  const rgb = parseHexColor(axisColor)
  if (!rgb) {
    return 'rgba(128, 128, 128, 0.2)'
  }
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  if (brightness > 140) {
    return 'rgba(255, 255, 255, 0.25)'
  }
  return 'rgba(0, 0, 0, 0.15)'
}

function parseHexColor(color) {
  if (!color || color[0] !== '#') {
    return null
  }
  let hex = color.substring(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(ch => ch + ch)
      .join('')
  }
  if (hex.length < 6) {
    return null
  }
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  }
}

const renderConfig = {
  'telemetry:line': {
    key: 'telemetry:line',
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    getOption: data => {
      const baseOption = buildBaseOption(data, false)
      return {
        ...baseOption,
        series: [
          {
            name: data.line.label,
            type: 'line',
            data: data.line.points.map(p => [p.x, p.y]),
            lineStyle: {
              color: data.line.color,
              width: 2
            },
            itemStyle: {
              color: data.line.color
            },
            showSymbol: false,
            smooth: 0.3
          }
        ]
      }
    }
  },
  'telemetry:stacked-area': {
    key: 'telemetry:stacked-area',
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    getOption: data => {
      const baseOption = buildBaseOption(data, true)
      return {
        ...baseOption,
        series: data.areas.map((area, index) => ({
          name: area.label,
          type: 'line',
          stack: 'total',
          areaStyle: {
            color: area.color
          },
          data: area.points.map(p => [p.x, p.y]),
          lineStyle: {
            color: area.color,
            width: 1
          },
          itemStyle: {
            color: area.color
          },
          showSymbol: false,
          smooth: 0.3
        }))
      }
    }
  }
}

const config = {
  renderConfig,
  version: '1.0.0'
}

module.exports = config
