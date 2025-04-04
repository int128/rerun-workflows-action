# rerun-workflows-action [![ts](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml)

This action reruns the failed workflow runs.

## Motivation

GitHub does not provide an easy way to rerun the failed workflow runs.
We need to open each workflow run and click the **Re-run failed jobs** button.

## Getting started

### Trigger the rerun by a comment

The below example reruns the failed workflow runs when `/rerun` is commented on a pull request.

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

### Trigger the rerun by a label

The below example reruns the failed workflow runs when `/rerun` label is added to a pull request.

```yaml
# When `/rerun` label is added to a pull request, rerun the failed workflow runs.
name: rerun-by-label

on:
  pull_request:
    types:
      - labeled

jobs:
  rerun-workflows:
    if: github.event.label.name == '/rerun'
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
      - uses: int128/label-action@v1
        with:
          remove-labels: ${{ github.event.label.name }}
```

## Specification

This action finds the failed workflow runs on the target event and commit.

For example, there are the following workflow runs on the target commit,

- :white_check_mark: `microservice1-test`
- :x: `microservice2-test`
- :white_check_mark: `microservice3-test`
- :x: `microservice4-test`
- :white_check_mark: `microservice5-test`

this action reruns `microservice2-test` and `microservice4-test`.

### Inputs

| Name    | Default    | Description                          |
| ------- | ---------- | ------------------------------------ |
| `event` | (required) | Event name of workflow runs to rerun |
| `sha`   | (required) | Commit SHA of workflow runs to rerun |

### Outputs

| Name                  | Description                       |
| --------------------- | --------------------------------- |
| `workflow-runs-count` | The number of rerun workflow runs |
