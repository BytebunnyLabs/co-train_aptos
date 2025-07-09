module cotrain::model_launchpad{
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    use aptos_std::table::{Self, Table};
    struct Registry has key {
        model_objects: vector<Object<Metadata>>,
    }
    
    struct Config has key {
        admin_addr: address,
        pending_admin_addr: Option<address>,
    }
    struct Model has key{
        max_cotrain_nums:u64,
        cotrain_tokens:u64,
        model_name:String,
    }
    struct ModelTrainerToken has key{
        mutator_ref: token::MutatorRef,
        burn_ref: token::BurnRef,
        property_mutator_ref: property_map::MutatorRef,
    }

    fun init_module(sender: &signer) {
        move_to(sender, Registry {
            model_objects: vector::empty()
        });
        move_to(sender, Config {
            admin_addr: signer::address_of(sender),
            pending_admin_addr: option::none(),
        });
    }
    public entry fun create_model(
        sender:&signer,
        max_cotrain_nums:u64,
        cotrain_tokens:u64,
        model_name:String,
        model_desc:String,
    )acquires Registry {
        collection::create_fixed_collection(
            sender,
            model_desc,
            max_cotrain_nums,
            model_name,
            option::none(),//royalty
            option::none()//url
        );
    }
    public entry fun mint_numbered_trainer_token_by_user(
        user: &signer,
        creator: &signer,
        description: String,
        name: String,
        uri: String,
    ) {
        mint_numbered_trainer_token(creator, description, name, uri, signer::address_of(user));
    }
    public entry fun mint_numbered_trainer_token(
        creator: &signer,
        description: String,
        name: String,
        base_uri: String,
        soul_bound_to: address,
    )acquires Registry {

        mint_trainer_token_impl(creator, description, name, base_uri, soul_bound_to, true);
    }
    fun mint_trainer_token_impl(
        creator: &signer,
        description: String,
        name: String,
        base_uri: String,
        soul_bound_to: address,
        numbered: bool,
    ) {
        // The collection name is used to locate the collection object and to create a new token object.
        let collection = string::utf8(COLLECTION_NAME);
        // Creates the trainer token, and get the constructor ref of the token. The constructor ref
        // is used to generate the refs of the token.
        let uri = base_uri;
        string::append(&mut uri, string::utf8(RANK_BRONZE));
        let constructor_ref = if (numbered) {
            token::create_numbered_token(
                creator,
                collection,
                description,
                name,
                string::utf8(b""),
                option::none(),
                uri,
            )
        } else {
            token::create_named_token(
                creator,
                collection,
                description,
                name,
                option::none(),
                uri,
            )
        };

        // Generates the object signer and the refs. The object signer is used to publish a resource
        // (e.g., trainerLevel) under the token object address. The refs are used to manage the token.
        let object_signer = object::generate_signer(&constructor_ref);
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);
        let mutator_ref = token::generate_mutator_ref(&constructor_ref);
        let burn_ref = token::generate_burn_ref(&constructor_ref);
        let property_mutator_ref = property_map::generate_mutator_ref(&constructor_ref);

        // Transfers the token to the `soul_bound_to` address
        let linear_transfer_ref = object::generate_linear_transfer_ref(&transfer_ref);
        object::transfer_with_ref(linear_transfer_ref, soul_bound_to);

        // Disables ungated transfer, thus making the token soulbound and non-transferable
        object::disable_ungated_transfer(&transfer_ref);

        // Initializes the trainer level as 0
        move_to(&object_signer, trainerLevel { trainer_level: 0 });

        // Initialize the property map and the trainer rank as Bronze
        let properties = property_map::prepare_input(vector[], vector[], vector[]);
        property_map::init(&constructor_ref, properties);
        property_map::add_typed(
            &property_mutator_ref,
            string::utf8(b"Rank"),
            string::utf8(RANK_BRONZE)
        );

        // Publishes the trainerToken resource with the refs.
        let trainer_token = trainerToken {
            mutator_ref,
            burn_ref,
            property_mutator_ref,
            base_uri
        };
        move_to(&object_signer, trainer_token);
    }

}