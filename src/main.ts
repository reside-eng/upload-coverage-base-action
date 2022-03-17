import * as core from '@actions/core';
import { context } from '@actions/github';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { downloadCoverageArtifact } from './actions';
import { reportToCoveralls } from './coveralls';

/**
 *
 */
export async function run() {
  const { owner, repo } = context.repo;
  const coverageArtifact = await downloadCoverageArtifact(owner, repo);
  core.debug('Coverage artifact successfully downloaded, writing to disk');

  // Confirm coverage folder exists before writing to disk
  const coverageFolderPath = './coverage';
  const coveragePath = `${coverageFolderPath}/lcov.info`;
  if (!existsSync(coverageFolderPath)) {
    core.debug('coverage folder does not exist, creating');
    mkdirSync(coverageFolderPath);
    core.debug('coverage folder create successful');
  }

  // Write lcov.info file to coverage/lcov.info
  writeFileSync(coveragePath, Buffer.from(coverageArtifact));
  core.debug('Write to disk successful, uploading to Coveralls');

  // Report to Coveralls as base
  await reportToCoveralls();
}
