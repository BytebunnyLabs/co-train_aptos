/**
 * HeroUI 迁移助手
 * 用于帮助从 shadcn/ui 组件迁移到 HeroUI 组件
 */

// 组件映射表
export const componentMigrationMap = {
  // Button 组件
  button: {
    from: '@/components/cotrain/ui/button',
    to: '@/components/heroui/button',
    status: 'completed', // completed | in-progress | pending
    notes: 'Button 组件已完成迁移，支持所有 shadcn 变体和尺寸',
  },
  // Card 组件
  card: {
    from: '@/components/cotrain/ui/card',
    to: '@/components/heroui/card',
    status: 'completed',
    notes: 'Card 组件已完成迁移，支持所有 shadcn 子组件和 HeroUI 增强功能',
  },
  input: {
    from: '@/components/cotrain/ui/input',
    to: '@/components/heroui/input',
    status: 'completed',
    notes: 'Input 组件已完成迁移，支持 shadcn 兼容模式和 HeroUI 增强功能',
  },
  dialog: {
    from: '@/components/cotrain/ui/dialog',
    to: '@/components/heroui/modal',
    status: 'pending',
    notes: 'Dialog 将映射到 HeroUI Modal',
  },
  dropdown: {
    from: '@/components/cotrain/ui/dropdown-menu',
    to: '@/components/heroui/dropdown',
    status: 'pending',
    notes: 'DropdownMenu 将映射到 HeroUI Dropdown',
  },
  toast: {
    from: '@/components/cotrain/ui/toast',
    to: '@/components/heroui/toast',
    status: 'pending',
    notes: 'Toast 组件待迁移',
  },
  alert: {
    from: '@/components/cotrain/ui/alert',
    to: '@/components/heroui/alert',
    status: 'pending',
    notes: 'Alert 组件待迁移',
  },
  table: {
    from: '@/components/cotrain/ui/table',
    to: '@/components/heroui/table',
    status: 'pending',
    notes: 'Table 组件待迁移',
  },
  badge: {
    from: '@/components/cotrain/ui/badge',
    to: '@/components/heroui/chip',
    status: 'pending',
    notes: 'Badge 将映射到 HeroUI Chip',
  },
  progress: {
    from: '@/components/cotrain/ui/progress',
    to: '@/components/heroui/progress',
    status: 'pending',
    notes: 'Progress 组件待迁移',
  },
  avatar: {
    from: '@/components/cotrain/ui/avatar',
    to: '@/components/heroui/avatar',
    status: 'pending',
    notes: 'Avatar 组件待迁移',
  },
  select: {
    from: '@/components/cotrain/ui/select',
    to: '@/components/heroui/select',
    status: 'pending',
    notes: 'Select 组件待迁移',
  },
  checkbox: {
    from: '@/components/cotrain/ui/checkbox',
    to: '@/components/heroui/checkbox',
    status: 'pending',
    notes: 'Checkbox 组件待迁移',
  },
  switch: {
    from: '@/components/cotrain/ui/switch',
    to: '@/components/heroui/switch',
    status: 'pending',
    notes: 'Switch 组件待迁移',
  },
  radio: {
    from: '@/components/cotrain/ui/radio-group',
    to: '@/components/heroui/radio',
    status: 'pending',
    notes: 'RadioGroup 将映射到 HeroUI Radio',
  },
  textarea: {
    from: '@/components/cotrain/ui/textarea',
    to: '@/components/heroui/textarea',
    status: 'pending',
    notes: 'Textarea 组件待迁移',
  },
  tabs: {
    from: '@/components/cotrain/ui/tabs',
    to: '@/components/heroui/tabs',
    status: 'pending',
    notes: 'Tabs 组件待迁移',
  },
  accordion: {
    from: '@/components/cotrain/ui/accordion',
    to: '@/components/heroui/accordion',
    status: 'pending',
    notes: 'Accordion 组件待迁移',
  },
  separator: {
    from: '@/components/cotrain/ui/separator',
    to: '@/components/heroui/divider',
    status: 'pending',
    notes: 'Separator 将映射到 HeroUI Divider',
  },
  skeleton: {
    from: '@/components/cotrain/ui/skeleton',
    to: '@/components/heroui/skeleton',
    status: 'pending',
    notes: 'Skeleton 组件待迁移',
  },
};

