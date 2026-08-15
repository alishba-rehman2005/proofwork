import type { ComponentProps } from "react";

import { cx } from "./primitives";

/**
 * Table primitives.
 *
 * The wrapper owns horizontal overflow so a wide table scrolls inside its own
 * card instead of forcing the whole page sideways on a phone.
 */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table {...props} className={cx("w-full min-w-full text-sm", className)} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead {...props} className={cx("bg-surface-muted", className)} />;
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody {...props} className={cx("divide-y divide-line", className)} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr {...props} className={cx("transition-colors hover:bg-surface-muted/60", className)} />;
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      {...props}
      scope={props.scope ?? "col"}
      className={cx(
        "px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted uppercase",
        className,
      )}
    />
  );
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td {...props} className={cx("px-4 py-3 align-middle", className)} />;
}
