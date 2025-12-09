import * as exec from '@actions/exec'
import * as path from 'path'
import axios, { isAxiosError } from 'axios'
import { LineGraphOptions, StackedAreaGraphOptions } from './interfaces'
import * as logger from './logger'

const CHARTCUTERIE_IMAGE = 'ghcr.io/getsentry/chartcuterie:latest'
const CHARTCUTERIE_PORT = 9090
const CHARTCUTERIE_URL = `http://localhost:${CHARTCUTERIE_PORT}/render`

// Get the action's root directory (one level up from lib/ or src/)
const ACTION_DIR = path.resolve(__dirname, '..')

let chartcuterieStarted = false
let containerName: string | null = null

async function ensureChartcuterieRunning(): Promise<void> {
  if (chartcuterieStarted) {
    return
  }

  containerName = `chartcuterie-${Date.now()}`
  const configPath = path.join(ACTION_DIR, 'chartcuterie', 'chartConfig.js')

  logger.info(`Starting chartcuterie container: ${containerName}`)
  logger.debug(`Using config from: ${configPath}`)

  // Pull the image first
  await exec.exec('docker', ['pull', CHARTCUTERIE_IMAGE], { silent: true })

  // Start the container with the config mounted
  await exec.exec(
    'docker',
    [
      'run',
      '-d',
      '--name',
      containerName,
      '-p',
      `${CHARTCUTERIE_PORT}:9090`,
      '-v',
      `${configPath}:/config/chartConfig.js:ro`,
      CHARTCUTERIE_IMAGE,
      'server',
      '--config',
      '/config/chartConfig.js'
    ],
    { silent: true }
  )

  // Wait for the service to be ready
  await waitForService()
  chartcuterieStarted = true
}

async function waitForService(maxRetries = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(`http://localhost:${CHARTCUTERIE_PORT}/health`, {
        timeout: 1000
      })
      logger.info('Chartcuterie service is ready')
      return
    } catch {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
  throw new Error('Chartcuterie service failed to start')
}

export async function stopChartcuterie(): Promise<void> {
  if (containerName) {
    logger.info(`Stopping chartcuterie container: ${containerName}`)
    try {
      await exec.exec('docker', ['stop', containerName], { silent: true })
      await exec.exec('docker', ['rm', containerName], { silent: true })
    } catch (err) {
      logger.error(`Failed to stop chartcuterie container: ${err}`)
    }
    containerName = null
    chartcuterieStarted = false
  }
}

async function renderChart(
  style: string,
  data: LineGraphOptions | StackedAreaGraphOptions
): Promise<string> {
  await ensureChartcuterieRunning()

  const requestId = `render-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  const renderData = {
    requestId,
    style,
    data
  }

  try {
    const response = await axios.post(CHARTCUTERIE_URL, renderData, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    // Convert the image buffer to a data URL
    const base64 = Buffer.from(response.data).toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errorBody = Buffer.from(error.response.data).toString('utf-8')
      throw new Error(`Chartcuterie render failed: ${errorBody}`)
    }
    throw error
  }
}

export async function renderLineChart(
  options: LineGraphOptions
): Promise<string> {
  return renderChart('telemetry:line', options)
}

export async function renderStackedAreaChart(
  options: StackedAreaGraphOptions
): Promise<string> {
  return renderChart('telemetry:stacked-area', options)
}
