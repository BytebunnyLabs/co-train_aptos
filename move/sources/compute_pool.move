module cotrain::compute_pool {
    use std::signer;
    use std::vector;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;
    use cotrain::compute_registry::{Registry, is_node_valid};
    use cotrain::compute_registry;
    use std::error;
    const E_POOL_NOT_ACTIVE: u64 = 1;
    const E_NODE_NOT_VALID: u64 = 2;
    const E_NOT_POOL_MANAGER: u64 = 3;

    const POOL_STATUS_CREATED: u8 = 0;
    const POOL_STATUS_ACTIVE: u8 = 1;
    const POOL_STATUS_ENDED: u8 = 2;

    struct NodeInPool has store, key, drop {
        node_address: address,
        joined_at_seconds: u64,
    }

    struct PoolInfo has key, store {
        id: u64,
        manager: address,
        domain_id: u64,
        status: u8,
        active_nodes: Table<address, NodeInPool>,
    }

    struct ComputePools has key {
        pool_counter: u64,
        pools: Table<u64, PoolInfo>,
    }

    public entry fun initialize(deployer: &signer) {
        let pools_table = table::new<u64, PoolInfo>();
        move_to(deployer, ComputePools {
            pool_counter: 0,
            pools: pools_table,
        });
    }

    public entry fun create_compute_pool(manager: &signer, domain_id: u64) acquires ComputePools {
        let pools_resource = borrow_global_mut<ComputePools>(@cotrain);
        let new_id = pools_resource.pool_counter;
        let new_pool = PoolInfo {
            id: new_id,
            manager: signer::address_of(manager),
            domain_id: domain_id,
            status: POOL_STATUS_CREATED,
            active_nodes: table::new<address, NodeInPool>(),
        };
        table::add(&mut pools_resource.pools, new_id, new_pool);
        pools_resource.pool_counter = new_id + 1;
    }

    public entry fun join_compute_pool(
        node_owner: &signer,
        pool_id: u64,
        node_address: address
    ) acquires ComputePools {
        let pools_resource = borrow_global_mut<ComputePools>(@cotrain);
        let pool = table::borrow_mut(&mut pools_resource.pools, pool_id);
        assert!(pool.status == POOL_STATUS_ACTIVE, error::invalid_argument(E_POOL_NOT_ACTIVE));

        
        let valid = compute_registry::is_node_valid(node_address);
        assert!(valid, error::invalid_argument(E_NODE_NOT_VALID));

        let node_record = NodeInPool {
            node_address,
            joined_at_seconds: timestamp::now_seconds(),
        };
        table::add(&mut pool.active_nodes, node_address, node_record);
    }

    public entry fun end_compute_pool(manager: &signer, pool_id: u64) acquires ComputePools {
        let pools_resource = borrow_global_mut<ComputePools>(@cotrain);
        let pool = table::borrow_mut(&mut pools_resource.pools, pool_id);
        assert!(signer::address_of(manager) == pool.manager, E_NOT_POOL_MANAGER);
        pool.status = POOL_STATUS_ENDED;
    }
}
