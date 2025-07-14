module cotrain::cotrain_network {
    use std::signer;
    use std::string::String;

    // We no longer manage coin capabilities here.
    use cotrain::stake_manager;
    use cotrain::compute_registry;
    use cotrain::domain_registry;
    use cotrain::rewards_distributor;

    const E_NOT_FEDERATOR: u64 = 2;
    const E_NOT_VALIDATOR: u64 = 3;

    struct Roles has key {
        federator: address,
        validator: address,
    }

    public entry fun initialize(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);

        // Initialize all modules. No coin creation is needed.
        stake_manager::initialize(deployer);
        compute_registry::initialize(deployer);
        domain_registry::initialize(deployer);
        rewards_distributor::initialize(deployer);

        move_to(deployer, Roles {
            federator: deployer_addr,
            validator: deployer_addr,
        });
    }

    public entry fun register_provider(provider: &signer, stake_amount: u64, provider_specs_uri: String)
    {
        stake_manager::stake(provider, stake_amount);
        let provider_address = signer::address_of(provider);
        compute_registry::register_provider(provider_address, provider_specs_uri);
    }

    public entry fun whitelist_provider(validator: &signer, provider_address: address)
    acquires Roles {
        let roles = borrow_global<Roles>(@cotrain);
        assert!(signer::address_of(validator) == roles.validator, E_NOT_VALIDATOR);
        compute_registry::set_whitelist_status(provider_address, true);
    }

    public entry fun create_domain(federator: &signer, domain_name: String, validation_logic_address: address)
    acquires Roles{
        let roles = borrow_global<Roles>(@cotrain);
        assert!(signer::address_of(federator) == roles.federator, E_NOT_FEDERATOR);
        domain_registry::create_domain(domain_name, validation_logic_address);
    }
}