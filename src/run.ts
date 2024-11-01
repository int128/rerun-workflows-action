import * as core from '@actions/core'
import * as github from './github.js'

type Inputs = {
  sha: string
  event: string
  owner: string
  repo: string
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const octokit = github.getOctokit(inputs.token)

  core.info(`Fetching the failed workflow runs for ${inputs.owner}/${inputs.repo}/${inputs.event}@${inputs.sha}`)
  const workflowRuns = await octokit.paginate(octokit.rest.actions.listWorkflowRunsForRepo, {
    owner: inputs.owner,
    repo: inputs.repo,
    head_sha: inputs.sha,
    event: inputs.event,
    status: 'failure',
    per_page: 100,
  })

  core.summary.addTable([
    [
      { data: 'Workflow', header: true },
      { data: 'Conclusion', header: true },
      { data: 'Status', header: true },
      { data: 'Attempt', header: true },
    ],
    ...workflowRuns.map((workflowRun) => [
      `[${workflowRun.name ?? '-'}](${workflowRun.html_url})`,
      workflowRun.conclusion ?? '-',
      workflowRun.status ?? '-',
      workflowRun.run_attempt?.toString() ?? '-',
    ]),
  ])
  await core.summary.write()

  for (const workflowRun of workflowRuns) {
    core.info(`Re-running failed workflow run: ${workflowRun.html_url}`)
    await octokit.rest.actions.reRunWorkflowFailedJobs({
      owner: inputs.owner,
      repo: inputs.repo,
      run_id: workflowRun.id,
    })
  }
}
