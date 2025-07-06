'use client';

import Link from 'next/link';
import { Button, Card, CardBody } from '@heroui/react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardBody className="text-center space-y-6 p-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-muted-foreground">
              404
            </h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
          </div>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col gap-2">
            <Button as={Link} href="/" color="primary" className="w-full">
              Go Home
            </Button>
            <Button as={Link} href="/training" variant="flat" className="w-full">
              Browse Training
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}