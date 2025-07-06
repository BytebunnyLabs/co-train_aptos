"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-red-600 dark:text-red-400">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          出现了一些问题
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          抱歉，服务器遇到了一个错误。请稍后再试或联系支持团队。
        </p>
        <div className="flex gap-4 justify-center">
          <Button color="primary" onClick={reset}>
            重试
          </Button>
          <Button variant="flat" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}