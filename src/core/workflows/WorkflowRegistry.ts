import { IWorkflow, WorkflowDefinition } from './IWorkflow';

import { ApplyToJobWorkflow } from './plugins/ApplyToJobWorkflow';
import { InterviewPrepWorkflow } from './plugins/InterviewPrepWorkflow';
import { ResumeAuditWorkflow } from './plugins/ResumeAuditWorkflow';
import { JobMarketIntelligenceWorkflow } from './plugins/JobMarketIntelligenceWorkflow';
import { CompanyResearchWorkflow } from './plugins/CompanyResearchWorkflow';
import { CareerReviewWorkflow } from './plugins/CareerReviewWorkflow';
import { JobDiscoveryWorkflow } from './plugins/JobDiscoveryWorkflow';
import { PortfolioOptimizationWorkflow } from './plugins/PortfolioOptimizationWorkflow';
import { OfferComparisonWorkflow } from './plugins/OfferComparisonWorkflow';
import { ReferralWorkflow } from './plugins/ReferralWorkflow';
import { CertificationPlannerWorkflow } from './plugins/CertificationPlannerWorkflow';

import { JobVerificationWorkflow } from './plugins/JobVerificationWorkflow';
import { CandidateMatchingWorkflow } from './plugins/CandidateMatchingWorkflow';
import { ApplicationPreparationWorkflow } from './plugins/ApplicationPreparationWorkflow';

export class WorkflowRegistry {
  private static instance: WorkflowRegistry;
  private workflows: Map<string, IWorkflow> = new Map();

  private constructor() {
    this.registerDefaultWorkflows();
  }

  public static getInstance(): WorkflowRegistry {
    if (!WorkflowRegistry.instance) {
      WorkflowRegistry.instance = new WorkflowRegistry();
    }
    return WorkflowRegistry.instance;
  }

  private registerDefaultWorkflows(): void {
    const defaults: IWorkflow[] = [
      new JobVerificationWorkflow(),
      new CandidateMatchingWorkflow(),
      new ApplicationPreparationWorkflow(),
      new ApplyToJobWorkflow(),
      new InterviewPrepWorkflow(),
      new ResumeAuditWorkflow(),
      new JobMarketIntelligenceWorkflow(),
      new CompanyResearchWorkflow(),
      new CareerReviewWorkflow(),
      new JobDiscoveryWorkflow(),
      new PortfolioOptimizationWorkflow(),
      new OfferComparisonWorkflow(),
      new ReferralWorkflow(),
      new CertificationPlannerWorkflow()
    ];

    for (const w of defaults) {
      this.register(w);
    }
  }

  public register(workflow: IWorkflow): void {
    if (this.workflows.has(workflow.definition.id)) {
      console.warn(`[WorkflowRegistry] Overwriting workflow: ${workflow.definition.id}`);
    }
    this.workflows.set(workflow.definition.id, workflow);
  }

  public unregister(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  public getWorkflow(workflowId: string): IWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  public getAllWorkflows(): IWorkflow[] {
    return Array.from(this.workflows.values());
  }

  public getWorkflowDefinitions(): WorkflowDefinition[] {
    return this.getAllWorkflows().map(w => w.definition);
  }
}

export const workflowRegistry = WorkflowRegistry.getInstance();
