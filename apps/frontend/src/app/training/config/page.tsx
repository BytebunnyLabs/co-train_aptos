'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import ConfigGenerator from '@/components/cotrain/config-generator';

export default function ConfigGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs>
          <BreadcrumbItem>
            <Link href="/training" className="flex items-center gap-1 text-primary hover:text-primary-600">
              <ArrowLeft className="h-4 w-4" />
              Training
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Configuration Generator
            </span>
          </BreadcrumbItem>
        </Breadcrumbs>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configuration Generator</h1>
            <p className="text-default-600 mt-1">
              Create and customize TOML configuration files for your AI training sessions
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Generator Component */}
      <ConfigGenerator />

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-lg font-semibold">Getting Started</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-primary">1. Choose a Template</h4>
              <p className="text-default-600">
                Select from pre-configured templates for common model architectures like Transformer, GPT, or BERT.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary">2. Configure Parameters</h4>
              <p className="text-default-600">
                Customize model, training, hardware, and logging parameters using the tabbed interface.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary">3. Generate & Download</h4>
              <p className="text-default-600">
                Generate the TOML configuration file and download it for use in your training pipeline.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}