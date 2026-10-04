import * as Primitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { container, openId, setOpenId } = useOverlay();
  const open = openId === id;
  useEffect(
    () => () => {
      if (open) setOpenId((current) => (current === id ? null : current));
    },
    [open, setOpenId, id],
  );
  return (
    <Primitive.Root
      value={value}
      onValueChange={onValueChange}
      open={open}
      disabled={disabled}
      onOpenChange={(next) => setOpenId(next ? id : null)}
    >
      <Primitive.Trigger className={styles.trigger} aria-label={label} data-island-interactive>
        <Primitive.Value placeholder={label} />
        <Primitive.Icon>
          <ChevronDown size={14} />
        </Primitive.Icon>
      </Primitive.Trigger>
      {container && (
        <Primitive.Portal container={container}>
          <Primitive.Content
            className={styles.content}
            position="popper"
            sideOffset={6}
            align="end"
            collisionBoundary={container}
            collisionPadding={12}
            data-island-interactive
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Primitive.ScrollUpButton className={styles.scroll}>
              <ChevronUp size={14} />
            </Primitive.ScrollUpButton>
            <Primitive.Viewport className={styles.viewport}>
              {options.map((option) => (
                <Primitive.Item
                  className={styles.item}
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  textValue={option.label}
                >
                  <Primitive.ItemText>{option.label}</Primitive.ItemText>
                  <Primitive.ItemIndicator className={styles.indicator}>
                    <Check size={14} />
                  </Primitive.ItemIndicator>
                </Primitive.Item>
              ))}
            </Primitive.Viewport>
            <Primitive.ScrollDownButton className={styles.scroll}>
              <ChevronDown size={14} />
            </Primitive.ScrollDownButton>
          </Primitive.Content>
        </Primitive.Portal>
      )}
    </Primitive.Root>
  );
}
