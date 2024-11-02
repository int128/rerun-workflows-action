import * as core from '@actions/core'
import * as github from '@actions/github'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run(
    {
      sha: core.getInput('sha', { required: true }),
      event: core.getInput('event', { required: true }),
      token: core.getInput('token', { required: true }),
    },
    {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    },
  )
  core.setOutput('workflow-runs-count', outputs.workflowRunsCount)
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
