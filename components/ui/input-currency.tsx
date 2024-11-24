"use client";

import { forwardRef } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { cn } from "@/lib/utils";
import { useController } from "react-hook-form";

interface InputCurrencyProps extends Omit<NumericFormatProps, 'value' | 'onChange'> {
  name: string;
  control: any;
}

const InputCurrency = forwardRef<HTMLInputElement, InputCurrencyProps>(
  ({ className, control, name, ...props }, ref) => {
    const {
      field: { onChange, value },
    } = useController({
      name,
      control,
    });

    return (
      <NumericFormat
        getInputRef={ref}
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
        allowNegative={false}
        {...props}
      />
    );
  }
);

InputCurrency.displayName = "InputCurrency";

export { InputCurrency };