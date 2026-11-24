import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // 这些卡片模块把主题数据和渲染组件放在一起；该规则只影响开发时热更新（退化为整页刷新），不影响打包产物。
    files: ['src/components/ui/Xhs*Card.tsx', 'src/components/ui/CoverTemplate.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
