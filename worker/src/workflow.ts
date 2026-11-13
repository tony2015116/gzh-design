import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import type { Env, IllustrationWorkflowParams } from './types';
import { runIllustrationWorkflow } from './illustration/workflowRunner';

export class IllustrationWorkflow extends WorkflowEntrypoint<Env, IllustrationWorkflowParams> {
  async run(event: Readonly<WorkflowEvent<IllustrationWorkflowParams>>, step: WorkflowStep) {
    return runIllustrationWorkflow(this.env, event.payload, step);
  }
}
