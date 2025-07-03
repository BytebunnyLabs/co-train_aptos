"use client";

import Link from "next/link";
import { Button } from "@/components/cotrain/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          页面未找到
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          抱歉，您访问的页面不存在。请检查URL是否正确，或返回首页。
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              返回首页
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
}