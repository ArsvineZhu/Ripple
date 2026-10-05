import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

import { useOverlay } from './OverlayProvider';
import styles from './SearchableSelect.module.css';

interface SearchableOption {
  value: string;
  label: string;
  keywords?: string[];
}

interface Props {
  value: string;
  options: readonly SearchableOption[];
  onValueChange: (value: string) => void;
  label: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  options,
  onValueChange,
  label,
  searchPlaceholder,
  emptyLabel,
  disabled,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { container, openId, setOpenId, suppressShellClick } = useOverlay();
  const open = openId === id;

  useEffect(
    () => () => {
      if (open) setOpenId((current) => (current === id ? null : current));
    },
    [id, open, setOpenId],
  );

  return (
    <Popover.Root modal={false} open={open} onOpenChange={(next) => setOpenId(next ? id : null)}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={styles.trigger}
          aria-label={label}
          disabled={disabled}
          data-island-interactive
        >
          <span data-select-value>
            {options.find((option) => option.value === value)?.label ?? label}
          </span>
          <span className={styles.chevron}>
            <ChevronDown size={14} />
          </span>
        </button>
      </Popover.Trigger>
      {container && (
        <Popover.Portal container={container}>
          <Popover.Content
            className={styles.content}
            side="bottom"
            sideOffset={6}
            align="end"
            collisionBoundary={container}
            collisionPadding={12}
            hideWhenDetached
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
            onPointerDownOutside={(event) => {
              const target = event.detail.originalEvent.target;
              if (target instanceof Element && target.closest('#Island')) suppressShellClick();
            }}
            data-island-interactive
            onWheel={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Command label={label} loop className={styles.command}>
              <div className={styles.searchBox}>
                <Search size={14} aria-hidden="true" />
                <Command.Input
                  ref={inputRef}
                  className={styles.searchInput}
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                />
              </div>
              <Command.List className={styles.list}>
                <Command.Empty className={styles.empty}>{emptyLabel}</Command.Empty>
                {options.map((option) => (
                  <Command.Item
                    key={option.value}
                    value={option.value}
                    keywords={option.keywords}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpenId(null);
                    }}
                    className={styles.item}
                  >
                    <span>{option.label}</span>
                    <span className={styles.indicator} aria-hidden="true">
                      {value === option.value && <Check size={14} />}
                    </span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}
