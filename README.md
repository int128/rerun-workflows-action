# rerun-workflows-action [![ts](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml)

This action finds the failed workflow runs and reruns them.

## Getting Started

GitHub Actions does not provide a way to rerun the failed workflow runs of a pull request.
We need to open the failed workflow runs and click the **Re-run failed jobs** button for each workflow run.

The below workflow reruns the failed workflow runs when `/rerun` is commented on a pull request.

```yaml
# When `/rerun` is commented on a pull request, rerun the failed workflow runs.
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

For example, you created a pull request and the following workflows are triggered:

- :white_check_mark: `microservice1-test`
- :x: `microservice2-test`
- :white_check_mark: `microservice3-test`
- :x: `microservice4-test`
- :white_check_mark: `microservice5-test`

When you comment `/rerun` on the pull request, this action reruns the failed workflow runs `microservice2-test` and `microservice4-test`.

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
