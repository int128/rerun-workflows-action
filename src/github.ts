import assert from 'node:assert'
import fs from 'node:fs/promises'
import { Octokit } from '@octokit/action'
import { retry } from '@octokit/plugin-retry'
import type { WebhookEvent } from '@octokit/webhooks-types'

export const getOctokit = () => new (Octokit.plugin(retry))()

export type Context = {
  repo: {
    owner: string
    repo: string
  }
  workflow: string
  runId: number
  serverUrl: string
  payload: WebhookEvent
}

export const getContext = async (): Promise<Context> => {
  // https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
  return {
    repo: getRepo(),
    workflow: getEnv('GITHUB_WORKFLOW'),
    runId: Number.parseInt(getEnv('GITHUB_RUN_ID'), 10),
    serverUrl: getEnv('GITHUB_SERVER_URL'),
    payload: JSON.parse(await fs.readFile(getEnv('GITHUB_EVENT_PATH'), 'utf-8')) as WebhookEvent,
  }
}

const getRepo = () => {
  const [owner, repo] = getEnv('GITHUB_REPOSITORY').split('/')
  return { owner, repo }
}

const getEnv = (name: string): string => {
  assert(process.env[name], `${name} is required`)
  return process.env[name]
}
