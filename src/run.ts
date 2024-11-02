import * as core from '@actions/core'
import * as github from './github.js'

type Inputs = {
  sha: string
  event: string
  token: string
}

export const run = async (inputs: Inputs, context: github.Context): Promise<void> => {
  const octokit = github.getOctokit(inputs.token)

  core.info(`Fetching the failed workflow runs for ${context.owner}/${context.repo}@${inputs.sha}:${inputs.event}`)
  const workflowRuns = await octokit.paginate(octokit.rest.actions.listWorkflowRunsForRepo, {
    owner: context.owner,
    repo: context.repo,
    head_sha: inputs.sha,
    event: inputs.event,
    status: 'failure',
    exclude_pull_requests: true,
    per_page: 100,
  })
  core.info(`Found ${workflowRuns.length} failed workflow runs`)

  core.summary.addHeading('Workflow runs')
  core.summary.addTable([
    [
      { data: 'Workflow', header: true },
      { data: 'Event', header: true },
      { data: 'Conclusion', header: true },
      { data: 'Status', header: true },
      { data: 'Attempt', header: true },
      { data: 'Created at', header: true },
      { data: 'Updated at', header: true },
    ],
    ...workflowRuns.map((workflowRun) => [
      `<a href="${workflowRun.html_url}">${workflowRun.name ?? '-'}</a>`,
      workflowRun.event,
      workflowRun.conclusion ?? '-',
      workflowRun.status ?? '-',
      workflowRun.run_attempt?.toString() ?? '-',
      new Date(workflowRun.created_at).toISOString(),
      new Date(workflowRun.updated_at).toISOString(),
    ]),
  ])
  await core.summary.write()

  for (const workflowRun of workflowRuns) {
    core.info(`Re-running failed workflow run: ${workflowRun.html_url}`)
    await octokit.rest.actions.reRunWorkflowFailedJobs({
      owner: context.owner,
      repo: context.repo,
      run_id: workflowRun.id,
    })
  }
}
