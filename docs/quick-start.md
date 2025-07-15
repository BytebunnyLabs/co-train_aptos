# CoTrain Quick Start Guide

This guide will help you get the CoTrain platform up and running with all services, including the newly integrated CotrainCore.

## 🚀 One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/BytebunnyLabs/co-train_aptos.git
cd co-train_aptos
pnpm setup
```

## 🏃‍♂️ Quick Development Start

### Option 1: Start All Services (Recommended)

```bash
# Start all services including databases, backend, frontend, CotrainCore, and Hivemind
pnpm dev:all
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **CotrainCore API**: http://localhost:8002
- **Hivemind Service**: http://localhost:8001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO**: http://localhost:9000

### Option 2: Start Services Individually

```bash
# Start databases first
pnpm db:start

# Start each service in separate terminals
pnpm dev:frontend        # Terminal 1
pnpm dev:backend         # Terminal 2
pnpm dev:cotrain-core    # Terminal 3
pnpm dev:hivemind        # Terminal 4
```

## 🔍 Service Health Checks

Once all services are running, verify they're working:

```bash
# Check frontend
curl http://localhost:3000

# Check backend API
curl http://localhost:3001/health

# Check CotrainCore API
curl http://localhost:8002/health

# Check Hivemind service
curl http://localhost:8001/health
```

## 📊 API Documentation

- **Backend API**: http://localhost:3001/api/docs
- **CotrainCore API**: http://localhost:8002/docs
- **Hivemind API**: http://localhost:8001/docs

## 🧪 Testing the Integration

### 1. Test CotrainCore API

```bash
# List available configurations
curl http://localhost:8002/api/v1/configs

# Check training sessions
curl http://localhost:8002/api/v1/training/sessions
```

### 2. Test Frontend Integration

1. Open http://localhost:3000
2. Navigate to the training dashboard
3. Try creating a new training session
4. Monitor the training progress

### 3. Test Backend Integration

```bash
# Test backend connection to CotrainCore
curl -X POST http://localhost:3001/api/v1/training/sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "test-session", "config": "default"}'
```

## 🛠️ Development Workflow

### Making Changes to CotrainCore

1. **Edit Python code** in `CotrainCore/src/cotrain_core/`
2. **Restart the service**:
   ```bash
   docker-compose restart cotrain-core-dev
   ```
3. **View logs**:
   ```bash
   pnpm logs:cotrain-core
   ```

### Making Changes to Frontend

1. **Edit React components** in `apps/frontend/src/`
2. **Hot reload** is automatic
3. **Test CotrainCore integration** in the browser

### Making Changes to Backend

1. **Edit NestJS code** in `apps/backend/src/`
2. **Hot reload** is automatic
3. **Test API endpoints** with curl or Postman

## 🔧 Common Development Tasks

### Reset Everything

```bash
# Stop all services
docker-compose down

# Reset databases
pnpm db:reset

# Restart all services
pnpm dev:all
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
pnpm logs:cotrain-core
pnpm logs:hivemind
docker-compose logs -f backend-dev
```

### Run Tests

```bash
# All tests
pnpm test

# Specific service tests
pnpm test:cotrain-core
pnpm test:hivemind
pnpm --filter '@cotrain/backend' test
pnpm --filter '@cotrain/frontend' test
```

## 🐛 Troubleshooting

### Port Conflicts

If you get port conflicts, check what's running:

```bash
# Check port usage
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :8002  # CotrainCore
lsof -i :8001  # Hivemind
```

### Service Not Starting

1. **Check Docker is running**
2. **Check logs**: `docker-compose logs [service-name]`
3. **Restart specific service**: `docker-compose restart [service-name]`
4. **Rebuild if needed**: `docker-compose build [service-name]`

### Database Issues

```bash
# Reset databases
pnpm db:reset

# Check database status
pnpm db:status

# Manual migration
pnpm db:migrate
```

### CotrainCore Issues

```bash
# Check Python dependencies
cd CotrainCore
pip install -r requirements.txt

# Check configuration
ls -la CotrainCore/configs/

# Rebuild Docker image
docker-compose build cotrain-core-dev
```

## 📚 Next Steps

1. **Read the documentation**:
   - [CotrainCore README](./CotrainCore/README.md)
   - [API Documentation](./docs/api/README.md)
   - [Frontend Guide](./apps/frontend/README.md)
   - [Backend Guide](./apps/backend/README.md)

2. **Explore the codebase**:
   - Check out the training workflows
   - Understand the API integrations
   - Review the smart contracts

3. **Start developing**:
   - Add new training algorithms
   - Enhance the UI/UX
   - Integrate additional blockchain features

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/BytebunnyLabs/co-train_aptos/issues)
- **Discussions**: [GitHub Discussions](https://github.com/BytebunnyLabs/co-train_aptos/discussions)
- **Discord**: [Join our community](https://discord.gg/cotrain)

---

**Happy coding! 🚀**