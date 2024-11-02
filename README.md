# rerun-workflows-action [![ts](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml)

This action reruns the failed workflow runs.

## Getting Started

Here is an example workflow.
When `/rerun` is commented on a pull request, this action reruns the failed workflow runs.

```yaml
name: rerun-workflows

on:
  issue_comment:
    types:
      - created

jobs:
  rerun:
    if: github.event.issue.pull_request && github.event.comment.body == '/rerun'
    runs-on: ubuntu-latest
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

## Specification

### Inputs

| Name    | Default    | Description                          |
| ------- | ---------- | ------------------------------------ |
| `event` | (required) | Event name of workflow runs to rerun |
| `sha`   | (required) | Commit SHA of workflow runs to rerun |

### Outputs

| Name                  | Description                       |
| --------------------- | --------------------------------- |
| `workflow-runs-count` | The number of rerun workflow runs |
