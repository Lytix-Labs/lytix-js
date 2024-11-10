export type AgentAsJudgeTestRunTestResultsToTest = {
  testName: string;
  output: string;
  messages: { id: number; content: string; role: string }[];
  sources: string[];

  /**
   * Results once we are done
   */
  score?: number;
  explanation?: string;
  missedSources?: string[];
}[];

export type AgentAsJudgeTestRunConfig = {
  repository: {
    remote: string;
    branch: string;
    repository: string;
  };
};
