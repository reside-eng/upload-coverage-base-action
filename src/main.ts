import * as core from '@actions/core';
import { context } from '@actions/github';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename } from 'path';
import { downloadCoverageArtifact } from './actions';
import { reportToCoveralls } from './coveralls';

/**
 *
 */
export async function run() {
  const { owner, repo } = context.repo;
  const coverageArtifact = await downloadCoverageArtifact(owner, repo);
  core.info('Coverage artifact successfully downloaded, writing to disk');
  // Confirm coverage folder exists before writing to disk
  const coveragePath = `${process.env.GITHUB_WORKSPACE}/${core.getInput(
    'lcov-path',
  )}`;
  const coverageFolder = basename(coveragePath);
  if (!existsSync(coverageFolder)) {
    core.info(`create coverage artifact folder at path "${coverageFolder}"`);
    mkdirSync(coverageFolder);
    core.info('coverage folder created successfully');
  }

  // Write lcov.info file to coverage/lcov.info
  writeFileSync(coveragePath, Buffer.from(coverageArtifact));
  core.info(`Coverage artifact written to disk at path "${coveragePath}"`);

  // Report to Coveralls as base
  await reportToCoveralls(coveragePath);
}
