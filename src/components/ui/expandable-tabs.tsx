"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  id?: string;
  color?: string; // Custom color for this tab's icon
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

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".375rem" : 0,
    paddingLeft: isSelected ? "0.625rem" : "0.5rem",
    paddingRight: isSelected ? "0.625rem" : "0.5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring" as const, bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(outsideClickRef as React.RefObject<HTMLDivElement>, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  // Render a single tab button
  const TabButton = ({ tab, index }: { tab: Tab; index: number }) => {
    const isSelected = selected === index;
    const Icon = tab.icon;
    // Use custom color if provided, otherwise use accent/dim
    const iconColor = tab.color || (isSelected ? 'var(--accent)' : 'var(--text-dim)');
    const textColor = tab.color || 'var(--accent)';

    return (
      <motion.button
        variants={buttonVariants}
        initial={false}
        animate="animate"
        custom={isSelected}
        onClick={() => handleSelect(index)}
        transition={transition}
        className={cn(
          "relative flex items-center rounded-lg py-2.5 text-xs font-medium transition-colors duration-300 flex-shrink-0",
          isSelected
            ? "bg-white/[0.06]"
            : "text-muted-foreground hover:bg-white/[0.03]"
        )}
      >
        <Icon
          size={18}
          style={{ color: iconColor }}
          className="flex-shrink-0"
        />
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.span
              variants={spanVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="overflow-hidden whitespace-nowrap text-xs"
              style={{ color: textColor, maxWidth: '70px' }}
            >
              {tab.title}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex items-center justify-center gap-0.5 rounded-2xl border p-2",
        className
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(24, 24, 28, 0.95) 0%, rgba(18, 18, 22, 0.98) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        boxShadow: '0 -4px 24px -8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        flexWrap: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return (
            <div
              key={`separator-${index}`}
              className="mx-1 h-5 w-px flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
              }}
              aria-hidden="true"
            />
          );
        }

        return <TabButton key={tab.title} tab={tab} index={index} />;
      })}
    </div>
  );
}
