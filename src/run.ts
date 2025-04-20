import * as core from '@actions/core'
import { Context } from './github.js'
import { Octokit } from '@octokit/action'

type Inputs = {
  sha: string
  event: string
}

type Outputs = {
  workflowRunsCount: number
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<Outputs> => {
  if (inputs.sha && inputs.event) {
    return await rerunFailedWorkflows(inputs, octokit, context)
  }

  if ('pull_request' in context.payload) {
    return await rerunFailedWorkflows(
      {
        event: 'pull_request',
        sha: context.payload.pull_request.head.sha,
      },
      octokit,
      context,
    )
  }

  if ('issue' in context.payload && context.payload.issue.pull_request) {
    core.info(`Finding the pull request #${context.payload.issue.number}`)
    const { data: pull } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.issue.number,
    })
    return await rerunFailedWorkflows(
      {
        event: 'pull_request',
        sha: pull.head.sha,
      },
      octokit,
      context,
    )
  }

  core.info(`Do nothing for the current event`)
  return { workflowRunsCount: 0 }
}

const rerunFailedWorkflows = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<Outputs> => {
  core.info(
    `Finding the failed workflow runs for ${context.repo.owner}/${context.repo.repo}@${inputs.sha}:${inputs.event}`,
  )
  const workflowRuns = await octokit.paginate(octokit.rest.actions.listWorkflowRunsForRepo, {
    owner: context.repo.owner,
    repo: context.repo.repo,
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
    // Avoid re-running the current workflow to prevent an infinite loop.
    if (workflowRun.name === context.workflow) {
      continue
    }

    core.info(`Re-running failed workflow run: ${workflowRun.html_url}`)
    await octokit.rest.actions.reRunWorkflowFailedJobs({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: workflowRun.id,
    })
  }

  return {
    workflowRunsCount: workflowRuns.length,
  }
}
