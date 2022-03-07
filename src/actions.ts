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
 * @param owner - Repo owner
 * @param repo - Github repo name
 * @returns Coverage artifact
 */
export async function getCoverageArtifact(owner: string, repo: string) {
  const { ref: branch, sha: lastCommitSha } =
    context?.payload?.pull_request?.head || {};
  core.info(
    `Branch and last commit sha loaded: ${JSON.stringify({
      branch,
      lastCommitSha,
    })}`,
  );
  const { rest } = getOctokitInstance();

  // Load workflow runs
  const { data: runsData } = await rest.actions.listWorkflowRuns({
    owner,
    repo,
    branch,
    // per_page: 3,
    event: 'pull_request',
    workflow_id: core.getInput('upload-workflow-filename'),
  });
  core.info(`Workflow runs loaded: ${runsData.total_count}`);

  // Filter workflow runs to the one with matching commit sha
  const matchedWorkflow = runsData.workflow_runs.find(
    (workflowRun) => workflowRun.head_sha === lastCommitSha,
  );
  if (!matchedWorkflow) {
    throw new Error(`no workflows matching head_sha "${lastCommitSha}"`);
  }
  const { id, status } = matchedWorkflow;

  core.info(
    `Matched workflow loaded, looking for artifacts${JSON.stringify({
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
  const { data: artifactsData } = await rest.actions.listWorkflowRunArtifacts({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: matchedWorkflow.id,
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
    core.error(`No artifacts found for workflow with id "${id}"`);
    throw new Error('Matching coverage artifact not found');
  }
  core.info(`Matching coverage artifact found ${matchArtifact?.name}`);
  return matchArtifact;
}

/**
 * @param owner - Github repo owner
 * @param repo - Github repo name
 */
export async function downloadCoverageArtifact(owner: string, repo: string) {
  const matchArtifact = await getCoverageArtifact(owner, repo);
  const { rest } = getOctokitInstance();
  const downloadArtifact = await rest.actions.downloadArtifact({
    owner,
    repo,
    artifact_id: matchArtifact.id,
    archive_format: 'zip',
  });
  return downloadArtifact.data as ArrayBuffer;
}
