<div align="center">
   <h1>@side/upload-coverage-base-action</h1>
   <div>Custom github action for uploading base branch coverage on pull_request close event (instead of default branch push)</div>
   </br>
</div>

<div align="center">

[![Build Status][build-status-image]][build-status-url]
[![semantic-release][semantic-release-icon]][semantic-release-url]
[![Code Style][code-style-image]][code-style-url]
[![Coverage][coverage-image]][coverage-url]

</div>

## Use

An artifact should be uploaded during the verify stage so that base can be set on closed event of the PR:

**verify.yml**

```yaml
name: Verify

on:
  pull_request:
    branches:
      - develop

concurrency:
  group: verify-${{ github.head_ref }}
  cancel-in-progress: true

jobs:
  build:
    name: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2.4.0
        with:
          ref: ${{ inputs.GIT_REF }}

      - name: Use Node.js ${{ inputs.NODE_VERSION }}
        uses: actions/setup-node@v2.5.1
        with:
          node-version: ${{ inputs.NODE_VERSION }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Verify lint
        run: yarn lint

      - name: Test app
        run: yarn test:cov

      # Used in merge-main.yml workflow to upload base branch coverage once merged
      # NOTE: Temporary - planned to be replaced by custom workflow in workflow-templates
      - name: Upload coverage artifact
        uses: actions/upload-artifact@v2
        with:
          name: coverage-${{ github.event.pull_request.head.sha }}
          path: coverage/lcov.info
```

**merge-main.yml**

```yaml
name: Merge to main

on:
  pull_request:
    types: [closed]
    branches:
      - main

jobs:
  promote-deploy-prod:
    name: promote-deploy-prod
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2.4.0
        with:
          ref: ${{ inputs.GIT_REF }}

      - name: Use Node.js ${{ inputs.NODE_VERSION }}
        uses: actions/setup-node@v2.5.1
        with:
          node-version: ${{ inputs.NODE_VERSION }}
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Verify lint
        run: yarn lint

      - name: Test app
        run: yarn test:cov

      # Download coverage artifact from verify.yml workflow and send as base to Coveralls
      - name: Upload base coverage to Coveralls
        uses: reside-eng/upload-coverage-base-action@v1.0.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          coveralls-token: ${{ secrets.COVERALLS_API_TOKEN }}
```

## Inputs

| name                     | required | default                             | description                                                                                                                                                                                       |
| ------------------------ | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| github-token             | `true`   | `undefined`                         | GITHUB_TOKEN secret (for authentication with Github API)                                                                                                                                          |
| coveralls-token          | `true`   | `undefined`                         | Coveralls API token                                                                                                                                                                               |
| base-branch              | `false`  | `pull_request.head.ref \|\| 'main'` | Base branch (defaults to pull_request.head.ref falling back to "main")                                                                                                                            |
| coverage-artifact-name   | `false`  | `'coverage'`                        | Name of coverage artifact (useful for multiple artifacts). NOTE: Each workflow run has it's own artifacts, so name only has to be unique compared to orther artifacts in the single workflow run. |
| lcov-path                | `false`  | `'coverage/lcov.info'`              | Path to lcov.info file                                                                                                                                                                            |
| upload-workflow-filename | `false`  | `'verify.yml'`                      | Filename of workflow which uploaded coverage artifact                                                                                                                                             |

# FAQ

## Why Node 16?

Currently custom JS Github Actions only supports `node16` as newest [as seen in their docs](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-javascript-actions).

[build-status-image]: https://github.com/reside-eng/upload-coverage-base-action/actions/workflows/release.yml/badge.svg
[build-status-url]: https://github.com/reside-eng/upload-coverage-base-action/actions
[license-image]: https://img.shields.io/npm/l/@side/upload-coverage-base-action.svg?style=flat-square
[license-url]: https://github.com/reside-eng/upload-coverage-base-action/blob/main/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-airbnb-blue.svg?style=flat-square
[code-style-url]: https://github.com/airbnb/javascript
[semantic-release-icon]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[coverage-image]: https://coveralls.io/repos/github/reside-eng/upload-coverage-base-action/badge.svg?branch=main&t=FFVNNF
[coverage-url]: https://coveralls.io/github/reside-eng/upload-coverage-base-action?branch=main
