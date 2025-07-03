import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitDetailedContributionDto {
  @ApiProperty({
    description: 'Training session ID',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  sessionId: number;

  @ApiProperty({
    description: 'Participant wallet address',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  participant: string;

  @ApiProperty({
    description: 'Compute time contributed (in seconds)',
    example: 3600,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  computeTime: number;

  @ApiProperty({
    description: 'Quality score of gradients (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  gradientQuality: number;

  @ApiProperty({
    description: 'Amount of data transmitted (in KB)',
    example: 1024,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  dataTransmitted: number;

  @ApiProperty({
    description: 'Uptime ratio during training (0-100)',
    example: 95,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  uptimeRatio: number;
}