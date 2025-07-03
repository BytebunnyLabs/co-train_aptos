import { HttpException, HttpStatus } from '@nestjs/common';

export class HivemindException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

export class P2PNetworkException extends HivemindException {
  constructor(message: string) {
    super(`P2P Network Error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class NodeNotFoundException extends HivemindException {
  constructor(nodeId: string) {
    super(`Node not found: ${nodeId}`, HttpStatus.NOT_FOUND);
  }
}

export class NodeOfflineException extends HivemindException {
  constructor(nodeId: string) {
    super(`Node is offline: ${nodeId}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class NodeQuarantinedException extends HivemindException {
  constructor(nodeId: string, reason: string) {
    super(`Node is quarantined: ${nodeId} - ${reason}`, HttpStatus.FORBIDDEN);
  }
}

export class SessionNotFoundException extends HivemindException {
  constructor(sessionId: string) {
    super(`Training session not found: ${sessionId}`, HttpStatus.NOT_FOUND);
  }
}

export class SessionInactiveException extends HivemindException {
  constructor(sessionId: string) {
    super(`Training session is not active: ${sessionId}`, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientRewardsException extends HivemindException {
  constructor(available: number, required: number) {
    super(
      `Insufficient rewards: ${available} available, ${required} required`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class ContributionValidationException extends HivemindException {
  constructor(nodeId: string, reason: string) {
    super(
      `Invalid contribution from ${nodeId}: ${reason}`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class NetworkHealthException extends HivemindException {
  constructor(healthScore: number, threshold: number) {
    super(
      `Network health too low: ${healthScore}% (minimum: ${threshold}%)`,
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

export class DHTOperationException extends HivemindException {
  constructor(operation: string, error: string) {
    super(`DHT ${operation} failed: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class GradientValidationException extends HivemindException {
  constructor(nodeId: string, quality: number, threshold: number) {
    super(
      `Gradient quality too low from ${nodeId}: ${quality}% (minimum: ${threshold}%)`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class CheckpointException extends HivemindException {
  constructor(checkpointId: string, error: string) {
    super(`Checkpoint error ${checkpointId}: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class RewardDistributionException extends HivemindException {
  constructor(sessionId: string, error: string) {
    super(
      `Reward distribution failed for session ${sessionId}: ${error}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}