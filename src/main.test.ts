import * as core from '@actions/core';
import { context } from '@actions/github';
import { run } from './main';

jest.mock('@actions/core');

interface MockObj {
  inputs: Record<string, string | undefined>;
  repo: {
    owner: string;
    repo: string;
  };
  workflow: string;
  prNumber: number;
  headRef: string;
  eventName: string;
  ref: string;
}

let mock: MockObj;

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(() => ({
    rest: {
      actions: {
        listWorkflowRuns: jest
          .fn()
          .mockResolvedValue({ data: { workflow_runs: [] } }),
        listWorkflowRunArtifacts: jest
          .fn()
          .mockResolvedValue({ data: { artifacts: [] } }),
        downloadArtifact: jest.fn().mockResolvedValue({ data: {} }),
      },
    },
  })),
  context: {
    repo: {
      owner: 'reside-eng',
      repo: 'test',
    },
  },
}));

const mockCore = core as jest.Mocked<typeof core>;

/**
 *
 */
function setupMock() {
  jest.clearAllMocks();
  mock = {
    // Default action inputs
    inputs: {
      'coveralls-token': 'asdf',
      'github-token': `${process.env.GITHUB_TOKEN}`,
    },
    repo: {
      owner: 'reside-eng',
      repo: 'upload-coverage-base-action',
    },
    workflow: 'Failure workflow (for test purpose only)',
    prNumber: 4,
    headRef: 'main',
    ref: 'main',
    eventName: 'pull_request',
  };

  mockCore.getInput.mockImplementation(
    (name: string): string => mock.inputs[name] || '',
  );

  // Setting to this Github repo by default
  context.workflow = mock.workflow;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // context.repo = mock.repo
  // context.payload.pull_request = {
  //   number: mock.prNumber,
  //   head: {
  //     ref: mock.headRef,
  //   },
  // };
  // context.ref = mock.ref;
}

describe('Run function', () => {
  beforeEach(() => setupMock());
  it('should throw if a matching sha is not found', async () => {
    await expect(() => run()).rejects.toThrowError(
      'no workflows matching head_sha "undefined"',
    );
  });
});
