import * as Primitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId } from 'react';
import { useOverlay } from './OverlayProvider';
import styles from './Select.module.css';
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}
interface Props {
  value: string;
  options: readonly Option[];
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}
export function Select({ value, options, onValueChange, label, disabled }: Props) {
  const id = useId();
  const { container, openId, setOpenId, suppressShellClick } = useOverlay();
  const open = openId === id;
  useEffect(
    () => () => {
      if (open) setOpenId((current) => (current === id ? null : current));
    },
    [open, setOpenId, id],
  );
  return (
    <Primitive.Root modal={false} open={open} onOpenChange={(next) => setOpenId(next ? id : null)}>
      <Primitive.Trigger
        className={styles.trigger}
        aria-label={label}
        disabled={disabled}
        data-island-interactive
      >
        <span>{options.find((option) => option.value === value)?.label ?? label}</span>
        <span>
          <ChevronDown size={14} />
        </span>
      </Primitive.Trigger>
      {container && (
        <Primitive.Portal container={container}>
          <Primitive.Content
            className={styles.content}
            sideOffset={6}
            align="end"
            collisionBoundary={container}
            collisionPadding={12}
            hideWhenDetached
            onPointerDownOutside={(event) => {
              const target = event.detail.originalEvent.target;
              if (target instanceof Element && target.closest('#Island')) suppressShellClick();
            }}
            data-island-interactive
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <div className={styles.viewport}>
              <Primitive.RadioGroup value={value} onValueChange={onValueChange}>
                {options.map((option) => (
                  <Primitive.RadioItem
                    className={styles.item}
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    textValue={option.label}
                  >
                    {option.label}
                    <Primitive.ItemIndicator className={styles.indicator}>
                      <Check size={14} />
                    </Primitive.ItemIndicator>
                  </Primitive.RadioItem>
                ))}
              </Primitive.RadioGroup>
            </div>
          </Primitive.Content>
        </Primitive.Portal>
      )}
    </Primitive.Root>
  );
}
