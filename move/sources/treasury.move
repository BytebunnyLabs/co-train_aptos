module cotrain::treasury {
    use std::signer;
    use aptos_framework::coin::Coin;
    use aptos_framework::managed_coin;
    use cotrain::cotrain_coin::CoTrainCoin;

    public entry fun initialize(deployer: &signer) {
        managed_coin::initialize<CoTrainCoin>(
            deployer,
            b"CoTrain Coin",
            b"CTC",
            6,
            false,
        );
    }
    // public(friend) fun mint(admin: &signer, dst_addr,amount: u64): Coin<CoTrainCoin> {
    //     managed_coin::mint<CoTrainCoin>(admin, amount)
    // }


    // public(friend) fun burn(admin: &signer, coins: Coin<CoTrainCoin>) {
    //     managed_coin::burn<CoTrainCoin>(admin, coins)
    // }

    
}
