import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

/**
 * Get Octokit instance initialized with github-token input
 *
 * @returns Octokit instance
 */
function getOctokitInstance() {
  const myToken = core.getInput('github-token');
  return getOctokit(myToken);
}

/**
 * @returns Coverage artifact
 */
async function getCoverageArtifactByName() {
  const { ref: branch, sha: lastCommitSha } =
    context?.payload?.pull_request?.head || {};
  core.info(
    `Branch and last commit sha loaded: ${JSON.stringify({
      branch,
      lastCommitSha,
    })}`,
  );
  const coverageKey =
    core.getInput('coverage-artifact-name') || `coverage-${lastCommitSha}`;
  core.info(
    `Workflow artifacts loaded, looking for artifact with name "${coverageKey}"`,
  );
  const { rest, paginate } = getOctokitInstance();

  // Load all artifacts, paginating until matching name is found
  const artifacts = await paginate(
    rest.actions.listArtifactsForRepo,
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
    },
    (response, done) => {
      if (response.data.find((artifact) => artifact?.name === coverageKey)) {
        core.debug('Found matching artifact - stopping pagination');
        done();
      }
      return response.data;
    },
  );
  core.info(`Artifacts loaded: ${artifacts.length}`);

  // Filter artifacts to coverage-$sha
  const matchArtifact = artifacts.find(
    (artifact) => artifact?.name === coverageKey,
  );
  if (!matchArtifact) {
    throw new Error(`Artifact with name "${coverageKey}" not found`);
  }
  core.info(`Matching coverage artifact found ${matchArtifact?.name}`);
  return matchArtifact;
}

/**
 * Download coverage artifact from Github Actions
 */
export async function downloadCoverageArtifact() {
  const matchArtifact = await getCoverageArtifactByName();
  const { rest } = getOctokitInstance();
  const downloadArtifact = await rest.actions.downloadArtifact({
    owner: context.repo.owner,
    repo: context.repo.repo,
    artifact_id: matchArtifact.id,
    archive_format: 'zip',
  });

  core.debug(`downloaded artifact url: ${downloadArtifact.url}`);
  return downloadArtifact.data as ArrayBuffer;
}
