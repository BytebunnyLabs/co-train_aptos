'use client';

import React from 'react';
import { HeroUIProvider as BaseHeroUIProvider } from '@heroui/react';
import { cotrainTheme, heroUIConfig } from '@/config/heroui-theme';

interface HeroUIProviderProps {
  children: React.ReactNode;
}

export function HeroUIProvider({ children }: HeroUIProviderProps) {
  return (
    <BaseHeroUIProvider 
      disableAnimation={heroUIConfig.disableAnimation}
      disableRipple={heroUIConfig.disableRipple}
      skipFramerMotionAnimations={heroUIConfig.skipFramerMotionAnimations}
    >
      {children}
    </BaseHeroUIProvider>
  );
}

export default HeroUIProvider;