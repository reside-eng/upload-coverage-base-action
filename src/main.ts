import * as core from '@actions/core';
import { context } from '@actions/github';
import { exec } from '@actions/exec';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
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
  const coveragePath = `${process.env.GITHUB_WORKSPACE}/${core.getInput(
    'lcov-path',
  )}`;
  const coverageFolder = dirname(coveragePath);
  if (!existsSync(coverageFolder)) {
    core.debug(`create coverage artifact folder at path "${coverageFolder}"`);
    mkdirSync(coverageFolder);
    core.debug('coverage folder created successfully');
  }

  // Write artifact (zip) file to coverage/lcov.info
  writeFileSync(coveragePath, Buffer.from(coverageArtifact));
  core.info(
    `Coverage artifact written to disk at path "${coveragePath}", unziping`,
  );

  // Unzip
  await exec('unzip', [coveragePath]);
  core.info('Successfully unzipped artifact file');
  await exec('ls', [coverageFolder]);
  await exec('cat', [coveragePath]);

  // Report to Coveralls as base
  await reportToCoveralls(coveragePath);
}
