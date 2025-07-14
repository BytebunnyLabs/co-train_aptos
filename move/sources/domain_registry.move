module cotrain::domain_registry {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::table::{Self, Table};

    const E_NOT_INITIALIZED: u64 = 1;
    const E_DOMAIN_NOT_FOUND: u64 = 2;

    struct Domain has store, key, drop {
        id: u64,
        name: String,
        validation_logic_address: address,
        parameters_uri: String,
    }

    struct Domains has key {
        admin_address: address,
        domain_counter: u64,
        domains: Table<u64, Domain>,
    }

    public fun initialize(deployer: &signer) {
        let domains_table = table::new<u64, Domain>();
        move_to(deployer, Domains {
            admin_address: signer::address_of(deployer),
            domain_counter: 0,
            domains: domains_table,
        });
    }

    public fun create_domain(name: String, validation_logic_address: address) acquires Domains {
        let domains_resource = borrow_global_mut<Domains>(@cotrain);
        let new_id = domains_resource.domain_counter;
        let new_domain = Domain {
            id: new_id,
            name: name,
            validation_logic_address: validation_logic_address,
            parameters_uri: string::utf8(b""),
        };
        table::add(&mut domains_resource.domains, new_id, new_domain);
        domains_resource.domain_counter = new_id + 1;
    }

    public fun update_validation_logic(domain_id: u64, new_logic_address: address) acquires Domains {
        let domains_resource = borrow_global_mut<Domains>(@cotrain);
        assert!(table::contains(&domains_resource.domains, domain_id), E_DOMAIN_NOT_FOUND);
        let domain = table::borrow_mut(&mut domains_resource.domains, domain_id);
        domain.validation_logic_address = new_logic_address;
    }

    public fun update_parameters(domain_id: u64, new_parameters_uri: String) acquires Domains {
        let domains_resource = borrow_global_mut<Domains>(@cotrain);
        assert!(table::contains(&domains_resource.domains, domain_id), E_DOMAIN_NOT_FOUND);
        let domain = table::borrow_mut(&mut domains_resource.domains, domain_id);
        domain.parameters_uri = new_parameters_uri;
    }
}