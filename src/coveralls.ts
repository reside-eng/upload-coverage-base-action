import * as core from '@actions/core';
import { context } from '@actions/github';
import Coveralls, { PostJobFromLCOVArgs, PostJobResponse } from 'coveralls-api';

type ActualPostJobResponse = PostJobResponse & { error: boolean };

/**
 * Report coverage to Coveralls for base branch
 *
 * @param lcovPath
 */
export async function reportToCoveralls(lcovPath: string) {
  const { owner, repo } = context.repo;
  const { ref: baseRef } = context?.payload?.pull_request?.base || {};
  const branch = core.getInput('base-branch') || baseRef || 'main';
  const flag = core.getInput('flag-name') || undefined; // default empty string to undefined
  const jobSettings: PostJobFromLCOVArgs = {
    lcov_path: lcovPath,
    flag_name: flag,
    // service_job_id: `${context.runId}`,
    // service_name: 'github', // Causes "Couldn't find a repository matching this job."
    // commit_sha: context.sha,
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
    const response = await coveralls.postJob(
      'github',
      owner,
      repo,
      jobSettings,
    );
    core.debug(`Response from coveralls: ${JSON.stringify(response)}`);
    // Casting is because current library types are incorrect about error not being on response
    if ((response as ActualPostJobResponse).error) {
      throw new Error(response.message);
    }
    core.info(
      `Successfully uploaded base coverage to Coveralls for branch "${branch}": ${response.url}`,
    );
    core.setOutput('coverage_url', response.url);
  } catch (err) {
    core.error(`Error uploading lcov to Coveralls: ${JSON.stringify(err)}`);
    throw err;
  }
}
