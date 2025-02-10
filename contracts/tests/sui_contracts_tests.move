/*
#[test_only]
module sui_contracts::sui_contracts_tests;
// uncomment this line to import the module
// use sui_contracts::sui_contracts;

const ENotImplemented: u64 = 0;

#[test]
fun test_sui_contracts() {
    // pass
}

#[test, expected_failure(abort_code = ::sui_contracts::sui_contracts_tests::ENotImplemented)]
fun test_sui_contracts_fail() {
    abort ENotImplemented
}
*/
#[test_only]
module contract::contract_tests {
    use sui::test_scenario;
    use contract::contract::{Self, NFTCollectionAdmin};
    use sui::test_utils;
    use std::string;

    #[test]
    fun test_mint_nft() {
        let owner = @0xA;
        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        
        // Test minting
        test_scenario::next_tx(scenario, owner);
        {
            let ctx = test_scenario::ctx(scenario);
            contract::init_for_testing(ctx);
        };

        // Mint an NFT
        test_scenario::next_tx(scenario, owner);
        {
            let admin = test_scenario::take_from_sender<NFTCollectionAdmin>(scenario);
            let ctx = test_scenario::ctx(scenario);

            contract::mint(
                &admin,
                b"Cool NFT",
                b"ipfs://image-hash",
                b"ipfs://token-uri",
                b"My Collection",
                b"A cool NFT description",
                owner,
                ctx
            );

            test_scenario::return_to_sender(scenario, admin);
        };

        test_scenario::end(scenario_val);
    }
}