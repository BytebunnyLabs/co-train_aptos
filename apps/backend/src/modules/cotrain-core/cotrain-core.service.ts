import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

export interface PythonProcessConfig {
  scriptPath: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ProcessStatus {
  pid?: number;
  status: 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime?: Date;
  endTime?: Date;
  exitCode?: number;
  error?: string;
}

@Injectable()
export class CotrainCoreService extends EventEmitter {
  private readonly logger = new Logger(CotrainCoreService.name);
  private processes: Map<string, ChildProcess> = new Map();
  private processStatus: Map<string, ProcessStatus> = new Map();
  private readonly defaultTimeout = 300000; // 5分钟超时

  constructor() {
    super();
  }

  /**
   * 启动Python进程
   */
  async startPythonProcess(
    processId: string,
    config: PythonProcessConfig,
  ): Promise<void> {
    if (this.processes.has(processId)) {
      throw new Error(`Process ${processId} is already running`);
    }

    this.updateProcessStatus(processId, {
      status: 'starting',
      startTime: new Date(),
    });

    try {
      const pythonPath = this.findPythonExecutable();
      const args = [config.scriptPath, ...(config.args || [])];
      
      const childProcess = spawn(pythonPath, args, {
        cwd: config.cwd || process.cwd(),
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.processes.set(processId, childProcess);
      this.setupProcessHandlers(processId, childProcess, config.timeout);

      this.logger.log(`Started Python process ${processId} with PID ${childProcess.pid}`);
      
      this.updateProcessStatus(processId, {
        pid: childProcess.pid,
        status: 'running',
      });

      this.emit('processStarted', { processId, pid: childProcess.pid });
    } catch (error) {
      this.logger.error(`Failed to start process ${processId}:`, error);
      this.updateProcessStatus(processId, {
        status: 'error',
        error: error.message,
        endTime: new Date(),
      });
      throw error;
    }
  }

  /**
   * 停止Python进程
   */
  async stopPythonProcess(processId: string, force = false): Promise<void> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    this.updateProcessStatus(processId, { status: 'stopping' });

    try {
      if (force) {
        process.kill('SIGKILL');
      } else {
        process.kill('SIGTERM');
        
        // 等待进程优雅退出，超时后强制杀死
        setTimeout(() => {
          if (!process.killed) {
            this.logger.warn(`Force killing process ${processId}`);
            process.kill('SIGKILL');
          }
        }, 5000);
      }

      this.logger.log(`Stopped Python process ${processId}`);
    } catch (error) {
      this.logger.error(`Failed to stop process ${processId}:`, error);
      throw error;
    }
  }

  /**
   * 获取进程状态
   */
  getProcessStatus(processId: string): ProcessStatus | undefined {
    return this.processStatus.get(processId);
  }

  /**
   * 获取所有进程状态
   */
  getAllProcessStatus(): Record<string, ProcessStatus> {
    const result: Record<string, ProcessStatus> = {};
    this.processStatus.forEach((status, id) => {
      result[id] = status;
    });
    return result;
  }

  /**
   * 向进程发送数据
   */
  sendToProcess(processId: string, data: string): void {
    const process = this.processes.get(processId);
    if (!process || !process.stdin) {
      throw new Error(`Process ${processId} not found or stdin not available`);
    }

    process.stdin.write(data + '\n');
  }

  /**
   * 清理已结束的进程
   */
  cleanupProcess(processId: string): void {
    this.processes.delete(processId);
    // 保留状态信息用于查询
  }

  /**
   * 清理所有进程
   */
  async cleanup(): Promise<void> {
    const promises = Array.from(this.processes.keys()).map(processId =>
      this.stopPythonProcess(processId, true).catch(err =>
        this.logger.error(`Failed to cleanup process ${processId}:`, err)
      )
    );

    await Promise.all(promises);
    this.processes.clear();
  }

  private setupProcessHandlers(
    processId: string,
    childProcess: ChildProcess,
    timeout?: number,
  ): void {
    // 设置超时
    const timeoutMs = timeout || this.defaultTimeout;
    const timeoutHandle = setTimeout(() => {
      this.logger.warn(`Process ${processId} timed out, killing...`);
      childProcess.kill('SIGKILL');
    }, timeoutMs);

    // 监听标准输出
    childProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      this.logger.debug(`Process ${processId} stdout: ${output}`);
      this.emit('processOutput', { processId, type: 'stdout', data: output });
    });

    // 监听标准错误
    childProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      this.logger.debug(`Process ${processId} stderr: ${output}`);
      this.emit('processOutput', { processId, type: 'stderr', data: output });
    });

    // 监听进程退出
    childProcess.on('exit', (code, signal) => {
      clearTimeout(timeoutHandle);
      
      this.logger.log(
        `Process ${processId} exited with code ${code}, signal ${signal}`,
      );
      
      this.updateProcessStatus(processId, {
        status: 'stopped',
        exitCode: code,
        endTime: new Date(),
      });

      this.emit('processExit', { processId, code, signal });
      this.cleanupProcess(processId);
    });

    // 监听进程错误
    childProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      
      this.logger.error(`Process ${processId} error:`, error);
      
      this.updateProcessStatus(processId, {
        status: 'error',
        error: error.message,
        endTime: new Date(),
      });

      this.emit('processError', { processId, error });
      this.cleanupProcess(processId);
    });
  }

  private updateProcessStatus(
    processId: string,
    update: Partial<ProcessStatus>,
  ): void {
    const current = this.processStatus.get(processId) || { status: 'idle' };
    this.processStatus.set(processId, { ...current, ...update });
  }

  private findPythonExecutable(): string {
    // 尝试找到Python可执行文件
    const candidates = ['python3', 'python', 'python3.9', 'python3.8'];
    
    for (const candidate of candidates) {
      try {
        const { execSync } = require('child_process');
        execSync(`which ${candidate}`, { stdio: 'ignore' });
        return candidate;
      } catch {
        continue;
      }
    }

    throw new Error('Python executable not found');
  }
}