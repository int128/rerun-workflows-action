import * as core from '@actions/core'
import * as github from '@actions/github'
import { run } from './run.js'

const main = async (): Promise<void> => {
  await run({
    sha: core.getInput('sha', { required: true }),
    event: core.getInput('event', { required: true }),
    token: core.getInput('token', { required: true }),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  })
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
