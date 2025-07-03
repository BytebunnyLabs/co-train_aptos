import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingSession, TrainingStatus } from './entities/training-session.entity';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User } from '../users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingSession)
    private readonly trainingRepository: Repository<TrainingSession>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createTrainingSessionDto: CreateTrainingSessionDto,
    user: User,
  ): Promise<TrainingSession> {
    const trainingSession = this.trainingRepository.create({
      ...createTrainingSessionDto,
      userId: user.id,
      status: TrainingStatus.PENDING,
    });

    const savedSession = await this.trainingRepository.save(trainingSession);

    // Emit event for training session creation
    this.eventEmitter.emit('training.created', savedSession);

    return savedSession;
  }

  async findAll(paginationDto: PaginationDto, user?: User) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.trainingRepository
      .createQueryBuilder('training')
      .leftJoinAndSelect('training.user', 'user')
      .leftJoinAndSelect('training.participants', 'participants');

    if (search) {
      queryBuilder.where(
        'training.title ILIKE :search OR training.description ILIKE :search',
        { search: `%${search}%` },
      );
    }

    // If user is provided, filter by user's sessions or public sessions
    if (user) {
      queryBuilder.andWhere(
        '(training.userId = :userId OR training.status IN (:...publicStatuses))',
        {
          userId: user.id,
          publicStatuses: [TrainingStatus.PENDING, TrainingStatus.RUNNING],
        },
      );
    }

    const [trainingSessions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('training.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: trainingSessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user?: User): Promise<TrainingSession> {
    const trainingSession = await this.trainingRepository.findOne({
      where: { id },
      relations: ['user', 'participants', 'participants.user'],
    });

    if (!trainingSession) {
      throw new NotFoundException('Training session not found');
    }

    // Check if user has access to this training session
    if (user && trainingSession.userId !== user.id) {
      // Allow access to public sessions
      const publicStatuses = [TrainingStatus.PENDING, TrainingStatus.RUNNING];
      if (!publicStatuses.includes(trainingSession.status)) {
        throw new ForbiddenException('Access denied to this training session');
      }
    }

    return trainingSession;
  }

  async update(
    id: string,
    updateTrainingSessionDto: UpdateTrainingSessionDto,
    user: User,
  ): Promise<TrainingSession> {
    const trainingSession = await this.findOne(id, user);

    // Only the owner can update the training session
    if (trainingSession.userId !== user.id) {
      throw new ForbiddenException('Only the owner can update this training session');
    }

    // Prevent updating completed or failed sessions
    if ([TrainingStatus.COMPLETED, TrainingStatus.FAILED].includes(trainingSession.status)) {
      throw new BadRequestException('Cannot update completed or failed training sessions');
    }

    Object.assign(trainingSession, updateTrainingSessionDto);
    const updatedSession = await this.trainingRepository.save(trainingSession);

    // Emit event for training session update
    this.eventEmitter.emit('training.updated', updatedSession);

    return updatedSession;
  }

  async remove(id: string, user: User): Promise<void> {
    const trainingSession = await this.findOne(id, user);

    // Only the owner can delete the training session
    if (trainingSession.userId !== user.id) {
      throw new ForbiddenException('Only the owner can delete this training session');
    }

    // Prevent deleting running sessions
    if (trainingSession.status === TrainingStatus.RUNNING) {
      throw new BadRequestException('Cannot delete running training sessions');
    }

    await this.trainingRepository.remove(trainingSession);

    // Emit event for training session deletion
    this.eventEmitter.emit('training.deleted', { id, userId: user.id });
  }

  async startTraining(id: string, user: User): Promise<TrainingSession> {
    const trainingSession = await this.findOne(id, user);

    if (trainingSession.userId !== user.id) {
      throw new ForbiddenException('Only the owner can start this training session');
    }

    if (trainingSession.status !== TrainingStatus.PENDING) {
      throw new BadRequestException('Training session is not in pending status');
    }

    trainingSession.status = TrainingStatus.RUNNING;
    trainingSession.startedAt = new Date();

    const updatedSession = await this.trainingRepository.save(trainingSession);

    // Emit event for training session start
    this.eventEmitter.emit('training.started', updatedSession);

    return updatedSession;
  }

  async pauseTraining(id: string, user: User): Promise<TrainingSession> {
    const trainingSession = await this.findOne(id, user);

    if (trainingSession.userId !== user.id) {
      throw new ForbiddenException('Only the owner can pause this training session');
    }

    if (trainingSession.status !== TrainingStatus.RUNNING) {
      throw new BadRequestException('Training session is not running');
    }

    trainingSession.status = TrainingStatus.PAUSED;
    const updatedSession = await this.trainingRepository.save(trainingSession);

    // Emit event for training session pause
    this.eventEmitter.emit('training.paused', updatedSession);

    return updatedSession;
  }

  async completeTraining(id: string, user: User): Promise<TrainingSession> {
    const trainingSession = await this.findOne(id, user);

    if (trainingSession.userId !== user.id) {
      throw new ForbiddenException('Only the owner can complete this training session');
    }

    if (![TrainingStatus.RUNNING, TrainingStatus.PAUSED].includes(trainingSession.status)) {
      throw new BadRequestException('Training session is not in a completable state');
    }

    trainingSession.status = TrainingStatus.COMPLETED;
    trainingSession.completedAt = new Date();
    trainingSession.progress = 100;

    const updatedSession = await this.trainingRepository.save(trainingSession);

    // Emit event for training session completion
    this.eventEmitter.emit('training.completed', updatedSession);

    return updatedSession;
  }

  async updateProgress(id: string, progress: number): Promise<TrainingSession> {
    const trainingSession = await this.trainingRepository.findOne({ where: { id } });

    if (!trainingSession) {
      throw new NotFoundException('Training session not found');
    }

    trainingSession.progress = Math.min(100, Math.max(0, progress));
    return this.trainingRepository.save(trainingSession);
  }

  async getStatistics(user?: User) {
    const queryBuilder = this.trainingRepository.createQueryBuilder('training');

    if (user) {
      queryBuilder.where('training.userId = :userId', { userId: user.id });
    }

    const total = await queryBuilder.getCount();
    const completed = await queryBuilder
      .andWhere('training.status = :status', { status: TrainingStatus.COMPLETED })
      .getCount();
    const running = await queryBuilder
      .andWhere('training.status = :status', { status: TrainingStatus.RUNNING })
      .getCount();
    const pending = await queryBuilder
      .andWhere('training.status = :status', { status: TrainingStatus.PENDING })
      .getCount();

    return {
      total,
      completed,
      running,
      pending,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  async getTrainingHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [sessions, total] = await this.trainingRepository.findAndCount({
      where: { userId },
      relations: ['participants', 'participants.user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async joinSession(sessionId: string, userId: string): Promise<TrainingSession> {
    const session = await this.trainingRepository.findOne({
      where: { id: sessionId },
      relations: ['participants', 'participants.user'],
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    if (session.status !== TrainingStatus.PENDING) {
      throw new BadRequestException('Cannot join session that is not pending');
    }

    // Check if user is already a participant
    const isAlreadyParticipant = session.participants.some(
      participant => participant.user.id === userId
    );

    if (isAlreadyParticipant) {
      throw new BadRequestException('User is already a participant in this session');
    }

    // Check if session has reached maximum participants
    if (session.participants.length >= session.maxParticipants) {
      throw new BadRequestException('Session has reached maximum participants');
    }

    // Create new participant (assuming you have a participant entity)
    // This is a simplified implementation - you may need to adjust based on your participant entity structure
    const participant = {
      sessionId: session.id,
      userId: userId,
      joinedAt: new Date(),
      status: 'active',
    };

    // Add participant to session
    // Note: This assumes you have a participants repository or service
    // You may need to inject and use it here
    
    // Emit event for user joining session
    this.eventEmitter.emit('training.userJoined', {
      sessionId: session.id,
      userId: userId,
      session: session,
    });

    return session;
  }
}