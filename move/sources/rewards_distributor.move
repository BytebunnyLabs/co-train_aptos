module cotrain::rewards_distributor {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::table::{Self, Table};
    // use cotrain::compute_pool;

    const E_REWARD_POOL_NOT_FOUND: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;

    struct RewardPoolInfo has key, store {
        compute_pool_id: u64,
        reward_rate_per_second: u64,
        treasury: Coin<AptosCoin>,
    }

    struct RewardsManager has key {
        admin_address: address,
        reward_pools: Table<u64, RewardPoolInfo>,
    }

    public entry fun initialize(deployer: &signer) {
        move_to(deployer, RewardsManager {
            admin_address: signer::address_of(deployer),
            reward_pools: table::new<u64, RewardPoolInfo>(),
        });
    }

    public entry fun create_reward_pool(
        admin: &signer,
        compute_pool_id: u64,
        reward_rate: u64,
        amount: u64,    
    ) acquires RewardsManager {
        let manager = borrow_global_mut<RewardsManager>(@cotrain);
        assert!(signer::address_of(admin) == manager.admin_address, E_NOT_ADMIN);
        let coins = coin::withdraw<AptosCoin>(admin, amount);
        let new_reward_pool = RewardPoolInfo {
            compute_pool_id: compute_pool_id,
            reward_rate_per_second: reward_rate,
            treasury: coins,
        };
        table::add(&mut manager.reward_pools, compute_pool_id, new_reward_pool);
    }

    public entry fun claim_rewards(provider: &signer, compute_pool_id: u64, node_address: address)
    acquires RewardsManager{
        let manager = borrow_global_mut<RewardsManager>(@cotrain);
        assert!(table::contains(&manager.reward_pools, compute_pool_id), E_REWARD_POOL_NOT_FOUND);

        let reward_pool = table::borrow_mut(&mut manager.reward_pools, compute_pool_id);
        let active_time_seconds = 3600; // Placeholder
        let reward_amount = active_time_seconds * reward_pool.reward_rate_per_second;
        let reward_coins = coin::extract(&mut reward_pool.treasury, reward_amount);
        coin::deposit(signer::address_of(provider), reward_coins);
    }
}