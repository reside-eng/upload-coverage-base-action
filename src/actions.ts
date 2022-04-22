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
  const { sha: mainSha } = context;
  const { ref: branch, sha: prHeadSha } =
    context?.payload?.pull_request?.head || {};
  core.info(
    `Branch and last commit sha loaded: ${JSON.stringify({
      branch,
      mainSha,
      prHeadSha,
    })}`,
  );
  const coverageKey =
    core.getInput('coverage-artifact-name') || `coverage-${prHeadSha}`;
  const fallbackCoverageKey = `coverage-${mainSha}`;
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
      const matchingArtifact = response.data.find(
        (artifact) =>
          artifact?.name === coverageKey ||
          artifact?.name === fallbackCoverageKey,
      );
      if (matchingArtifact) {
        core.debug(
          `Found matching artifact - stopping pagination: ${JSON.stringify(
            matchingArtifact,
          )}`,
        );
        done();
      }
      return response.data;
    },
  );
  core.info(`Artifacts loaded: ${artifacts.total_count}`);

  // Filter artifacts to coverage-$sha
  const matchArtifact = artifacts.find(
    (artifact) =>
      artifact?.name === coverageKey || artifact?.name === fallbackCoverageKey,
  );
  if (!matchArtifact) {
    throw new Error(
      `Artifact with name "${coverageKey}" or fallback "${fallbackCoverageKey}" not found`,
    );
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
