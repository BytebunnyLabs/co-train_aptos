'use client';

import React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Chip,
  Progress,
  Avatar,
  Divider,
} from '@heroui/react';

/**
 * HeroUI 测试组件
 * 用于验证 HeroUI 环境配置是否正确
 */
export function HeroUITestComponents() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">HeroUI 组件测试</h1>
      
      {/* Button 测试 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Button 组件</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Button color="primary">Primary</Button>
            <Button color="secondary">Secondary</Button>
            <Button color="success">Success</Button>
            <Button color="warning">Warning</Button>
            <Button color="danger">Danger</Button>
            <Button variant="bordered">Bordered</Button>
            <Button variant="light">Light</Button>
            <Button variant="flat">Flat</Button>
            <Button variant="ghost">Ghost</Button>
            <Button isLoading>Loading</Button>
          </div>
        </CardBody>
      </Card>

      {/* Input 测试 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Input 组件</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default Input"
              placeholder="Enter your text"
            />
            <Input
              label="Primary Input"
              color="primary"
              placeholder="Primary color"
            />
            <Input
              label="Success Input"
              color="success"
              placeholder="Success state"
            />
            <Input
              label="Error Input"
              color="danger"
              placeholder="Error state"
              isInvalid
              errorMessage="This field is required"
            />
          </div>
        </CardBody>
      </Card>

      {/* Chip 测试 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Chip 组件</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Chip>Default</Chip>
            <Chip color="primary">Primary</Chip>
            <Chip color="secondary">Secondary</Chip>
            <Chip color="success">Success</Chip>
            <Chip color="warning">Warning</Chip>
            <Chip color="danger">Danger</Chip>
            <Chip variant="bordered">Bordered</Chip>
            <Chip variant="light">Light</Chip>
            <Chip variant="flat">Flat</Chip>
          </div>
        </CardBody>
      </Card>

      {/* Progress 测试 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Progress 组件</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Progress value={30} color="primary" label="Primary Progress" />
            <Progress value={50} color="success" label="Success Progress" />
            <Progress value={70} color="warning" label="Warning Progress" />
            <Progress value={90} color="danger" label="Danger Progress" />
          </div>
        </CardBody>
      </Card>

      {/* Avatar 测试 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Avatar 组件</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar name="John Doe" />
            <Avatar name="Jane Smith" color="primary" />
            <Avatar name="Bob Johnson" color="secondary" />
            <Avatar name="Alice Brown" color="success" />
            <Avatar name="Charlie Wilson" color="warning" />
            <Avatar name="Diana Davis" color="danger" />
            <Avatar 
              src="https://i.pravatar.cc/150?u=a042581f4e29026024d" 
              name="Avatar with Image" 
            />
          </div>
        </CardBody>
      </Card>

      <Divider />
      
      <div className="text-center text-sm text-gray-500">
        ✅ 如果以上组件正常显示，说明 HeroUI 环境配置成功！
      </div>
    </div>
  );
}

export default HeroUITestComponents;