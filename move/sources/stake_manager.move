module cotrain::stake_manager {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin; // Use the native AptosCoin
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;
    friend cotrain::compute_registry;

    const E_NOT_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_STAKE: u64 = 2;
    const E_NO_STAKE: u64 = 3;
    const E_UNBONDING_PERIOD_NOT_OVER: u64 = 4;
    const E_INSUFFICIENT_BALANCE: u64 = 5;

    struct StakeInfo has key, store {
        coin: Coin<AptosCoin>,
        unbonding_start_time_seconds: u64,
    }

    public(friend) struct Config has key {
        admin: address,
        stake_minimum: u64,
        unbonding_period_seconds: u64,
        stakes: Table<address, StakeInfo>,
    }

    public fun initialize(deployer: &signer) {
        let stakes_table = table::new<address, StakeInfo>();
        move_to(deployer, Config {
            admin: signer::address_of(deployer),
            stake_minimum: 1_000_000, // 1 APT
            unbonding_period_seconds: 604800, // 7 days
            stakes: stakes_table,
        });
    }

    public entry fun stake(provider: &signer, amount: u64) acquires Config {
        let config = borrow_global_mut<Config>(@cotrain);
        assert!(amount >= config.stake_minimum, E_INSUFFICIENT_STAKE);
        let provider_address = signer::address_of(provider);
        let coins_to_stake = coin::withdraw<AptosCoin>(provider, amount);
        if (table::contains(&config.stakes, provider_address)) {
            let stake_info = table::borrow_mut(&mut config.stakes, provider_address);
            coin::merge(&mut stake_info.coin, coins_to_stake);
        } else {
            let new_stake = StakeInfo {
                coin: coins_to_stake,
                unbonding_start_time_seconds: 0,
            };
            table::add(&mut config.stakes, provider_address, new_stake);
        };
    }

    public fun slash(admin: &signer, provider_address: address, slash_amount: u64) acquires Config {
        let config = borrow_global_mut<Config>(@cotrain);
        assert!(signer::address_of(admin) == config.admin, E_NOT_INITIALIZED);

        assert!(table::contains(&config.stakes, provider_address), E_NO_STAKE);
        let stake_info = table::borrow_mut(&mut config.stakes, provider_address);
        let staked_amount = coin::value(&stake_info.coin);
        assert!(staked_amount >= slash_amount, E_INSUFFICIENT_BALANCE);

        let slashed_coins = coin::extract(&mut stake_info.coin, slash_amount);

        // Deposit the slashed funds into the admin's account.
        coin::deposit(config.admin, slashed_coins);
    }

    public entry fun unstake(provider: &signer) acquires Config {
        let config = borrow_global_mut<Config>(@cotrain);
        let provider_address = signer::address_of(provider);
        assert!(table::contains(&config.stakes, provider_address), E_NO_STAKE);
        let stake_info = table::borrow_mut(&mut config.stakes, provider_address);
        stake_info.unbonding_start_time_seconds = timestamp::now_seconds();
    }

    public entry fun withdraw(provider: &signer) acquires Config {
        let provider_address = signer::address_of(provider);
        let config = borrow_global_mut<Config>(@cotrain);

        assert!(table::contains(&config.stakes, provider_address), E_NO_STAKE);

        let StakeInfo{coin , unbonding_start_time_seconds} = table::remove(&mut config.stakes, provider_address);

        // Check unbonding period
        let now = timestamp::now_seconds();
        assert!(now >= unbonding_start_time_seconds + config.unbonding_period_seconds, E_UNBONDING_PERIOD_NOT_OVER);

        let amount = coin::value(&coin);
        // This would fail if the recipient account is not registered to receive CoinType.
        coin::deposit(provider_address, coin);

    }
}   
