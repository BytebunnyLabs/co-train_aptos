'use client';

import React from 'react';
import { Button as HeroUIButton, ButtonProps as HeroUIButtonProps } from '@heroui/react';
import { cn } from '@/lib/utils';

// 映射 shadcn 变体到 HeroUI 变体
const variantMapping = {
  default: 'solid' as const,
  destructive: 'solid' as const,
  outline: 'bordered' as const,
  secondary: 'flat' as const,
  ghost: 'light' as const,
  link: 'light' as const,
};

// 映射 shadcn 尺寸到 HeroUI 尺寸
const sizeMapping = {
  default: 'md' as const,
  sm: 'sm' as const,
  lg: 'lg' as const,
  icon: 'sm' as const,
};

// 映射 shadcn 颜色到 HeroUI 颜色
const colorMapping = {
  default: 'primary' as const,
  destructive: 'danger' as const,
  outline: 'primary' as const,
  secondary: 'secondary' as const,
  ghost: 'primary' as const,
  link: 'primary' as const,
};

export interface ButtonProps extends Omit<HeroUIButtonProps, 'variant' | 'size' | 'color'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    // 如果使用 asChild，返回一个包装器（简化实现）
    if (asChild) {
      return (
        <span className={cn('inline-flex', className)} ref={ref as any}>
          {children}
        </span>
      );
    }

    // 映射属性到 HeroUI
    const heroUIVariant = variantMapping[variant];
    const heroUISize = sizeMapping[size];
    const heroUIColor = colorMapping[variant];

    // 特殊处理 icon 尺寸
    const isIconButton = size === 'icon';
    const buttonProps: HeroUIButtonProps = {
      variant: heroUIVariant,
      size: heroUISize,
      color: heroUIColor,
      radius: 'md',
      className: cn(
        // 基础样式
        'font-medium transition-colors',
        // icon 按钮特殊样式
        isIconButton && 'min-w-10 w-10 h-10 p-0',
        // link 变体特殊样式
        variant === 'link' && 'underline-offset-4 hover:underline bg-transparent',
        className
      ),
      ...props,
    };

    return (
      <HeroUIButton ref={ref} {...buttonProps}>
        {children}
      </HeroUIButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// 导出兼容的 buttonVariants（用于向后兼容）
export const buttonVariants = {
  variants: {
    variant: {
      default: '',
      destructive: '',
      outline: '',
      secondary: '',
      ghost: '',
      link: '',
    },
    size: {
      default: '',
      sm: '',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
};