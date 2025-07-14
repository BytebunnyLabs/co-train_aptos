module cotrain::compute_registry {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::table::{Self, Table};
    use std::error;
    const E_NOT_INITIALIZED: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_PROVIDER_NOT_FOUND: u64 = 3;
    const E_NODE_NOT_FOUND: u64 = 4;

    public struct NodeInfo has store, key, drop {
        provider: address,
        specs_uri: String,
        is_active: bool,
        is_validated: bool,
    }

    struct ProviderInfo has store, key, drop {
        provider_address: address,
        is_whitelisted: bool,
        specs_uri: String,
        nodes: vector<address>,
    }

    public struct Registry has key {
        admin_address: address,
        providers: Table<address, ProviderInfo>,
        nodes: Table<address, NodeInfo>,
    }

    public fun initialize(deployer: &signer) {
        let providers_table = table::new<address, ProviderInfo>();
        let nodes_table = table::new<address, NodeInfo>();
        move_to(deployer, Registry {
            admin_address: signer::address_of(deployer),
            providers: providers_table,
            nodes: nodes_table,
        });
    }
    public fun is_node_valid(node_address: address): bool acquires Registry {
        let registry = borrow_global<Registry>(@cotrain);
        table::contains(&registry.nodes, node_address)
    }

    public fun register_provider(provider_address: address, specs_uri: String) acquires Registry {
        let registry = borrow_global_mut<Registry>(@cotrain);
        let new_provider = ProviderInfo {
            provider_address,
            is_whitelisted: false,
            specs_uri,
            nodes: vector::empty<address>(),
        };
        table::add(&mut registry.providers, provider_address, new_provider);
    }

    public entry fun add_compute_node(provider: &signer, node_address: address, node_specs_uri: String)
    acquires Registry {
        let registry = borrow_global_mut<Registry>(@cotrain);
        let provider_address = signer::address_of(provider);
        assert!(table::contains(&registry.providers, provider_address), E_PROVIDER_NOT_FOUND);

        let new_node = NodeInfo {
            provider: provider_address,
            specs_uri: node_specs_uri,
            is_active: true,
            is_validated: false,
        };
        table::add(&mut registry.nodes, node_address, new_node);

        let provider_info = table::borrow_mut(&mut registry.providers, provider_address);
        vector::push_back(&mut provider_info.nodes, node_address);
    }

    public fun set_whitelist_status(provider_address: address, is_whitelisted: bool) acquires Registry {
        let registry = borrow_global_mut<Registry>(@cotrain);
        assert!(table::contains(&registry.providers, provider_address), E_PROVIDER_NOT_FOUND);
        let provider_info = table::borrow_mut(&mut registry.providers, provider_address);
        provider_info.is_whitelisted = is_whitelisted;
    }


}
