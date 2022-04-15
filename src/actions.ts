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
 * @param arr - Array to sort
 * @returns Sorted array
 */
function sortByCreatedAt<T extends { created_at: string }>(arr: T[]): T[] {
  return arr.sort((x, y) => {
    if (!x.created_at) return 1; // use y if x doesn't have timestamp
    if (!y.created_at) return -1; // use x if y doesn't have timestamp
    return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
  });
}

/**
 * @param branch - Branch name
 * @param lastCommitSha - SHA of last commit
 */
async function getWorkflow(branch: string, lastCommitSha: string) {
  const { rest } = getOctokitInstance();
  // Load workflow runs
  const { data: runsData } = await rest.actions.listWorkflowRuns({
    owner: context.repo.owner,
    repo: context.repo.repo,
    branch,
    // per_page: 3,
    event: 'pull_request',
    workflow_id: core.getInput('upload-workflow-filename'),
  });
  if (runsData.total_count === 0) {
    throw new Error(
      `No workflow runs found for branch "${branch}" and commit "${lastCommitSha}"`,
    );
  }
  core.info(`Workflow runs loaded: ${runsData.total_count}`);

  // Filter workflow runs to the one with matching commit sha
  const matchedWorkflow = runsData.workflow_runs.find(
    (workflowRun) => workflowRun.head_sha === lastCommitSha,
  );
  if (!matchedWorkflow) {
    // Sort artifacts by the most recent created_at date
    const [mostRecentWorkflow] = sortByCreatedAt(runsData.workflow_runs);
    core.info(
      `Workflow run with commit "${lastCommitSha}" not found falling back to most recent workflow run on branch "${branch}"`,
    );
    core.info(
      `Most recent workflow run on branch "${branch}": ${JSON.stringify({
        id: mostRecentWorkflow.id,
        sha: mostRecentWorkflow.head_sha,
        created_at: mostRecentWorkflow.created_at,
      })}`,
    );
    return mostRecentWorkflow;
  }
  return matchedWorkflow;
}

/**
 * @param owner - Repo owner
 * @param repo - Github repo name
 * @returns Coverage artifact
 */
async function getCoverageArtifactFromWorkflow() {
  const { ref: branch, sha: lastCommitSha } =
    context?.payload?.pull_request?.head || {};
  core.info(
    `Branch and last commit sha loaded: ${JSON.stringify({
      branch,
      lastCommitSha,
    })}`,
  );
  const matchedWorkflow = await getWorkflow(branch, lastCommitSha);
  const { id, status } = matchedWorkflow;

  core.info(
    `Workflow loaded, looking for artifacts ${JSON.stringify({
      id,
      status,
    })} `,
  );
  if (status !== 'completed') {
    core.warning(
      'Associated verify workflow did not complete successfully, artifact may not be found',
    );
  }

  // Load artifacts associated with the loaded workflow run
  const { rest } = getOctokitInstance();
  const { data: artifactsData } = await rest.actions.listWorkflowRunArtifacts({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: id,
  });
  if (artifactsData.total_count === 0) {
    core.warning(`No artifacts found for workflow with id "${id}"`);
  }
  const coverageKey = core.getInput('coverage-artifact-name');
  core.info(
    `Workflow artifacts loaded, looking for artifact with name "${coverageKey}"`,
  );
  // Filter artifacts to coverage-$sha
  const matchArtifact = artifactsData.artifacts.find(
    (artifact) => artifact?.name === coverageKey,
  );
  if (!matchArtifact) {
    core.info(
      `Artifact with name "${coverageKey}" not found, falling back to first artifact`,
    );
    // Sort artifacts by the most recent created_at date
    const [mostRecentArtifact] = artifactsData.artifacts.sort((x, y) => {
      if (!x.created_at) return 1; // use y if x doesn't have timestamp
      if (!y.created_at) return -1; // use x if y doesn't have timestamp
      return (
        new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
      );
    });
    return mostRecentArtifact;
  }
  core.info(`Matching coverage artifact found ${matchArtifact?.name}`);
  return matchArtifact;
}

/**
 * @param owner - Repo owner
 * @param repo - Github repo name
 * @returns Coverage artifact
 */
async function getCoverageArtifactByName() {
  const { ref: branch, sha: lastCommitSha } =
    context?.payload?.pull_request?.head || {};
  core.info('New artifact lookup flow');
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
        core.info('Found matching artifact - stopping pagination');
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
