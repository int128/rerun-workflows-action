import * as core from '@actions/core'
import { getContext, getOctokit } from './github.js'
import { run } from './run.js'

const main = async () => {
  const outputs = await run(
    {
      sha: core.getInput('sha'),
      event: core.getInput('event'),
    },
    getOctokit(),
    await getContext(),
  )
  core.setOutput('workflow-runs-count', outputs.workflowRunsCount)
  core.setOutput('rerun-success-count', outputs.rerunSuccessCount)
  core.setOutput('rerun-failure-count', outputs.rerunFailureCount)
}

try {
  await main()
} catch (e: unknown) {
  core.setFailed(e instanceof Error ? e : String(e))
  console.error(e)
}
