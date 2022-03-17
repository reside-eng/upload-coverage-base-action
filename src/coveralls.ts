import * as core from '@actions/core';
import { context } from '@actions/github';
import Coveralls, { PostJobFromLCOVArgs } from 'coveralls-api';

/**
 * Report coverage to Coveralls for base branch
 */
export async function reportToCoveralls() {
  const { owner, repo } = context.repo;
  const { ref: baseRef } = context?.payload?.pull_request?.base || {};
  const branch = core.getInput('base-branch') || baseRef || 'main';
  const flag = core.getInput('flag-name') || undefined; // default empty string to undefined
  const jobSettings: PostJobFromLCOVArgs = {
    lcov_path: core.getInput('lcov-path'),
    service_job_id: `${context.runId}`,
    service_name: 'github',
    flag_name: flag,
    commit_sha: context.sha,
    git: {
      branch,
    },
  };
  core.debug(
    `Uploading base coverage to Coveralls with settings: ${JSON.stringify(
      jobSettings,
      null,
      2,
    )}`,
  );
  try {
    const coveralls = new Coveralls(core.getInput('coveralls-token'));
    await coveralls.postJob('github', owner, repo, jobSettings);
    core.info(
      `Successfully uploaded base coverage to Coveralls for branch "${branch}"`,
    );
  } catch (err) {
    core.error(`Error uploading lcov to Coveralls: ${JSON.stringify(err)}`);
    throw err;
  }
}
