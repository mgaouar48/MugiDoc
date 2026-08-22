import * as React from "react";
import { cn } from "@/lib/utils";
import { useGlobalFocus } from "@/hooks/useGlobalFocus";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, onFocus, ...props }, ref) => {
    const { handleInputFocus, handleInputChange } = useGlobalFocus();

    const combinedOnFocus = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      handleInputFocus(e);
      onFocus?.(e);
    }, [handleInputFocus, onFocus]);

    const combinedOnChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        handleInputChange(() => onChange(e))(e);
      }
    }, [onChange, handleInputChange]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onChange={combinedOnChange}
        onFocus={combinedOnFocus}
        {...props}
      />
    );
  }
);
EnhancedTextarea.displayName = "EnhancedTextarea";

export { EnhancedTextarea };
