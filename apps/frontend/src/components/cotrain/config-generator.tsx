'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Switch,
  Slider,
  Code,
  Accordion,
  AccordionItem,
} from '@heroui/react';
import {
  Download,
  Settings,
  Play,
  FileText,
  Cpu,
  Database,
  Zap,
  Brain,
  Save,
  Copy,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/cotrain/ui/use-toast';
import { api } from '@/services/api';

// Types
interface ModelConfig {
  name: string;
  architecture: string;
  pretrainedPath?: string;
  parameters?: number;
  hiddenSize?: number;
  numAttentionHeads?: number;
  numLayers?: number;
  vocabSize?: number;
  maxSequenceLength?: number;
}

interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  scheduler?: string;
  weightDecay?: number;
  gradientClipping?: number;
  warmupSteps?: number;
  checkpointInterval?: number;
  validationInterval?: number;
  earlyStopping?: boolean;
  accumulationSteps?: number;
}

interface DataConfig {
  datasetPath: string;
  validationPath?: string;
  testPath?: string;
  numWorkers?: number;
  shuffle?: boolean;
  preprocessingConfig?: Record<string, any>;
}

interface HardwareConfig {
  gpuIds?: number[];
  cpuCores?: number;
  memoryLimit?: number;
  mixedPrecision?: boolean;
}

interface OutputConfig {
  outputPath: string;
  experimentName?: string;
  saveBestModel?: boolean;
  saveLastModel?: boolean;
  saveFormats?: string[];
}

interface LoggingConfig {
  level: string;
  logPath?: string;
  enableTensorboard?: boolean;
  tensorboardPath?: string;
  enableWandb?: boolean;
  wandbProject?: string;
}

interface TrainingSessionConfig {
  sessionName: string;
  description?: string;
  tags?: string[];
  model: ModelConfig;
  training: TrainingConfig;
  data: DataConfig;
  output: OutputConfig;
  hardware?: HardwareConfig;
  logging?: LoggingConfig;
  customArgs?: Record<string, any>;
}

interface ConfigTemplate {
  name: string;
  description: string;
  architecture: string;
  defaultConfig: Partial<TrainingSessionConfig>;
  requiredFields: string[];
}

const ARCHITECTURES = [
  { key: 'transformer', label: 'Transformer' },
  { key: 'gpt', label: 'GPT' },
  { key: 'bert', label: 'BERT' },
  { key: 'resnet', label: 'ResNet' },
  { key: 'vit', label: 'Vision Transformer' },
  { key: 'custom', label: 'Custom' },
];

const OPTIMIZERS = [
  { key: 'adam', label: 'Adam' },
  { key: 'adamw', label: 'AdamW' },
  { key: 'sgd', label: 'SGD' },
  { key: 'rmsprop', label: 'RMSprop' },
];

const SCHEDULERS = [
  { key: 'linear', label: 'Linear' },
  { key: 'cosine', label: 'Cosine' },
  { key: 'exponential', label: 'Exponential' },
  { key: 'step', label: 'Step' },
  { key: 'plateau', label: 'Plateau' },
];

