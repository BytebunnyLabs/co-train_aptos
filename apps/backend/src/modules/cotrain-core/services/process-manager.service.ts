import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export interface PythonProcessConfig {
  scriptPath: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ProcessInfo {
  id: string;
  pid?: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  error?: string;
}

@Injectable()
export class ProcessManagerService extends EventEmitter {
  private readonly logger = new Logger(ProcessManagerService.name);
  private processes: Map<string, ChildProcess> = new Map();
  private processInfo: Map<string, ProcessInfo> = new Map();

  /**
   * 启动Python进程
   */
  async startPythonProcess(processId: string, config: PythonProcessConfig): Promise<void> {
    if (this.processes.has(processId)) {
      throw new Error(`Process ${processId} already exists`);
    }

    const processInfo: ProcessInfo = {
      id: processId,
      status: 'starting',
      startTime: new Date(),
    };

    this.processInfo.set(processId, processInfo);

    try {
      const env = {
        ...process.env,
        ...config.env,
      };

      const childProcess = spawn('python', [config.scriptPath, ...config.args], {
        cwd: config.cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.processes.set(processId, childProcess);
      processInfo.pid = childProcess.pid;
      processInfo.status = 'running';
      this.processInfo.set(processId, processInfo);

      // 监听进程输出
      childProcess.stdout?.on('data', (data) => {
        this.emit('processOutput', processId, data.toString());
      });

      childProcess.stderr?.on('data', (data) => {
        this.emit('processError', processId, data.toString());
      });

      // 监听进程退出
      childProcess.on('exit', (code, signal) => {
        processInfo.status = 'stopped';
        processInfo.endTime = new Date();
        processInfo.exitCode = code || 0;
        this.processInfo.set(processId, processInfo);
        this.processes.delete(processId);
        this.emit('processExit', processId, code, signal);
      });

      childProcess.on('error', (error) => {
        processInfo.status = 'error';
        processInfo.endTime = new Date();
        processInfo.error = error.message;
        this.processInfo.set(processId, processInfo);
        this.processes.delete(processId);
        this.emit('processError', processId, error.message);
      });

      // 设置超时
      if (config.timeout) {
        setTimeout(() => {
          if (this.processes.has(processId)) {
            this.stopPythonProcess(processId, true);
          }
        }, config.timeout);
      }

      this.logger.log(`Started Python process ${processId} with PID ${childProcess.pid}`);
    } catch (error) {
      processInfo.status = 'error';
      processInfo.endTime = new Date();
      processInfo.error = error.message;
      this.processInfo.set(processId, processInfo);
      this.logger.error(`Failed to start Python process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * 停止Python进程
   */
  async stopPythonProcess(processId: string, force = false): Promise<void> {
    const childProcess = this.processes.get(processId);
    if (!childProcess) {
      throw new Error(`Process ${processId} not found`);
    }

    try {
      if (force) {
        childProcess.kill('SIGKILL');
      } else {
        childProcess.kill('SIGTERM');
        
        // 如果5秒后还没退出，强制杀死
        setTimeout(() => {
          if (this.processes.has(processId)) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);
      }

      this.logger.log(`Stopped Python process ${processId}`);
    } catch (error) {
      this.logger.error(`Failed to stop Python process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * 获取进程信息
   */
  getProcessInfo(processId: string): ProcessInfo | undefined {
    return this.processInfo.get(processId);
  }

  /**
   * 获取所有进程信息
   */
  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processInfo.values());
  }

  /**
   * 清理已完成的进程信息
   */
  cleanupProcesses(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [processId, info] of this.processInfo.entries()) {
      if (info.status === 'stopped' || info.status === 'error') {
        if (info.endTime && info.endTime < oneHourAgo) {
          this.processInfo.delete(processId);
        }
      }
    }
  }

  /**
   * 停止所有进程
   */
  async stopAllProcesses(): Promise<void> {
    const processIds = Array.from(this.processes.keys());
    await Promise.all(
      processIds.map(processId => this.stopPythonProcess(processId, true))
    );
  }
}