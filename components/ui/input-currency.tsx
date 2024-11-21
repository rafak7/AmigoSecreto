"use client";

import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";
import { cn } from "@/lib/utils";
import { useController } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  control: any;
}

const InputCurrency = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, control, name, ...props }, ref) => {
    const {
      field: { onChange, value },
    } = useController({
      name,
      control,
    });

    return (
      <NumericFormat
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={value}
        onValueChange={(values) => {
          onChange(values.floatValue);
        }}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale
        {...props}
      />
    );
  }
);

InputCurrency.displayName = "InputCurrency";

export { InputCurrency as Input };