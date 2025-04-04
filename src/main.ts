import * as core from '@actions/core'
import { run } from './run.js'
import { getContext, getOctokit } from './github.js'

const main = async () => {
  const outputs = await run(
    {
      sha: core.getInput('sha', { required: true }),
      event: core.getInput('event', { required: true }),
      token: core.getInput('token', { required: true }),
    },
    getOctokit(),
    getContext(),
  )
  core.setOutput('workflow-runs-count', outputs.workflowRunsCount)
}

await main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
