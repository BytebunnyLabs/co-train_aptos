import type { ConfigTheme } from '@heroui/react';

// CoTrain 品牌主题配置
export const cotrainTheme: ConfigTheme = {
  layout: {
    fontSize: {
      tiny: '0.75rem',
      small: '0.875rem', 
      medium: '1rem',
      large: '1.125rem',
    },
    lineHeight: {
      tiny: '1rem',
      small: '1.25rem',
      medium: '1.5rem', 
      large: '1.75rem',
    },
    radius: {
      small: '6px',
      medium: '8px',
      large: '12px',
    },
    borderWidth: {
      small: '1px',
      medium: '2px',
      large: '3px',
    },
  },
};

// HeroUI 配置选项
export const heroUIConfig = {
  disableAnimation: false,
  disableRipple: false,
  skipFramerMotionAnimations: false,
};