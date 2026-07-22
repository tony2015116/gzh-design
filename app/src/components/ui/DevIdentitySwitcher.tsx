import { ShieldCheck } from 'lucide-react';

import {
  getDevIdentityOptions,
  getRoleLabel,
  type DevIdentityRole,
} from '../../services/accessControl';

interface DevIdentitySwitcherProps {
  value: DevIdentityRole;
  onChange: (role: DevIdentityRole) => void;
}

export function DevIdentitySwitcher({ value, onChange }: DevIdentitySwitcherProps) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
      <ShieldCheck className="h-4 w-4" />
      <span className="font-medium">调试身份</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as DevIdentityRole)}
        className="bg-transparent pr-1 text-sm font-medium outline-none"
        aria-label="调试身份"
      >
        {getDevIdentityOptions().map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-amber-700">
        {getRoleLabel(value)}
      </span>
    </label>
  );
}
