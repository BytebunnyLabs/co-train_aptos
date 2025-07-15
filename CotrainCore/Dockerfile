FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 复制项目配置文件
COPY pyproject.toml uv.lock ./

# 安装 uv 包管理器
RUN pip install uv

# 安装 Python 依赖
RUN uv sync --frozen

# 复制源代码
COPY src/ ./src/
COPY configs/ ./configs/
COPY scripts/ ./scripts/

# 创建数据和检查点目录
RUN mkdir -p /app/data /app/checkpoints

# 创建非 root 用户
RUN useradd -m -u 1000 cotrain && chown -R cotrain:cotrain /app
USER cotrain

# 暴露端口
EXPOSE 8002

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8002/health')" || exit 1

# 启动命令
CMD ["python", "src/cotrain_core/main.py"]