import * as React from "react";
import { Input as NextUIInput } from "@heroui/react";
import { cn } from "@/lib/utils";

// HeroUI Input 组件的扩展属性
export interface HeroUIInputProps extends Omit<React.ComponentProps<"input">, 'size' | 'color'> {
  // HeroUI 特有属性
  variant?: "flat" | "bordered" | "underlined" | "faded";
  size?: "sm" | "md" | "lg";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  labelPlacement?: "inside" | "outside" | "outside-left";
  
  // 增强功能
  isClearable?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  
  // 内容属性
  label?: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
  
  // 图标
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  
  // 事件处理
  onClear?: () => void;
  onValueChange?: (value: string) => void;
}

const Input = React.forwardRef<HTMLInputElement, HeroUIInputProps>(
  ({ 
    className, 
    type = "text", 
    variant = "bordered",
    value,
    size = "md",
    color = "default",
    radius = "md",
    labelPlacement = "inside",
    isClearable = false,
    isDisabled = false,
    isInvalid = false,
    isRequired = false,
    isReadOnly = false,
    label,
    description,
    errorMessage,
    placeholder,
    startContent,
    endContent,
    onClear,
    onValueChange,
    onChange,
    ...props 
  }, ref) => {
    // 处理 onChange 事件，同时支持 shadcn 和 HeroUI 的事件处理方式
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    // 如果没有使用 HeroUI 特有属性，则回退到原生 input 以保持兼容性
    const isUsingHeroUIFeatures = 
      variant !== "bordered" || 
      size !== "md" || 
      color !== "default" || 
      radius !== "md" ||
      labelPlacement !== "inside" ||
      isClearable ||
      isInvalid ||
      label ||
      description ||
      errorMessage ||
      startContent ||
      endContent ||
      onClear ||
      onValueChange;

    if (!isUsingHeroUIFeatures) {
      // 回退到 shadcn/ui 样式的原生 input
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          onChange={handleChange}
          disabled={isDisabled}
          required={isRequired}
          readOnly={isReadOnly}
          placeholder={placeholder}
          value={(typeof value === 'number' ? value.toString() : Array.isArray(value) ? value.join(',') : value) as string}
          {...props}
        />
      );
    }

    // 使用 HeroUI Input 组件
    return (
      <NextUIInput
        type={type}
        variant={variant}
        size={size}
        color={color}
        radius={radius}
        labelPlacement={labelPlacement}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isRequired={isRequired}
        isReadOnly={isReadOnly}
        label={label}
        description={description}
        errorMessage={errorMessage}
        placeholder={placeholder}
        startContent={startContent}
        endContent={endContent}
        onClear={onClear}
        onValueChange={onValueChange}
        className={className}
        onChange={handleChange}
        value={(typeof value === 'number' ? value.toString() : Array.isArray(value) ? value.join(',') : value) as string}
        {...(props as any)}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };