'use client';

import * as React from 'react';
import { Card as HeroUICard, CardBody, CardFooter as HeroUICardFooter, CardHeader as HeroUICardHeader } from '@heroui/react';
import { cn } from '@/lib/utils';

// 主 Card 组件 - 简化类型定义以避免冲突
const Card = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onKeyUp'> & {
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    radius?: 'none' | 'sm' | 'md' | 'lg';
    isBlurred?: boolean;
    isHoverable?: boolean;
    isPressable?: boolean;
    disableAnimation?: boolean;
    onClick?: () => void;
  }
>(({ className, shadow = 'sm', radius = 'lg', isBlurred = false, isHoverable = false, isPressable = false, disableAnimation = false, children, onClick, ...props }, ref) => (
  <HeroUICard
    className={cn(
      // 保持与 shadcn/ui 相似的默认样式
      'bg-card text-card-foreground',
      className
    )}
    shadow={shadow}
    radius={radius}
    isBlurred={isBlurred}
    isHoverable={isHoverable}
    isPressable={isPressable}
    disableAnimation={disableAnimation}
    onPress={onClick}
    {...(props as any)}
  >
    {children}
  </HeroUICard>
));
Card.displayName = 'Card';

// CardHeader 组件 - 使用 div 包装以保持兼容性
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean;
  }
>(({ className, divider = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // 保持与 shadcn/ui 相似的间距和布局
      'flex flex-col space-y-1.5 p-6',
      divider && 'border-b',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

// CardTitle 组件
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// CardDescription 组件
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// CardContent 组件 - 使用 div 包装以保持兼容性
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // 保持与 shadcn/ui 相似的内边距
      'p-6 pt-0',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

// CardFooter 组件 - 使用 div 包装以保持兼容性
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean;
  }
>(({ className, divider = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // 保持与 shadcn/ui 相似的布局和间距
      'flex items-center p-6 pt-0',
      divider && 'border-t',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

// 导出类型定义
export type CardProps = React.ComponentProps<typeof Card>;
export type CardHeaderProps = React.ComponentProps<typeof CardHeader>;
export type CardTitleProps = React.ComponentProps<typeof CardTitle>;
export type CardDescriptionProps = React.ComponentProps<typeof CardDescription>;
export type CardContentProps = React.ComponentProps<typeof CardContent>;
export type CardFooterProps = React.ComponentProps<typeof CardFooter>;