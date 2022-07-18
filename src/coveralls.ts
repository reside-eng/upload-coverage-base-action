import * as core from '@actions/core';
import { context } from '@actions/github';
import Coveralls, { PostJobFromLCOVArgs, PostJobResponse } from 'coveralls-api';

type ActualPostJobResponse = (PostJobResponse & { error: boolean }) | null;

/**
 * Report coverage to Coveralls for base branch
 *
 * @param lcovPath - Path to lcov file
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
  core.info(
    `Uploading base coverage to Coveralls with settings: ${JSON.stringify(
      jobSettings,
      null,
      2,
    )}`,
  );
  try {
    const coveralls = new Coveralls(
      core.getInput('coveralls-token', { required: true }),
    );
    const response = (await coveralls.postJob(
      'github',
      owner,
      repo,
      jobSettings,
    )) as ActualPostJobResponse;
    core.info(`Response from coveralls: ${JSON.stringify(response)}`);
    // Casting is because current library types are incorrect about error not being on response
    if (response?.error) {
      throw new Error(response.message);
    }
    core.info(
      `Successfully uploaded base coverage to Coveralls for branch "${branch}". Coveralls URL: ${response?.url}`,
    );
    core.setOutput('coverage-url', response?.url);
  } catch (err) {
    const error = err as Error;
    core.error(`Error uploading lcov to Coveralls: ${error.message}`);
    throw err;
  }
}
