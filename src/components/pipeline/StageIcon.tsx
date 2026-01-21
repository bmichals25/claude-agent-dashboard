'use client';

import {
  Inbox,
  Search,
  ClipboardList,
  Blocks,
  Palette,
  Code,
  FlaskConical,
  ShieldCheck,
  FileText,
  Rocket,
  type LucideProps
} from 'lucide-react';
import { StageIconName } from '@/lib/types';

const iconMap: Record<StageIconName, React.ComponentType<LucideProps>> = {
  'inbox': Inbox,
  'search': Search,
  'clipboard-list': ClipboardList,
  'blocks': Blocks,
  'palette': Palette,
  'code': Code,
  'flask-conical': FlaskConical,
  'shield-check': ShieldCheck,
  'file-text': FileText,
  'rocket': Rocket,
};

interface StageIconProps extends LucideProps {
  name: StageIconName;
}

export function StageIcon({ name, ...props }: StageIconProps) {
  const Icon = iconMap[name];
  return <Icon {...props} />;
}
