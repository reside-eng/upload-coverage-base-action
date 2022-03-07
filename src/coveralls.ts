import * as core from '@actions/core';
import Coveralls from 'coveralls-api';

/**
 * @param owner - Github repo owner
 * @param repo - Github repo name
 * @param branch
 */
export async function reportToCoveralls(
  owner: string,
  repo: string,
  branch: string,
) {
  core.debug(`Uploading base coverage to Coveralls for branch "${branch}"`);
  try {
    const coveralls = new Coveralls(core.getInput('coveralls-token'));
    await coveralls.postJob('github', owner, repo, {
      lcov_path: core.getInput('lcov-path'),
      git: {
        branch,
      },
    });
    core.info('Successfully uploaded base coverage to Coveralls');
  } catch (err) {
    core.error(`Error uploading lcov to Coveralls: ${JSON.stringify(err)}`);
    throw err;
  }
}
