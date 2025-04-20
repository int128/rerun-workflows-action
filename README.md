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
      - uses: int128/rerun-workflows-action@v0
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
      - uses: int128/label-action@v1
        with:
          remove-labels: ${{ github.event.label.name }}
```

## Specification

This action finds the failed workflow runs on the specified event and commit.
For example, there are the following workflow runs,

- :white_check_mark: `microservice1-test`
- :x: `microservice2-test`
- :white_check_mark: `microservice3-test`
- :x: `microservice4-test`
- :white_check_mark: `microservice5-test`

this action reruns `microservice2-test` and `microservice4-test`.

### Inputs

| Name    | Default | Description                          |
| ------- | ------- | ------------------------------------ |
| `event` | -       | Event name of workflow runs to rerun |
| `sha`   | -       | Commit SHA of workflow runs to rerun |

If `event` and `sha` are not specified, this action infers the event and commit as follows:

- When this action is run on a pull request, it finds the workflow runs triggered by the pull request.
- Otherwise, it does nothing.

### Outputs

| Name                  | Description                       |
| --------------------- | --------------------------------- |
| `workflow-runs-count` | The number of rerun workflow runs |
