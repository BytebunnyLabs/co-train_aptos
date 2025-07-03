/**
 * Smart contract addresses for different networks
 */
export const CONTRACT_ADDRESSES = {
  testnet: {
    TRAINING_REWARDS: process.env.TESTNET_CONTRACT_ADDRESS || '0x1', // Replace with actual testnet address
  },
  mainnet: {
    TRAINING_REWARDS: process.env.MAINNET_CONTRACT_ADDRESS || '0x1', // Replace with actual mainnet address
  },
  devnet: {
    TRAINING_REWARDS: process.env.DEVNET_CONTRACT_ADDRESS || '0x1', // Replace with actual devnet address
  },
};

/**
 * Contract function names
 */
export const CONTRACT_FUNCTIONS = {
  CREATE_SESSION: 'create_session',
  REGISTER_PARTICIPANT: 'register_participant',
  SUBMIT_CONTRIBUTION: 'submit_contribution',
  COMPLETE_SESSION: 'complete_session',
  CLAIM_REWARD: 'claim_reward',
  DISTRIBUTE_REWARDS: 'distribute_rewards',
  BATCH_CLAIM_REWARDS: 'batch_claim_rewards',
  GET_SESSION_DETAILS: 'get_session_details',
  GET_PARTICIPANT_SCORE: 'get_participant_score',
  GET_CLAIMABLE_REWARDS: 'get_claimable_rewards',
};

/**
 * Contract resource types
 */
export const CONTRACT_RESOURCES = {
  SESSION_STORE: 'SessionStore',
  GLOBAL_STATS: 'GlobalStats',
  PARTICIPANT_REWARDS: 'ParticipantRewards',
};

/**
 * Aptos constants
 */
export const OCTAS_PER_APT = 100_000_000; // 1 APT = 100,000,000 Octas

/**
 * Contract event types
 */
export const CONTRACT_EVENTS = {
  SESSION_CREATED: 'SessionCreatedEvent',
  PARTICIPANT_REGISTERED: 'ParticipantRegisteredEvent',
  CONTRIBUTION_SUBMITTED: 'ContributionSubmittedEvent',
  SESSION_COMPLETED: 'SessionCompletedEvent',
  REWARD_DISTRIBUTED: 'RewardDistributedEvent',
  REWARD_CLAIMED: 'RewardClaimedEvent',
};

/**
 * Network configuration
 */
export const NETWORK_CONFIG = {
  testnet: {
    nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com/?network=testnet',
  },
  mainnet: {
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com/?network=mainnet',
  },
  devnet: {
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com/?network=devnet',
  },
};

/**
 * Transaction configuration
 */
export const TRANSACTION_CONFIG = {
  DEFAULT_GAS_LIMIT: 10000,
  DEFAULT_GAS_PRICE: 100,
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
};

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
  MIN_REWARD_AMOUNT: 1,
  MAX_REWARD_AMOUNT: 1000000000000, // 10,000 APT in smallest unit
  MIN_PARTICIPANTS: 1,
  MAX_PARTICIPANTS: 1000,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  SESSION_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
};

/**
 * Get contract address for current network
 */
export function getContractAddress(network: 'testnet' | 'mainnet' | 'devnet'): string {
  return CONTRACT_ADDRESSES[network]?.TRAINING_REWARDS || CONTRACT_ADDRESSES.testnet.TRAINING_REWARDS;
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network: 'testnet' | 'mainnet' | 'devnet') {
  return NETWORK_CONFIG[network] || NETWORK_CONFIG.testnet;
}