"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/shared/Navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // 只在非首页显示全局导航
  if (pathname === "/") {
    return null;
  }
  
  return <Navigation />;
}