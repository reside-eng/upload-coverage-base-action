<!-- Replace this title and any other reference to `template-library` with
the UI library's name – i.e. fastify-tools -->

<div align="center">
   <h1>@side/upload-coverage-base-action</h1>
   <!-- TODO: Replace with actual description of the UI application -->
   <div>Custom github action for uploading base branch coverage on pull_request close event (instead of default branch push)</div>
   </br>
</div>

<div align="center">

   <!-- TODO: Uncomment package specific badges below -->
   <!-- [![NPM version][npm-image]][npm-url]
   [![License][license-image]][license-url] -->

[![Build Status][build-status-image]][build-status-url]
[![semantic-release][semantic-release-icon]][semantic-release-url]
[![Code Style][code-style-image]][code-style-url]

</div>

This is the template repository for creating additional Next.js UI applications.
Once a new repository has been created off this template, follow the steps below
to finalize the initial setup process:

1. Replace all references of `template-library` with the name of this application
1. Create a new file starting your functionality using `src/placeholder.ts` and `src/placeholder.test.ts` as an example
1. Remove `src/placeholder.ts` and `src/placeholder.test.ts` files
1. Find all relevant `TODO:` references and make adjustments accordingly
1. Set general repository settings:
   a. Only allow squash and merge
   a. Allow auto-merge
   a. Allow deletion of head branches
1. Manage access to the repo by adding the teams that need permissions. This is required for automatic PR review assignment.
1. Set branch permissions for `main` to set required PR verifications for CI
1. Start making PRs with basic functionality - continue to next section once library is publishable

## Enable Publishing

1. Add your new repository to the repositories with access to [`NPM_PUBLISH_TOKEN` org level secret](https://github.com/organizations/reside-eng/settings/secrets/actions/NPM_PUBLISH_TOKEN)
1. Create a PR removing `if: ${{ false }}` from release workflow
1. Merge above mentioned PR to create first release - this will take a while since all PRs up until this first release will be marked as released by semantic-release

[npm-image]: https://img.shields.io/npm/v/@side/template-library.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@side/template-library
[build-status-image]: https://img.shields.io/github/workflow/status/reside-eng/template-library/Release?style=flat-square
[build-status-url]: https://github.com/reside-eng/template-library/actions
[license-image]: https://img.shields.io/npm/l/@side/template-library.svg?style=flat-square
[license-url]: https://github.com/reside-eng/template-library/blob/main/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-airbnb-blue.svg?style=flat-square
[code-style-url]: https://github.com/airbnb/javascript
[semantic-release-icon]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release
