import * as core from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { downloadCoverageArtifact } from './actions';
import { reportToCoveralls } from './coveralls';

/**
 * @param coveragePath - Path to coverage file
 */
async function downloadAndWriteArtifact(coveragePath: string) {
  const coverageArtifact = await downloadCoverageArtifact();
  core.debug('Coverage artifact successfully downloaded, writing to disk');
  // Confirm coverage folder exists before writing to disk

  const coverageFolder = dirname(coveragePath);
  if (!existsSync(coverageFolder)) {
    core.debug(`create coverage artifact folder at path "${coverageFolder}"`);
    mkdirSync(coverageFolder);
    core.debug('coverage folder created successfully');
  }

  // Write artifact (zip) file to coverage/lcov.info
  const downloadPath = `${coverageFolder}/download.zip`;
  writeFileSync(downloadPath, Buffer.from(coverageArtifact));
  core.debug(
    `Coverage artifact written to disk at path "${downloadPath}", unziping`,
  );

  // Unzip
  core.debug(`Unziping artifact file at path "${downloadPath}"`);
  await exec('unzip', [downloadPath, '-d', coverageFolder]);
  core.info('Successfully downloaded and unzipped coverage artifact');
}

/**
 *
 */
export async function run() {
  core.debug(`lcov-path input: ${core.getInput('lcov-path')}`);
  // TODO: Handle a path passed which already contains workspace
  const coveragePath = `${process.env.GITHUB_WORKSPACE}/${
    core.getInput('lcov-path') || 'coverage/lcov.info'
  }`;
  // Use coverage file if it exists (Next builds), otherwise download artifact and write to disk (Node builds)
  if (existsSync(coveragePath)) {
    core.info(`Using existing coverage file at path "${coveragePath}"`);
  } else {
    core.info(
      `Coverage file does not already exist at path "${coveragePath}", downloading from artifact`,
    );
    await downloadAndWriteArtifact(coveragePath);
  }

  // Report to Coveralls as base
  await reportToCoveralls(coveragePath);
}
