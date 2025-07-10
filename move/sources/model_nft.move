module cotrain::model_launchpad {
    use std::signer;
    use std::string::{String, utf8};
    use std::option::{self, Option};
    use std::table::{Self, Table};
    use aptos_framework::object::{Self, ObjectGroup, Object};
    use aptos_framework::collection;
    use aptos_framework::token::{Self, TokenId};
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::coin::{Self, Coin};

    // --- Error Codes ---
    const E_NOT_SBT_HOLDER: u64 = 1001;
    const E_ALREADY_JOINED: u64 = 1002;
    const E_MINIMUM_STAKE_NOT_MET: u64 = 1003;
    const E_TRAINING_NOT_OPEN: u64 = 1004;
    const E_TRAINING_NOT_COMPLETE: u64 = 1005;
    const E_ALREADY_CLAIMED_OR_NOT_PARTICIPANT: u64 = 1006;
    const E_NOT_ADMIN: u64 = 1007;
    const E_INVALID_STATE_TRANSITION: u64 = 1008;
    const E_ZERO_TOTAL_STAKE: u64 = 1009;

    // --- Constants ---
    const CREATOR_STAKE_AMOUNT: u64 = 1_000_000_000; // 1 APT for model creator
    const MINIMUM_PARTICIPANT_STAKE: u64 = 1_000_000; // 0.01 APT minimum for participants

    const STATUS_OPEN: u8 = 0;
    const STATUS_COMPLETE: u8 = 1;

    /// Metadata for the model, stored as a resource on the collection object.
    /// The `admin` field is added to manage the training lifecycle.
    #[resource_group_member(group = ObjectGroup)]
    struct ModelMetadata has key {
        max_cotrain_nums: u64,
        flops: u64,
        application: String,
        admin: address, // The creator's address, for administrative actions
    }

    /// This resource is attached to each model's collection object to manage its specific state.
    #[resource_group_member(group = ObjectGroup)]
    struct TrainingInfo has key {
        participants: Table<address, u64>, // Maps participant address to their staked amount
        total_staked: u64, // Sum of all stakes from all participants
        status: u8,        // Current status of the training (Open, Complete, etc.)
        reward_pool: Coin<AptosCoin>, // Holds all staked APT and any additional rewards
    }

    /// Creates a new model collection, its metadata, and its dedicated training info resource.
    /// The creator's initial stake is used to seed the model's reward pool.
    public entry fun create_model_collection_with_metadata(
        sender: &signer,
        model_name: String,
        model_desc: String,
        max_cotrain_nums: u64,
        flops: u64,
        application: String,
        uri: String
    ) {
        let sender_addr = signer::address_of(sender);
        
        // The creator's stake now goes into the model's specific reward pool.
        let creator_stake = aptos_coin::withdraw(sender, CREATOR_STAKE_AMOUNT);

        // Create the collection object for the model.
        collection::create_fixed_collection(
            sender,
            model_desc.clone(),
            max_cotrain_nums,
            model_name.clone(),
            option::none(),
            option::some(uri.clone())
        );

        // Get the address of the newly created collection object.
        let collection_object: Object<collection::FixedCollection> = collection::create_fixed_collection_object(sender_addr, model_name);
        let collection_addr = object::object_address(&collection_object);
        let obj_signer = object::create_signer_for_extending(sender, collection_addr);

        // Attach the ModelMetadata resource to the collection object.
        move_to(&obj_signer, ModelMetadata {
            max_cotrain_nums,
            flops,
            application,
            admin: sender_addr, // Set the creator as admin.
        });

        // Create and attach the dedicated TrainingInfo resource for this model.
        move_to(&obj_signer, TrainingInfo {
            participants: table::new(),
            total_staked: 0,
            status: STATUS_OPEN,
            reward_pool: creator_stake, // Seed the reward pool with the creator's stake.
        });
    }

    /// Creates and transfers a soul-bound token (SBT) to a participant.
    /// This SBT acts as a ticket or proof of eligibility to join the training.
    public entry fun issue_sbt(
        sender: &signer,
        collection_name: String,
        token_name: String,
        token_desc: String,
        uri: String,
        participant_addr: address
    ) {
        let token_id = token::create_named_token(
            sender,
            collection_name,
            token_desc,
            token_name,
            option::none(),
            uri
        );
        // Transfer the token and make it non-transferable (soul-bound).
        token::direct_transfer(sender, &object::create_signer(signer::address_of(sender)), participant_addr, token_id, 1);
        token::disable_token_transfers(sender, &object::create_signer(signer::address_of(sender)), token_id);
    }


    /// Allows an eligible user (who holds an SBT) to join the training by staking APT.
    public entry fun join_training(
        sender: &signer,
        collection_addr: address,
        collection_name: String, // Needed to verify SBT ownership
        token_name: String,
        stake_amount: u64
    ) acquires TrainingInfo {
        let addr = signer::address_of(sender);
        let training_info = borrow_global_mut<TrainingInfo>(collection_addr);

        // --- Pre-conditions ---
        assert!(training_info.status == STATUS_OPEN, E_TRAINING_NOT_OPEN);
        assert!(!table::contains(&training_info.participants, addr), E_ALREADY_JOINED);
        assert!(stake_amount >= MINIMUM_PARTICIPANT_STAKE, E_MINIMUM_STAKE_NOT_MET);

        // Verify SBT ownership.
        let creator_addr = object::owner(collection_addr);
        let sbt_id = token::create_token_id_raw(creator_addr, collection_name, token_name, 0);
        assert!(token::balance_of(addr, sbt_id) > 0, E_NOT_SBT_HOLDER);

        // Withdraw stake from participant and add it to the reward pool.
        let participant_stake = aptos_coin::withdraw(sender, stake_amount);
        coin::merge(&mut training_info.reward_pool, participant_stake);

        // Record the participant's contribution.
        table::add(&mut training_info.participants, addr, stake_amount);
        training_info.total_staked = training_info.total_staked + stake_amount;
    }

    /// Allows anyone to add funds to a model's reward pool to further incentivize trainers.
    public entry fun fund_reward_pool(funder: &signer, collection_addr: address, amount: u64) acquires TrainingInfo {
        let coins = aptos_coin::withdraw(funder, amount);
        let training_info = borrow_global_mut<TrainingInfo>(collection_addr);
        coin::merge(&mut training_info.reward_pool, coins);
    }
    
    /// Administrative function for the model creator to mark the training as complete.
    /// This transitions the state, allowing participants to claim their rewards.
    public entry fun end_training(admin: &signer, collection_addr: address) acquires ModelMetadata, TrainingInfo {
        let admin_addr = signer::address_of(admin);
        let metadata = borrow_global<ModelMetadata>(collection_addr);
        assert!(metadata.admin == admin_addr, E_NOT_ADMIN);

        let training_info = borrow_global_mut<TrainingInfo>(collection_addr);
        assert!(training_info.status == STATUS_OPEN, E_INVALID_STATE_TRANSITION);
        training_info.status = STATUS_COMPLETE;
    }

    /// Allows a participant to claim their original stake plus their proportional share of the rewards
    /// after the training period has been completed.
    public entry fun claim_reward(participant: &signer, collection_addr: address) acquires TrainingInfo {
        let participant_addr = signer::address_of(participant);
        let training_info = borrow_global_mut<TrainingInfo>(collection_addr);

        // --- Pre-conditions ---
        assert!(training_info.status == STATUS_COMPLETE, E_TRAINING_NOT_COMPLETE);
        assert!(table::contains(&training_info.participants, participant_addr), E_ALREADY_CLAIMED_OR_NOT_PARTICIPANT);
        assert!(training_info.total_staked > 0, E_ZERO_TOTAL_STAKE);

        // Get total reward pool value before any extraction.
        let total_reward_pool_value = coin::value(&training_info.reward_pool);
        let total_staked = training_info.total_staked;
        
        // Remove participant from table to prevent re-claiming, and get their original stake amount.
        let participant_stake = table::remove(&mut training_info.participants, participant_addr);

        // --- Reward Calculation ---
        // Calculate the user's proportional share of the entire pool.
        // This includes their original stake + their portion of any extra rewards.
        // We use u128 for the intermediate calculation to prevent overflow and maintain precision.
        let payout_amount = (participant_stake as u128 * total_reward_pool_value as u128 / total_staked as u128) as u64;

        // Extract the calculated payout from the pool and send to the participant.
        let payout_coins = coin::extract(&mut training_info.reward_pool, payout_amount);
        aptos_coin::deposit(participant_addr, payout_coins);
    }

    // --- View Functions ---

    /// Returns the current status of a training model.
    public view fun get_training_status(collection_addr: address): u8 acquires TrainingInfo {
        borrow_global<TrainingInfo>(collection_addr).status
    }

    /// Returns the amount a specific participant has staked in a model.
    public view fun get_participant_stake(collection_addr: address, participant_addr: address): u64 acquires TrainingInfo {
        let training_info = borrow_global<TrainingInfo>(collection_addr);
        if (table::contains(&training_info.participants, participant_addr)) {
            *table::borrow(&training_info.participants, participant_addr)
        } else {
            0
        }
    }

    /// Returns the total amount of APT in the reward pool for a model.
    public view fun get_reward_pool_balance(collection_addr: address): u64 acquires TrainingInfo {
        coin::value(&borrow_global<TrainingInfo>(collection_addr).reward_pool)
    }
}
