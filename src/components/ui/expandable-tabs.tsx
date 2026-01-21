"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  id?: string;
  color?: string;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
}

export function ExpandableTabs({
  tabs,
  className,
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  // Get non-separator tabs for the main row
  const mainTabs = tabs.filter((tab): tab is Tab => tab.type !== "separator");
  const separatorIndex = tabs.findIndex(tab => tab.type === "separator");

  const leftTabs = separatorIndex >= 0 ? mainTabs.slice(0, separatorIndex) : mainTabs;
  const rightTabs = separatorIndex >= 0 ? mainTabs.slice(separatorIndex) : [];

  const TabButton = ({ tab, index }: { tab: Tab; index: number }) => {
    const isSelected = selected === index;
    const Icon = tab.icon;

    return (
      <button
        onClick={() => handleSelect(index)}
        className="group relative flex items-center justify-center rounded-xl transition-all duration-200"
        style={{
          padding: isSelected ? '10px 16px' : '10px 12px',
          gap: isSelected ? '8px' : '0',
        }}
      >
        {/* Background pill */}
        {isSelected && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.08) 100%)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
        )}

        {/* Hover state - CSS only */}
        {!isSelected && (
          <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.05] transition-colors duration-150" />
        )}

        {/* Icon */}
        <div
          className="relative z-10 transition-colors duration-150"
          style={{
            color: isSelected ? 'var(--accent)' : 'var(--text-dim)',
          }}
        >
          <Icon size={18} strokeWidth={isSelected ? 2 : 1.5} className={!isSelected ? 'group-hover:text-[var(--text-secondary)]' : ''} />
        </div>

        {/* Label */}
        <AnimatePresence mode="wait">
          {isSelected && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative z-10 overflow-hidden whitespace-nowrap text-[12px] font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {tab.title}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-2xl p-1.5",
        className
      )}
      style={{
        background: 'rgba(20, 20, 24, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Left section */}
      <div className="flex items-center">
        {leftTabs.map((tab) => {
          const originalIndex = tabs.findIndex(t => t === tab);
          return <TabButton key={tab.title} tab={tab} index={originalIndex} />;
        })}
      </div>

      {/* Separator */}
      {separatorIndex >= 0 && (
        <div
          className="mx-2 h-6 w-px flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.08), transparent)'
          }}
        />
      )}

      {/* Right section */}
      <div className="flex items-center">
        {rightTabs.map((tab) => {
          const originalIndex = tabs.findIndex(t => t === tab);
          return <TabButton key={tab.title} tab={tab} index={originalIndex} />;
        })}
      </div>
    </div>
  );
}
