import numpy as np
import pandas as pd
from fastapi import FastAPI


# --- Data Generation Functions (from our previous steps) ---

def generate_three_phase_loss(num_steps, initial_loss, final_loss, rapid_decay_weight=0.8, rapid_decay_rate=50.0,
                              steady_decay_rate=2.0):
    """Generates a realistic three-phase loss curve."""
    steps = np.arange(num_steps)
    total_loss_drop = initial_loss - final_loss
    rapid_loss_drop = total_loss_drop * rapid_decay_weight
    steady_loss_drop = total_loss_drop * (1 - rapid_decay_weight)
    normalized_time = steps / num_steps
    rapid_component = rapid_loss_drop * np.exp(-rapid_decay_rate * normalized_time)
    steady_component = steady_loss_drop * np.exp(-steady_decay_rate * normalized_time)
    base_loss = final_loss + rapid_component + steady_component
    noise = (np.random.rand(num_steps) - 0.5) * 0.05 * (base_loss - final_loss)
    return np.maximum(base_loss + noise, final_loss)


def generate_lr_schedule(num_steps, warmup_steps, max_lr, min_lr):
    """Generates a cosine decay with warmup learning rate schedule."""
    lr_schedule = np.zeros(num_steps)
    warmup_lrs = np.linspace(min_lr, max_lr, warmup_steps)
    lr_schedule[:warmup_steps] = warmup_lrs
    decay_steps = num_steps - warmup_steps
    decay_indices = np.arange(decay_steps)
    cosine_decay = 0.5 * (1 + np.cos(np.pi * decay_indices / decay_steps))
    decayed_lrs = min_lr + (max_lr - min_lr) * cosine_decay
    lr_schedule[warmup_steps:] = decayed_lrs
    return lr_schedule


def generate_tokens_per_second(num_steps, avg_tps=25000, noise_factor=0.1):
    """Simulates fluctuating tokens per second."""
    noise = (np.random.randn(num_steps)) * noise_factor * avg_tps
    return avg_tps + noise


# --- FastAPI Application ---

# 1. Create a FastAPI app instance
app = FastAPI(title="GPT Training Log API")


# 2. Define an API endpoint
@app.get("/api/training_log")
def get_training_log():
    """
    Generates and returns a simulated GPT training log.
    """
    # Parameters for the simulation
    NUM_STEPS = 2000
    INITIAL_LOSS = 6.0
    FINAL_LOSS = 2.5
    MAX_LR = 6e-4
    MIN_LR = 6e-5
    WARMUP_STEPS = 200

    # Generate the data
    loss_values = generate_three_phase_loss(NUM_STEPS, INITIAL_LOSS, FINAL_LOSS)
    perplexity_values = np.exp(loss_values)
    lr_values = generate_lr_schedule(NUM_STEPS, WARMUP_STEPS, MAX_LR, MIN_LR)
    tps_values = generate_tokens_per_second(NUM_STEPS)

    # Map steps to a 1T token scale
    total_tokens = 1_000_000_000_000
    token_axis = np.linspace(1, total_tokens, num=NUM_STEPS, dtype=np.int64)

    # Combine into a pandas DataFrame
    training_log_df = pd.DataFrame({
        'Tokens': token_axis,
        'Loss': loss_values,
        'Perplexity': perplexity_values,
        'Tokens per Second': tps_values,
        'Inner LR': lr_values
    })

    # 3. Convert the DataFrame to a list of dictionaries and return it.
    # FastAPI will automatically serialize this into JSON.
    return training_log_df.to_dict(orient='records')


@app.get("/")
def read_root():
    return {"message": "Welcome to the GPT Training Log API. Go to /api/training_log to see the data."}