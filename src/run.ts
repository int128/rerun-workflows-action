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
    return await rerunFailedWorkflowRuns(inputs, octokit, context)
  }

  if ('pull_request' in context.payload) {
    return await rerunFailedWorkflowRuns(
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
    return await rerunFailedWorkflowRuns(
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

const rerunFailedWorkflowRuns = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<Outputs> => {
  const workflowRuns = await findWorkflowRunsForRerun(inputs, octokit, context)
  if (workflowRuns.length === 0) {
    return { workflowRunsCount: 0 }
  }

  const rerunWorkflowRuns = []
  for (const workflowRun of workflowRuns) {
    core.info(`Rerunning: ${workflowRun.name}: ${workflowRun.html_url}`)
    try {
      await octokit.rest.actions.reRunWorkflowFailedJobs({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: workflowRun.id,
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        core.error(`Failed to rerun: ${error}`)
        rerunWorkflowRuns.push({ workflowRun, error })
        continue
      }
      throw error
    }
    rerunWorkflowRuns.push({ workflowRun })
  }

  core.summary.addHeading('rerun-workflow-runs-action summary', 2)
  core.summary.addTable([
    [
      { data: 'Workflow', header: true },
      { data: 'Event', header: true },
      { data: 'Conclusion', header: true },
      { data: 'Status', header: true },
      { data: 'Attempt', header: true },
      { data: 'Created at', header: true },
      { data: 'Rerun', header: true },
    ],
    ...rerunWorkflowRuns.map(({ workflowRun, error }) => [
      `<a href="${workflowRun.html_url}">${workflowRun.name ?? '-'}</a>`,
      workflowRun.event,
      workflowRun.conclusion ?? '-',
      workflowRun.status ?? '-',
      workflowRun.run_attempt?.toString() ?? '-',
      new Date(workflowRun.created_at).toISOString(),
      error ? `❌ ${error}` : `✅`,
    ]),
  ])
  await core.summary.write()

  const errors = rerunWorkflowRuns.filter(({ error }) => error)
  if (errors.length > 0) {
    throw new Error(
      `Failed to rerun some workflow runs. ` +
        `See ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId} for details.`,
    )
  }
  return {
    workflowRunsCount: workflowRuns.length,
  }
}

const findWorkflowRunsForRerun = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  core.info(`Finding the failed workflow runs for commit ${inputs.sha} and event ${inputs.event}`)
  const failedWorkflowRuns = await octokit.paginate(octokit.rest.actions.listWorkflowRunsForRepo, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    head_sha: inputs.sha,
    event: inputs.event,
    status: 'failure',
    exclude_pull_requests: true,
    per_page: 100,
  })
  core.startGroup(`Found ${failedWorkflowRuns.length} failed workflow runs`)
  for (const workflowRun of failedWorkflowRuns) {
    core.info(`- ${workflowRun.name}: ${workflowRun.html_url}: ${workflowRun.conclusion ?? '-'}: ${workflowRun.status}`)
  }
  core.endGroup()

  core.info(`Finding the cancelled workflow runs for commit ${inputs.sha} and event ${inputs.event}`)
  const cancelledWorkflowRuns = await octokit.paginate(octokit.rest.actions.listWorkflowRunsForRepo, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    head_sha: inputs.sha,
    event: inputs.event,
    status: 'cancelled',
    exclude_pull_requests: true,
    per_page: 100,
  })
  core.startGroup(`Found ${cancelledWorkflowRuns.length} cancelled workflow runs`)
  for (const workflowRun of cancelledWorkflowRuns) {
    core.info(`- ${workflowRun.name}: ${workflowRun.html_url}: ${workflowRun.conclusion ?? '-'}: ${workflowRun.status}`)
  }
  core.endGroup()

  // Avoid re-running the current workflow to prevent an infinite loop.
  return [...failedWorkflowRuns, ...cancelledWorkflowRuns].filter(
    (workflowRun) => workflowRun.name !== context.workflow,
  )
}
