import * as core from '@actions/core';
import Coveralls from 'coveralls-api';

/**
 * @param owner - Github repo owner
 * @param repo - Github repo name
 */
export async function reportToCoveralls(owner: string, repo: string) {
  core.debug('Uploading base coverage to Coveralls');
  try {
    const coveralls = new Coveralls(process.env.COVERALLS_API_TOKEN);
    await coveralls.postJob('github', owner, repo, {
      lcov_path: 'coverage/lcov.info',
      git: {
        branch: 'main',
      },
    });
    core.info('Successfully uploaded base coverage to Coveralls');
  } catch (err) {
    core.error(`Error uploading lcov to Coveralls: ${JSON.stringify(err)}`);
    throw err;
  }
}
