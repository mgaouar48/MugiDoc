import * as React from "react";
import { cn } from "@/lib/utils";
import { useGlobalFocus } from "@/hooks/useGlobalFocus";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const EnhancedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, onFocus, ...props }, ref) => {
    const { handleInputFocus, handleInputChange } = useGlobalFocus();

    const combinedOnFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      handleInputFocus(e);
      onFocus?.(e);
    }, [handleInputFocus, onFocus]);

    const combinedOnChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        handleInputChange(() => onChange(e))(e);
      }
    }, [onChange, handleInputChange]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };
