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
  const { sha: prBaseSha } = context?.payload?.pull_request?.base || {};
  const { ref: branch, sha: prHeadSha } =
    context?.payload?.pull_request?.head || {};

  core.info(
    `Branch and last commit sha loaded: ${JSON.stringify({
      branch,
      mainSha,
      prBaseSha,
      prHeadSha,
    })}`,
  );
  const coverageKey =
    core.getInput('coverage-artifact-name') || `coverage-${prHeadSha}`;
  const fallbackCoverageKey = `coverage-${prBaseSha}`;
  const mainShaCoverageKey = `coverage-${mainSha}`;
  const coverageArtifactNames = [
    coverageKey,
    fallbackCoverageKey,
    mainShaCoverageKey,
  ];
  core.info(
    `Workflow artifacts loaded, looking for artifact with one of the following names: ${coverageArtifactNames.join(
      '\n',
    )}`,
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
      const matchingArtifact = response.data.find((artifact) =>
        coverageArtifactNames.includes(artifact?.name),
      );
      if (matchingArtifact) {
        core.debug(
          `Found matching artifact in paginate - stopping pagination: ${JSON.stringify(
            matchingArtifact,
          )}`,
        );
        done();
      }
      return response.data;
    },
  );
  core.info(`Artifacts loaded: ${artifacts.length}`);
  core.debug(JSON.stringify(artifacts.slice(0, 15), null, 2));

  // Filter artifacts to coverage-$sha
  const matchArtifact = artifacts.find((artifact) =>
    coverageArtifactNames.includes(artifact?.name),
  );
  if (!matchArtifact) {
    throw new Error(
      `Artifact with one of names: ${coverageArtifactNames.join(
        ', ',
      )} not found`,
    );
  }
  core.info(`Matching coverage artifact found ${matchArtifact.name}`);
  core.info(
    `Coverage artifact name references: ${JSON.stringify({
      isFallbackCoverageKey: matchArtifact.name === fallbackCoverageKey,
      isMainShaCoverageKey: matchArtifact.name === mainShaCoverageKey,
      isCoverageKey: matchArtifact.name === coverageKey,
    })}`,
  );
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
