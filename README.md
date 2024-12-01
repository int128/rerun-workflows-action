# rerun-workflows-action [![ts](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml)

This action reruns the failed workflow runs.

GitHub does not provide a way to rerun the failed workflow runs of a pull request.
We need to open the failed workflow runs and click the **Re-run failed jobs** button for each workflow run.

## Getting started

### Trigger the rerun by a comment

When `/rerun` is commented on a pull request, the below workflow reruns the failed workflow runs.

```yaml
# When `/rerun` is commented on a pull request, rerun the failed workflow runs.
name: rerun-by-comment

on:
  issue_comment:
    types:
      - created

jobs:
  rerun-workflows:
    if: github.event.issue.pull_request && github.event.comment.body == '/rerun'
    runs-on: ubuntu-latest
    permissions:
      actions: write # To rerun workflows
    steps:
      - uses: actions/github-script@v7
        id: get-head-sha
        with:
          result-encoding: string
          script: |
            const { data: pull } = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.issue.number,
            })
            return pull.head.sha
      - uses: int128/rerun-workflows-action@v0
        with:
          event: pull_request
          sha: ${{ steps.get-head-sha.outputs.result }}
```

For example, you created a pull request and the following workflows are triggered:

- :white_check_mark: `microservice1-test`
- :x: `microservice2-test`
- :white_check_mark: `microservice3-test`
- :x: `microservice4-test`
- :white_check_mark: `microservice5-test`

When you comment `/rerun` on the pull request, this action reruns the failed workflow runs `microservice2-test` and `microservice4-test`.

### Trigger the rerun by a label

When `rerun` label is added to a pull request, the below workflow reruns the failed workflow runs.

```yaml
# When `rerun` label is added to a pull request, rerun the failed workflow runs.
name: rerun-by-label

on:
  pull_request:
    types:
      - labeled

jobs:
  rerun-workflows:
    if: github.event.label.name == 'rerun'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      actions: write # To rerun workflows
      pull-requests: write # To remove label
    steps:
      - uses: int128/rerun-workflows-action@v0
        with:
          event: pull_request
          sha: ${{ github.event.pull_request.head.sha }}
      - name: Remove the label
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.removeLabel({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              name: context.payload.label.name,
            })
```

## Specification

This action finds the failed workflow runs by the given event name and commit SHA.

### Inputs

| Name    | Default    | Description                          |
| ------- | ---------- | ------------------------------------ |
| `event` | (required) | Event name of workflow runs to rerun |
| `sha`   | (required) | Commit SHA of workflow runs to rerun |

### Outputs

| Name                  | Description                       |
| --------------------- | --------------------------------- |
| `workflow-runs-count` | The number of rerun workflow runs |
