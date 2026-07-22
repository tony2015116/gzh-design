import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import type { Env, IllustrationAssetResult, IllustrationJobStatus, IllustrationWorkflowParams, RenderedIllustrationItem } from './types';
import { logIllustrationEvent } from './lib/logging';
import { loadTextArtifact, saveIllustrationArtifact, saveTextArtifact } from './lib/storage';
import { parseSelectedIllustrationPlan } from './illustration/plan';
import { renderIllustrationAsset } from './illustration/render';
import { insertIllustrationsIntoMarkdown } from './illustration/markdown';
import { buildIllustrationArtifactId, inferJobSource } from './illustration/jobs';

export class IllustrationWorkflow extends WorkflowEntrypoint<Env, IllustrationWorkflowParams> {
  async run(
    event: Readonly<WorkflowEvent<IllustrationWorkflowParams>>,
    step: WorkflowStep,
  ): Promise<{ jobId: string; status: IllustrationJobStatus; insertedCount: number }> {
    const params = event.payload;
    const baseKey = `illustration-jobs/${params.jobId}`;
    logIllustrationEvent(this.env, params.traceId, 'job.workflow.started', {
      jobId: params.jobId,
      sourceMarkdownKey: params.sourceMarkdownKey,
      planKey: params.planKey,
    });

    try {
      await step.do('mark illustration job running', async () => {
        await this.env.DB.prepare(`
          UPDATE illustration_jobs
          SET status = 'running',
              error = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(params.jobId).run();

        return { ok: true };
      });

      const markdown = await loadTextArtifact(this.env, params.sourceMarkdownKey);
      const rawPlan = await loadTextArtifact(this.env, params.planKey);
      const storedPlan = parseSelectedIllustrationPlan(markdown, rawPlan);
      const selectedItems = storedPlan.items
        .slice()
        .sort((left, right) => left.priority - right.priority)
        .slice(0, 6);

      const renderedItems: RenderedIllustrationItem[] = [];
      const renderedAssets: IllustrationAssetResult[] = [];

      for (const [index, item] of selectedItems.entries()) {
        const result = await step.do(`render illustration ${index + 1}`, async () => {
          const asset = await renderIllustrationAsset(
            params.requestOrigin,
            this.env,
            markdown,
            baseKey,
            item,
            index,
            params.traceId,
          );
          const itemRowId = `${params.jobId}:item:${String(index + 1).padStart(2, '0')}`;

          if (asset.promptKey) {
            await saveIllustrationArtifact(
              this.env,
              params.jobId,
              'prompt_json',
              asset.promptKey,
              {
                itemId: item.id,
                mode: asset.mode,
              },
              buildIllustrationArtifactId(params.jobId, 'prompt_json', item.id),
            );
          }

          if (asset.htmlKey) {
            await saveIllustrationArtifact(
              this.env,
              params.jobId,
              'render_html',
              asset.htmlKey,
              {
                itemId: item.id,
                mode: asset.mode,
              },
              buildIllustrationArtifactId(params.jobId, 'render_html', item.id),
            );
          }

          await saveIllustrationArtifact(
            this.env,
            params.jobId,
            'illustration_image',
            asset.imageKey,
            {
              itemId: item.id,
              mimeType: asset.mimeType,
              mode: asset.mode,
            },
            buildIllustrationArtifactId(params.jobId, 'illustration_image', item.id),
          );

          await this.env.DB.prepare(`
            INSERT OR REPLACE INTO illustration_items (
              id,
              job_id,
              sort_order,
              anchor_json,
              purpose,
              type,
              style,
              alt,
              prompt_key,
              image_key,
              image_url,
              engine,
              status,
              provider_meta_json,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP)
          `).bind(
            itemRowId,
            params.jobId,
            index,
            JSON.stringify(item.anchor),
            item.purpose,
            item.type,
            item.style,
            item.alt,
            asset.promptKey,
            asset.imageKey,
            asset.imageUrl,
            item.engine,
            JSON.stringify({
              mode: asset.mode,
              mimeType: asset.mimeType,
              source: asset.source,
              traceId: params.traceId,
            }),
          ).run();

          await this.env.DB.prepare(`
            UPDATE illustration_jobs
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(params.jobId).run();

          return {
            renderedItem: {
              ...item,
              imageKey: asset.imageKey,
              imageUrl: asset.imageUrl,
              status: 'completed' as const,
            },
            renderedAsset: asset,
          };
        });

        renderedItems.push(result.renderedItem);
        renderedAssets.push(result.renderedAsset);
      }

      await step.do('finalize illustration markdown', async () => {
        const resultMarkdown = insertIllustrationsIntoMarkdown(markdown, renderedItems);
        await saveTextArtifact(this.env, params.resultMarkdownKey, resultMarkdown, 'text/markdown; charset=utf-8');
        await saveIllustrationArtifact(
          this.env,
          params.jobId,
          'result_markdown',
          params.resultMarkdownKey,
          {
            insertedCount: renderedItems.length,
            resultChars: resultMarkdown.length,
          },
          buildIllustrationArtifactId(params.jobId, 'result_markdown', 'final'),
        );

        await this.env.DB.prepare(`
          UPDATE illustration_jobs
          SET status = 'completed',
              result_markdown_key = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(params.resultMarkdownKey, params.jobId).run();

        logIllustrationEvent(this.env, params.traceId, 'job.workflow.completed', {
          jobId: params.jobId,
          selectedCount: renderedItems.length,
          source: inferJobSource(renderedAssets),
          resultChars: resultMarkdown.length,
        });

        return {
          ok: true,
          resultChars: resultMarkdown.length,
        };
      });

      return {
        jobId: params.jobId,
        status: 'completed',
        insertedCount: renderedItems.length,
      };
    } catch (error: any) {
      logIllustrationEvent(this.env, params.traceId, 'job.workflow.failed', {
        jobId: params.jobId,
        error: error?.message || 'unknown',
      });
      await this.env.DB.prepare(`
        UPDATE illustration_jobs
        SET status = 'failed',
            error = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(error?.message || 'unknown_error', params.jobId).run().catch(() => undefined);

      throw error;
    }
  }
}
