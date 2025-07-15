# CotrainCore Integration

CotrainCore is now fully integrated into the CoTrain monorepo as a core service for collaborative AI training.

## Overview

CotrainCore provides the core training functionality for the CoTrain platform, including:

- Training session management
- Configuration handling
- Real-time training monitoring
- Distributed training coordination
- Performance metrics collection

## Architecture

```
CotrainCore/
├── src/cotrain_core/          # Core Python modules
│   ├── main.py               # FastAPI server entry point
│   ├── training_manager.py   # Training session management
│   ├── config.py            # Configuration handling
│   ├── train.py             # Training logic
│   └── utils/               # Utility modules
├── configs/                  # Training configurations
├── Dockerfile               # Container configuration
└── pyproject.toml           # Python dependencies
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Configuration Management
- `GET /api/v1/configs` - List all configurations
- `GET /api/v1/configs/{id}` - Get specific configuration
- `POST /api/v1/configs/load` - Load configuration from file

### Training Management
- `POST /api/v1/training/start` - Start training session
- `POST /api/v1/training/{id}/stop` - Stop training session
- `POST /api/v1/training/{id}/pause` - Pause training session
- `POST /api/v1/training/{id}/resume` - Resume training session
- `GET /api/v1/training/{id}/status` - Get training status
- `GET /api/v1/training/sessions` - List all sessions
- `GET /api/v1/training/{id}/logs` - Get training logs

## Development

### Local Development

```bash
# Start CotrainCore service
pnpm dev:cotrain-core

# Start development environment
pnpm dev:cotrain-core-dev

# View logs
pnpm logs:cotrain-core
```

### Docker Commands

```bash
# Build CotrainCore image
pnpm build:cotrain-core

# Run with Docker Compose
docker-compose up cotrain-core

# Development mode
docker-compose -f docker-compose.dev.yml up cotrain-core-dev
```

### Testing

```bash
# Run tests
pnpm test:cotrain-core

# Or directly with pytest
cd CotrainCore && python -m pytest
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 8002)
- `DEBUG` - Debug mode (default: false)
- `BACKEND_URL` - Backend service URL
- `REDIS_URL` - Redis connection URL
- `CONFIG_PATH` - Configuration files path

### Docker Volumes

- `cotrain_core_data` - Training data storage
- `cotrain_core_checkpoints` - Model checkpoints storage

## Integration Status

✅ **Completed:**
- Monorepo workspace configuration
- Docker integration (production & development)
- FastAPI server with health checks
- Training manager implementation
- Frontend API client
- Environment variable configuration
- Package scripts and commands

🔄 **In Progress:**
- Real training implementation
- WebSocket support for real-time updates
- Advanced metrics collection

📋 **Planned:**
- Distributed training coordination
- Model versioning
- Performance optimization
- Advanced monitoring and alerting

## Frontend Integration

The frontend can interact with CotrainCore through the dedicated API client:

```typescript
import { cotrainCoreApi } from '@/services/api'

// Check service health
const health = await cotrainCoreApi.health()

// Start training
const session = await cotrainCoreApi.startTraining('config-id')

// Monitor training progress
const cleanup = await cotrainCoreApi.subscribeToUpdates(
  session.data.id,
  (data) => console.log('Training update:', data)
)
```

## Troubleshooting

### Common Issues

1. **Service not starting**: Check if port 8002 is available
2. **API connection failed**: Verify `NEXT_PUBLIC_COTRAIN_CORE_URL` environment variable
3. **Training fails**: Check Redis connection and configuration files

### Logs

```bash
# View CotrainCore logs
docker-compose logs -f cotrain-core

# View all services
docker-compose logs -f
```

## Contributing

When contributing to CotrainCore:

1. Follow the existing code structure
2. Add tests for new functionality
3. Update API documentation
4. Test Docker integration
5. Update this README if needed

## License

Same as the main CoTrain project - MIT License.