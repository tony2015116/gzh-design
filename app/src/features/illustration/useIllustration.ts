import { useState } from 'react';
import type { ToastTone } from '../../components/ui/ToastStack';
import { errorMessage } from '../../core/errors';
import {
  createIllustrationJob,
  getIllustrationPlan,
  type IllustrationJob,
  type IllustrationPlan,
} from '../../services/illustrationService';

interface UseIllustrationOptions {
  /** 当前渲染时的正文 */
  markdown: string;
  /** 读取最新正文：生成配图要调模型，期间正文可能被改动 */
  getLatestMarkdown: () => string;
  layoutStyleId: string;
  themeId: string;
  /** 整篇替换正文并保留撤销快照 */
  replaceMarkdown: (next: string, label: string) => void;
  notify: (tone: ToastTone, title: string, message?: string) => void;
}

/** 智能配图：分析建议 → 用户勾选 → 本机生成信息图并写回正文 */
export function useIllustration({ markdown, getLatestMarkdown, layoutStyleId, themeId, replaceMarkdown, notify }: UseIllustrationOptions) {
  const [isPlanning, setIsPlanning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [plan, setPlan] = useState<IllustrationPlan | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastJob, setLastJob] = useState<IllustrationJob | null>(null);

  const requestPlan = async () => {
    setIsPlanning(true);
    try {
      const nextPlan = await getIllustrationPlan({
        markdown,
        density: 'balanced',
        preferredStyle: 'auto',
        maxImages: 3,
        layoutStyleId,
        themeId,
      });
      setPlan(nextPlan);
      setSelectedIds(nextPlan.items.map((item) => item.id));
    } catch (error) {
      console.error('智能配图建议失败:', error);
      notify('error', '配图建议失败', errorMessage(error, '请稍后重试。'));
    } finally {
      setIsPlanning(false);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  };

  const closePlan = () => {
    if (isApplying) return;
    setPlan(null);
    setSelectedIds([]);
  };

  const applyPlan = async () => {
    if (!plan) return;
    if (selectedIds.length === 0) {
      notify('info', '请选择建议', '请至少保留一条配图建议。');
      return;
    }

    const source = getLatestMarkdown();
    setIsApplying(true);
    try {
      const job = await createIllustrationJob({ markdown: source, plan, selectedIds });
      setPlan(null);
      setSelectedIds([]);
      if (getLatestMarkdown() !== source) {
        // 结果基于生成前的正文，直接写回会丢掉这期间的编辑
        notify('error', '正文已变化，未写入配图', '生成配图期间正文被修改过。请重新获取配图建议。');
        return;
      }
      replaceMarkdown(job.resultMarkdown, '应用配图');
      setLastJob(job);
      notify('success', '配图已应用', `已插入 ${job.insertedCount} 张配图，可在「AI 工具」中撤销。`);
    } catch (error) {
      console.error('智能配图应用失败:', error);
      notify('error', '配图应用失败', errorMessage(error, '请稍后重试。'));
    } finally {
      setIsApplying(false);
    }
  };

  return {
    isPlanning,
    isApplying,
    plan,
    selectedIds,
    lastJob,
    requestPlan,
    toggleItem,
    closePlan,
    applyPlan,
    closeLastJob: () => setLastJob(null),
  };
}
