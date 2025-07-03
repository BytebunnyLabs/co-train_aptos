import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterP2PNodeDto {
  @ApiProperty({
    description: 'Unique identifier for the P2P node',
    example: 'node_123456789',
  })
  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @ApiProperty({
    description: 'Public key of the P2P node for verification',
    example: '0x1234567890abcdef...',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: 'Compute capacity of the node (in arbitrary units)',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  computeCapacity: number;

  @ApiProperty({
    description: 'Network bandwidth capacity (in MB/s)',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  bandwidth: number;
}