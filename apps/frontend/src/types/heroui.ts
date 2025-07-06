import type { ComponentProps } from 'react';
import type {
  Button,
  Card,
  Input,
  Navbar,
  Dropdown,
  Modal,
  Chip,
  Progress,
  Avatar,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  Textarea,
  Tabs,
  Accordion,
  Divider,
  Skeleton,
  Table,
  Alert,
} from '@heroui/react';

// HeroUI 组件类型定义
export type HeroUIButtonProps = ComponentProps<typeof Button>;
export type HeroUICardProps = ComponentProps<typeof Card>;
export type HeroUIInputProps = ComponentProps<typeof Input>;
export type HeroUINavbarProps = ComponentProps<typeof Navbar>;
export type HeroUIDropdownProps = ComponentProps<typeof Dropdown>;
export type HeroUIModalProps = ComponentProps<typeof Modal>;
export type HeroUIChipProps = ComponentProps<typeof Chip>;
export type HeroUIProgressProps = ComponentProps<typeof Progress>;
export type HeroUIAvatarProps = ComponentProps<typeof Avatar>;
export type HeroUISelectProps = ComponentProps<typeof Select>;
export type HeroUICheckboxProps = ComponentProps<typeof Checkbox>;
export type HeroUISwitchProps = ComponentProps<typeof Switch>;
export type HeroUIRadioGroupProps = ComponentProps<typeof RadioGroup>;
export type HeroUITextareaProps = ComponentProps<typeof Textarea>;
export type HeroUITabsProps = ComponentProps<typeof Tabs>;
export type HeroUIAccordionProps = ComponentProps<typeof Accordion>;
export type HeroUIDividerProps = ComponentProps<typeof Divider>;
export type HeroUISkeletonProps = ComponentProps<typeof Skeleton>;
export type HeroUITableProps = ComponentProps<typeof Table>;
export type HeroUIAlertProps = ComponentProps<typeof Alert>;

// 组件变体类型
export type ButtonVariant = 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
export type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

export type CardVariant = 'shadow' | 'bordered' | 'flat';
export type CardRadius = 'none' | 'sm' | 'md' | 'lg';

export type InputVariant = 'flat' | 'bordered' | 'underlined' | 'faded';
export type InputColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

// 主题相关类型
export type ThemeColors = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  foreground: string;
};

export type ComponentTheme = {
  light: ThemeColors;
  dark: ThemeColors;
};

// 组件映射类型
export interface ComponentMapping {
  // Shadcn/Radix -> HeroUI 映射
  'shadcn/button': 'heroui/button';
  'radix/dialog': 'heroui/modal';
  'radix/dropdown-menu': 'heroui/dropdown';
  'radix/navigation-menu': 'heroui/navbar';
  'radix/select': 'heroui/select';
  'radix/checkbox': 'heroui/checkbox';
  'radix/switch': 'heroui/switch';
  'radix/radio-group': 'heroui/radio-group';
  'radix/tabs': 'heroui/tabs';
  'radix/accordion': 'heroui/accordion';
  'radix/toast': 'heroui/toast';
  'radix/progress': 'heroui/progress';
  'radix/avatar': 'heroui/avatar';
  'radix/separator': 'heroui/divider';
  'custom/card': 'heroui/card';
  'custom/input': 'heroui/input';
  'custom/textarea': 'heroui/textarea';
  'custom/badge': 'heroui/chip';
  'custom/alert': 'heroui/alert';
  'custom/table': 'heroui/table';
  'custom/skeleton': 'heroui/skeleton';
}

// 迁移状态类型
export type MigrationStatus = 'pending' | 'in-progress' | 'completed' | 'testing' | 'failed';

export interface ComponentMigrationInfo {
  component: keyof ComponentMapping;
  status: MigrationStatus;
  oldPath: string;
  newPath: string;
  dependencies: string[];
  notes?: string;
}

// 表单相关类型
export interface FormFieldProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
}

// 导航相关类型
export interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  isDisabled?: boolean;
}

export interface NavbarConfig {
  brand?: {
    name: string;
    logo?: React.ReactNode;
    href?: string;
  };
  items: NavItem[];
  actions?: React.ReactNode[];
}

// 数据表格类型
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'start' | 'center' | 'end';
  render?: (item: T) => React.ReactNode;
}

export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  selectionMode?: 'none' | 'single' | 'multiple';
  sortDescriptor?: {
    column: string;
    direction: 'ascending' | 'descending';
  };
  onSelectionChange?: (keys: Set<string>) => void;
  onSortChange?: (descriptor: { column: string; direction: 'ascending' | 'descending' }) => void;
}