// 获取迁移状态统计
export function getMigrationStats() {
  const components = Object.values(componentMigrationMap);
  const total = components.length;
  const completed = components.filter(c => c.status === 'completed').length;
  const inProgress = components.filter(c => c.status === 'in-progress').length;
  const pending = components.filter(c => c.status === 'pending').length;
  
  return {
    total,
    completed,
    inProgress,
    pending,
    completionRate: Math.round((completed / total) * 100),
  };
}

// 获取下一个要迁移的组件
export function getNextMigrationTarget() {
  const pendingComponents = Object.entries(componentMigrationMap)
    .filter(([_, config]) => config.status === 'pending');
  
  if (pendingComponents.length === 0) {
    return null;
  }
  
  // 按优先级排序（可以根据需要调整）
  const priorityOrder = [
    'card', 'input', 'dialog', 'dropdown', 'toast', 'alert', 
    'table', 'badge', 'progress', 'avatar', 'select', 'checkbox', 
    'switch', 'radio', 'textarea', 'tabs', 'accordion', 'separator', 'skeleton'
  ];
  
  for (const priority of priorityOrder) {
    const found = pendingComponents.find(([name]) => name === priority);
    if (found) {
      return {
        name: found[0],
        config: found[1],
      };
    }
  }
  
  return {
    name: pendingComponents[0][0],
    config: pendingComponents[0][1],
  };
}

// 更新组件迁移状态
export function updateMigrationStatus(componentName: string, status: 'completed' | 'in-progress' | 'pending', notes?: string) {
  if (componentMigrationMap[componentName as keyof typeof componentMigrationMap]) {
    componentMigrationMap[componentName as keyof typeof componentMigrationMap].status = status;
    if (notes) {
      componentMigrationMap[componentName as keyof typeof componentMigrationMap].notes = notes;
    }
  }
}

// 生成迁移报告
export function generateMigrationReport() {
  const stats = getMigrationStats();
  const nextTarget = getNextMigrationTarget();
  
  return {
    stats,
    nextTarget,
    components: componentMigrationMap,
    recommendations: [
      '优先迁移使用频率高的组件（Button, Card, Input）',
      '每次迁移一个组件，确保充分测试',
      '保持向后兼容性，逐步替换引用',
      '更新文档和类型定义',
    ],
  };
}

// 文件替换助手
export const fileReplacementPatterns = {
  button: {
    importPattern: /import.*Button.*from.*['"]\/components\/cotrain\/ui\/button['"]/g,
    newImport: "import { Button } from '@/components/heroui/button';",
  },
  card: {
    importPattern: /import.*Card.*from.*['"]\/components\/cotrain\/ui\/card['"]/g,
    newImport: "import { Card } from '@/components/heroui/card';",
  },
  input: {
    importPattern: /import.*Input.*from.*['"]\/components\/cotrain\/ui\/input['"]/g,
    newImport: "import { Input } from '@/components/heroui/input';",
  },
  // 可以添加更多组件的替换模式
};

// 验证迁移完整性
export function validateMigration(componentName: string) {
  const component = componentMigrationMap[componentName as keyof typeof componentMigrationMap];
  if (!component) {
    return {
      valid: false,
      errors: [`组件 ${componentName} 不在迁移映射中`],
    };
  }
  
  const errors: string[] = [];
  
  // 检查状态
  if (!['completed', 'in-progress', 'pending'].includes(component.status)) {
    errors.push(`无效的状态: ${component.status}`);
  }
  
  // 检查路径
  if (!component.from || !component.to) {
    errors.push('缺少源路径或目标路径');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}