import { Moon, Sun } from 'lucide-react';
import { setUiSkin, useUiSkin } from '../../services/uiSkin';

export function UiSkinControl() {
  const skin = useUiSkin();
  return (
    <fieldset data-skin-settings className="mb-6">
      <legend className="mb-2 text-sm font-medium text-gray-700">外观皮肤</legend>
      <div className="wb-skin-options">
        <button type="button" aria-label="切换至明亮皮肤" aria-pressed={skin === 'light'} onClick={() => setUiSkin('light')}><Sun size={18} /><span>明亮</span></button>
        <button type="button" aria-label="切换至暗黑皮肤" aria-pressed={skin === 'dark'} onClick={() => setUiSkin('dark')}><Moon size={18} /><span>暗黑</span></button>
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-500">立即生效并记住选择，文章主题与导出配色保持不变。</p>
    </fieldset>
  );
}
