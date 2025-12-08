import { ChartConfiguration, ChartDataset, ChartOptions } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import 'chartjs-adapter-date-fns'
import { LineGraphOptions, StackedAreaGraphOptions } from './interfaces'

const CHART_WIDTH = 1000
const CHART_HEIGHT = 500

type XYPoint = { x: number; y: number }

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: CHART_WIDTH,
  height: CHART_HEIGHT,
  backgroundColour: 'transparent',
  chartCallback: ChartJS => {
    ChartJS.defaults.font.family = 'Arial'
    ChartJS.defaults.font.size = 12
    ChartJS.defaults.animation = false
  }
})

export async function renderLineChart(
  options: LineGraphOptions
): Promise<string> {
  const datasets: ChartDataset<'line', XYPoint[]>[] = [
    {
      label: options.line.label,
      data: buildPointSet(options.line.points),
      borderColor: options.line.color,
      backgroundColor: options.line.color,
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      spanGaps: true,
      tension: 0.3
    }
  ]

  const configuration: ChartConfiguration<'line', XYPoint[]> = {
    type: 'line',
    data: { datasets },
    options: buildBaseOptions(options.label, options.axisColor, false)
  }

  return chartJSNodeCanvas.renderToDataURL(configuration)
}

export async function renderStackedAreaChart(
  options: StackedAreaGraphOptions
): Promise<string> {
  const datasets: ChartDataset<'line', XYPoint[]>[] = options.areas.map(
    area => ({
      label: area.label,
      data: buildPointSet(area.points),
      borderColor: area.color,
      backgroundColor: area.color,
      fill: true,
      borderWidth: 1,
      pointRadius: 0,
      spanGaps: true,
      tension: 0.3
    })
  )

  const configuration: ChartConfiguration<'line', XYPoint[]> = {
    type: 'line',
    data: { datasets },
    options: buildBaseOptions(options.label, options.axisColor, true)
  }

  return chartJSNodeCanvas.renderToDataURL(configuration)
}

function buildPointSet(points: { x: number; y: number }[]): XYPoint[] {
  return points.map(point => ({ x: point.x, y: point.y }))
}

function buildBaseOptions(
  label: string,
  axisColor: string,
  stacked: boolean
): ChartOptions<'line'> {
  const gridColor = pickGridColor(axisColor)

  return {
    responsive: false,
    maintainAspectRatio: false,
    parsing: false,
    plugins: {
      legend: {
        labels: {
          color: axisColor
        }
      },
      title: {
        display: true,
        text: label,
        color: axisColor
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: {
        type: 'time',
        grid: {
          color: gridColor
        },
        ticks: {
          color: axisColor,
          autoSkip: true,
          maxTicksLimit: 10
        },
        title: {
          display: true,
          text: 'Time',
          color: axisColor
        }
      },
      y: {
        beginAtZero: true,
        stacked,
        grid: {
          color: gridColor
        },
        ticks: {
          color: axisColor
        },
        title: {
          display: true,
          text: label,
          color: axisColor
        }
      }
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
        capBezierPoints: true
      }
    }
  }
}

function pickGridColor(axisColor: string): string {
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

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
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