const LOG_LEVELS = [
  { key: 'debug', label: 'Debug' },
  { key: 'info', label: 'Info' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
];

export default function ConfigGenerator() {
  const { toast } = useToast();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedConfig, setGeneratedConfig] = useState<string>('');
  const [configPath, setConfigPath] = useState<string>('');

  const [config, setConfig] = useState<TrainingSessionConfig>({
    sessionName: '',
    description: '',
    tags: [],
    model: {
      name: '',
      architecture: 'transformer',
      hiddenSize: 768,
      numAttentionHeads: 12,
      numLayers: 12,
      maxSequenceLength: 512,
    },
    training: {
      epochs: 10,
      batchSize: 32,
      learningRate: 0.0001,
      optimizer: 'adamw',
      scheduler: 'linear',
      weightDecay: 0.01,
      warmupSteps: 1000,
      checkpointInterval: 100,
      validationInterval: 100,
      earlyStopping: true,
      accumulationSteps: 1,
    },
    data: {
      datasetPath: '',
      numWorkers: 4,
      shuffle: true,
    },
    output: {
      outputPath: '',
      experimentName: '',
      saveBestModel: true,
      saveLastModel: true,
      saveFormats: ['pytorch', 'onnx'],
    },
    hardware: {
      gpuIds: [0],
      mixedPrecision: true,
    },
    logging: {
      level: 'info',
      enableTensorboard: true,
      enableWandb: false,
    },
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/cotrain-core/config/templates');
      setTemplates((response.data as any).templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration templates',
        variant: 'destructive',
      });
    }
  };

  const handleTemplateSelect = async (templateName: string) => {
    if (!templateName) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/cotrain-core/config/templates/${templateName}`);
      const template = (response.data as any).template;
      
      // Merge template with current config
      setConfig(prev => ({
        ...prev,
        ...template.defaultConfig,
        sessionName: prev.sessionName || template.name,
        description: prev.description || template.description,
      }));
      
      setSelectedTemplate(templateName);
      toast({
        title: 'Template Loaded',
        description: `Configuration loaded from ${template.name} template`,
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateConfig = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!config.sessionName) {
        toast({
          title: 'Validation Error',
          description: 'Session name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!config.model.name) {
        toast({
          title: 'Validation Error',
          description: 'Model name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!config.data.datasetPath) {
        toast({
          title: 'Validation Error',
          description: 'Dataset path is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!config.output.outputPath) {
        toast({
          title: 'Validation Error',
          description: 'Output path is required',
          variant: 'destructive',
        });
        return;
      }

      const response = await api.post('/cotrain-core/config/generate', config);
      setGeneratedConfig((response.data as any).content);
      setConfigPath((response.data as any).configPath);
      onOpen();
      
      toast({
        title: 'Config Generated',
        description: 'Training configuration file generated successfully',
      });
    } catch (error: any) {
      console.error('Failed to generate config:', error);
      toast({
        title: 'Generation Failed',
        description: error.response?.data?.message || 'Failed to generate configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedConfig);
      toast({
        title: 'Copied',
        description: 'Configuration copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy configuration to clipboard',
        variant: 'destructive',
      });
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([generatedConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.sessionName || 'training'}.toml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateConfig = (section: keyof TrainingSessionConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any> || {}),
        [field]: value,
      },
    }));
  };

  const updateNestedConfig = (section: keyof TrainingSessionConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration Generator</h2>
          <p className="text-default-500">
            Generate TOML configuration files for AI training sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={loadTemplates}
          >
            Refresh Templates
          </Button>
          <Button
            color="primary"
            startContent={<FileText className="h-4 w-4" />}
            onPress={generateConfig}
            isLoading={isLoading}
          >
            Generate Config
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Template Selection</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Configuration Template"
              placeholder="Select a template"
              selectedKeys={selectedTemplate ? [selectedTemplate] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleTemplateSelect(selected);
              }}
            >
              {templates.map((template) => (
                <SelectItem key={template.name}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-default-400">{template.description}</div>
                  </div>
                </SelectItem>
              ))}
            </Select>
            {selectedTemplate && (
              <div className="flex items-center gap-2">
                <Chip color="success" variant="flat" startContent={<CheckCircle2 className="h-3 w-3" />}>
                  Template Loaded
                </Chip>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Configuration Parameters</h3>
          </div>
        </CardHeader>
        <CardBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            {/* Basic Configuration */}
            <Tab key="basic" title="Basic">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Session Name"
                    placeholder="Enter session name"
                    value={config.sessionName}
                    onValueChange={(value) => updateConfig('sessionName' as any, '', value)}
                    isRequired
                  />
                  <Input
                    label="Model Name"
                    placeholder="Enter model name"
                    value={config.model.name}
                    onValueChange={(value) => updateConfig('model', 'name', value)}
                    isRequired
                  />
                </div>
                <Textarea
                  label="Description"
                  placeholder="Enter session description"
                  value={config.description || ''}
                  onValueChange={(value) => updateConfig('description' as any, '', value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Model Architecture"
                    selectedKeys={[config.model.architecture]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      updateConfig('model', 'architecture', selected);
                    }}
                  >
                    {ARCHITECTURES.map((arch) => (
                      <SelectItem key={arch.key}>
                        {arch.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Dataset Path"
                    placeholder="/path/to/dataset"
                    value={config.data.datasetPath}
                    onValueChange={(value) => updateConfig('data', 'datasetPath', value)}
                    isRequired
                  />
                </div>
                <Input
                  label="Output Path"
                  placeholder="/path/to/output"
                  value={config.output.outputPath}
                  onValueChange={(value) => updateConfig('output', 'outputPath', value)}
                  isRequired
                />
              </div>
            </Tab>

            {/* Model Configuration */}
            <Tab key="model" title="Model">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Hidden Size"
                    type="number"
                    value={config.model.hiddenSize?.toString() || ''}
                    onValueChange={(value) => updateConfig('model', 'hiddenSize', parseInt(value) || 768)}
                  />
                  <Input
                    label="Attention Heads"
                    type="number"
                    value={config.model.numAttentionHeads?.toString() || ''}
                    onValueChange={(value) => updateConfig('model', 'numAttentionHeads', parseInt(value) || 12)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Number of Layers"
                    type="number"
                    value={config.model.numLayers?.toString() || ''}
                    onValueChange={(value) => updateConfig('model', 'numLayers', parseInt(value) || 12)}
                  />
                  <Input
                    label="Max Sequence Length"
                    type="number"
                    value={config.model.maxSequenceLength?.toString() || ''}
                    onValueChange={(value) => updateConfig('model', 'maxSequenceLength', parseInt(value) || 512)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vocabulary Size"
                    type="number"
                    value={config.model.vocabSize?.toString() || ''}
                    onValueChange={(value) => updateConfig('model', 'vocabSize', parseInt(value) || undefined)}
                  />
                  <Input
                    label="Pretrained Model Path"
                    placeholder="/path/to/pretrained/model"
                    value={config.model.pretrainedPath || ''}
                    onValueChange={(value) => updateConfig('model', 'pretrainedPath', value)}
                  />
                </div>
              </div>
            </Tab>

            {/* Training Configuration */}
            <Tab key="training" title="Training">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Epochs"
                    type="number"
                    value={config.training.epochs.toString()}
                    onValueChange={(value) => updateConfig('training', 'epochs', parseInt(value) || 10)}
                  />
                  <Input
                    label="Batch Size"
                    type="number"
                    value={config.training.batchSize.toString()}
                    onValueChange={(value) => updateConfig('training', 'batchSize', parseInt(value) || 32)}
                  />
                  <Input
                    label="Learning Rate"
                    type="number"
                    step="0.0001"
                    value={config.training.learningRate.toString()}
                    onValueChange={(value) => updateConfig('training', 'learningRate', parseFloat(value) || 0.0001)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Optimizer"
                    selectedKeys={[config.training.optimizer]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      updateConfig('training', 'optimizer', selected);
                    }}
                  >
                    {OPTIMIZERS.map((opt) => (
                      <SelectItem key={opt.key}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Scheduler"
                    selectedKeys={config.training.scheduler ? [config.training.scheduler] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      updateConfig('training', 'scheduler', selected);
                    }}
                  >
                    {SCHEDULERS.map((sched) => (
                      <SelectItem key={sched.key}>
                        {sched.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Weight Decay"
                    type="number"
                    step="0.001"
                    value={config.training.weightDecay?.toString() || ''}
                    onValueChange={(value) => updateConfig('training', 'weightDecay', parseFloat(value) || 0.01)}
                  />
                  <Input
                    label="Warmup Steps"
                    type="number"
                    value={config.training.warmupSteps?.toString() || ''}
                    onValueChange={(value) => updateConfig('training', 'warmupSteps', parseInt(value) || 1000)}
                  />
                  <Input
                    label="Checkpoint Interval"
                    type="number"
                    value={config.training.checkpointInterval?.toString() || ''}
                    onValueChange={(value) => updateConfig('training', 'checkpointInterval', parseInt(value) || 100)}
                  />
                </div>
                <div className="flex gap-4">
                  <Switch
                    isSelected={config.training.earlyStopping}
                    onValueChange={(value) => updateConfig('training', 'earlyStopping', value)}
                  >
                    Early Stopping
                  </Switch>
                </div>
              </div>
            </Tab>

            {/* Hardware Configuration */}
            <Tab key="hardware" title="Hardware">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="GPU IDs (comma-separated)"
                    placeholder="0,1,2,3"
                    value={config.hardware?.gpuIds?.join(',') || '0'}
                    onValueChange={(value) => {
                      const gpuIds = value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                      updateConfig('hardware', 'gpuIds', gpuIds);
                    }}
                  />
                  <Input
                    label="CPU Cores"
                    type="number"
                    value={config.hardware?.cpuCores?.toString() || ''}
                    onValueChange={(value) => updateConfig('hardware', 'cpuCores', parseInt(value) || undefined)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Memory Limit (GB)"
                    type="number"
                    value={config.hardware?.memoryLimit?.toString() || ''}
                    onValueChange={(value) => updateConfig('hardware', 'memoryLimit', parseInt(value) || undefined)}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      isSelected={config.hardware?.mixedPrecision}
                      onValueChange={(value) => updateConfig('hardware', 'mixedPrecision', value)}
                    >
                      Mixed Precision
                    </Switch>
                  </div>
                </div>
              </div>
            </Tab>

            {/* Logging Configuration */}
            <Tab key="logging" title="Logging">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Log Level"
                    selectedKeys={[config.logging?.level || 'info']}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      updateConfig('logging', 'level', selected);
                    }}
                  >
                    {LOG_LEVELS.map((level) => (
                      <SelectItem key={level.key}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Log Path"
                    placeholder="/path/to/logs"
                    value={config.logging?.logPath || ''}
                    onValueChange={(value) => updateConfig('logging', 'logPath', value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tensorboard Path"
                    placeholder="/path/to/tensorboard"
                    value={config.logging?.tensorboardPath || ''}
                    onValueChange={(value) => updateConfig('logging', 'tensorboardPath', value)}
                  />
                  <Input
                    label="Wandb Project"
                    placeholder="project-name"
                    value={config.logging?.wandbProject || ''}
                    onValueChange={(value) => updateConfig('logging', 'wandbProject', value)}
                  />
                </div>
                <div className="flex gap-4">
                  <Switch
                    isSelected={config.logging?.enableTensorboard}
                    onValueChange={(value) => updateConfig('logging', 'enableTensorboard', value)}
                  >
                    Enable Tensorboard
                  </Switch>
                  <Switch
                    isSelected={config.logging?.enableWandb}
                    onValueChange={(value) => updateConfig('logging', 'enableWandb', value)}
                  >
                    Enable Weights & Biases
                  </Switch>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Generated Config Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Generated Configuration</span>
                </div>
                <p className="text-sm text-default-500">
                  TOML configuration file for {config.sessionName}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {configPath && (
                    <div className="flex items-center gap-2 p-3 bg-success-50 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm text-success-700">
                        Configuration saved to: <Code className="text-xs">{configPath}</Code>
                      </span>
                    </div>
                  )}
                  <div className="relative">
                    <Code className="block w-full h-96 overflow-auto p-4 text-sm">
                      {generatedConfig}
                    </Code>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Copy className="h-4 w-4" />}
                  onPress={copyToClipboard}
                >
                  Copy
                </Button>
                <Button
                  color="primary"
                  startContent={<Download className="h-4 w-4" />}
                  onPress={downloadConfig}
                >
                  Download
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}