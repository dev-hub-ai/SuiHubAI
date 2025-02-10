/*
/// Module: contracts
module contracts::contracts;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module contract::contract {
    use sui::object::{UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};
    use sui::event;
    use sui::package;
    use std::string::{Self, String};

    // ====== Events ======
    #[allow(unused_const)]
    const ENO_PERMISSION: u64 = 0;

    /// Event emitted when a new NFT is created
    public struct ItemCreated has copy, drop {
        token_id: ID,
        name: String
    }

    /// Admin capability for the NFT collection
    public struct NFTCollectionAdmin has key {
        id: UID,
    }

    /// The NFT struct that represents each token
    public struct NFT has key, store {
        id: UID,
        name: String,
        image_url: Url,
        token_uri: Url,
        collection: String,
        description: String,
    }

    /// One-Time-Witness for the package
    public struct CONTRACT has drop {}

    // ====== Public Functions ======
    fun init(_witness: CONTRACT, ctx: &mut TxContext) {
        let admin = NFTCollectionAdmin {
            id: object::new(ctx),
        };
        transfer::transfer(admin, tx_context::sender(ctx));
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(CONTRACT {}, ctx)
    }

    public entry fun mint(
        _admin: &NFTCollectionAdmin,
        name: vector<u8>,
        image_url: vector<u8>,
        token_uri: vector<u8>,
        collection: vector<u8>,
        description: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            image_url: url::new_unsafe_from_bytes(image_url),
            token_uri: url::new_unsafe_from_bytes(token_uri),
            collection: string::utf8(collection),
            description: string::utf8(description),
        };

        // Emit creation event
        event::emit(ItemCreated {
            token_id: object::uid_to_inner(&nft.id),
            name: nft.name
        });

        // Transfer NFT to recipient
        transfer::transfer(nft, recipient);
    }

    // ====== View Functions ======
    public fun name(nft: &NFT): &String {
        &nft.name
    }

    public fun image_url(nft: &NFT): &Url {
        &nft.image_url
    }

    public fun token_uri(nft: &NFT): &Url {
        &nft.token_uri
    }

    public fun collection(nft: &NFT): &String {
        &nft.collection
    }

    public fun description(nft: &NFT): &String {
        &nft.description
    }
} 