# rerun-workflows-action [![ts](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/rerun-workflows-action/actions/workflows/ts.yaml)

This action reruns the workflow runs of the current commit SHA.

## Getting Started

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: int128/rerun-workflows-action@v1
        with:
          event: pull_request
          sha: ${{ github.event.pull_request.head.sha || github.sha }}
```

### Inputs

| Name    | Default    | Description                          |
| ------- | ---------- | ------------------------------------ |
| `event` | (required) | Event name of workflow runs to rerun |
| `sha`   | (required) | Commit SHA of workflow runs to rerun |

### Outputs

None.
