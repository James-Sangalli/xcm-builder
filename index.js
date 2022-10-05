const {
    ApiPromise,
    WsProvider
} = require("@polkadot/api");
const endpoint2000 = "ws://127.0.0.1:9988";
const endpoint3000 = "ws://127.0.0.1:9999";

// this function does a simple transfer of an asset from one parachain to another
// https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fbasilisk-rpc.dwellir.com#/extrinsics/decode/0x34030208000400010200e12e0500000b00e057eb481b0e010004010100411f081300010200e12e050000070010a5d4e80107001c040a5d0d010004000101008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48001c040a5d000000
async function transfer(
    fromAccount,
    fromParachain,
    toParachain,
    amount,
    recipient
) {
    const api = await init();
    const data = {
        callIndex: getPolkadotXcmCallIndex(),
        args: {
            message: {
                "v2": [
                    getWithdrawAssetXCM(fromParachain, amount),
                    getDepositReserveAssetXCM(toParachain, recipient)
                ]
            },
            max_weight: getTransferMaxWeightEstimate()
        }
    };

    return api.tx.polkadotXcm.execute({
        V2: data.args.message.v2
    }, data.args.max_weight).signAndSend(fromAccount);
}

/*
* @dev gets the call index for polkadotXcm.execute
* @returns - the call index
* */
function getPolkadotXcmCallIndex() {
    return 0x3403;
}

/*
* @dev gets the max weight estimate for the call
* @returns - the hardcoded max weight estimate
* */
function getTransferMaxWeightEstimate() {
    return 399600000000;
}

/*
* @dev withdraw the asset from the origin chain so that it can be transferred to the destination
* @param fromParachain - the parachainId where the asset lives
* @param amount - the amount of the native fungible asset to withdraw
* @returns - an XCM withdrawAsset object
* */
function getWithdrawAssetXCM(fromParachain, amount) {
    return {
        "withdrawAsset": [{
            "id": {
                "concrete": {
                    "parents": 1,
                    "interior": {
                        "x2": [{ // this relates to how this token is defined on the parachain, the same asset can have a different value here
                            "parachain": fromParachain
                        }, {
                            "generalIndex": 0
                        }]
                    }
                }
            },
            "fun": {
                "fungible": amount
            }
        }]
    };
}

/*
* @dev get the hardcoded fee for the transfer (this is based off of a BSX/HydraDx transfer)
* @returns - the hardcoded fee
* */
function getTransferFee() {
    return 1000000000000;
}

/*
* @dev deposit the asset from the origin chain to the destination chain
* @param toParachain - the parachainId where the asset will be deposited to
* @param recipient - the receiver of the asset
* @returns - an XCM depositReserveAsset object
* */
function getDepositReserveAssetXCM(toParachain, recipient) {
    return {
        "depositReserveAsset": {
            "assets": {
                "wild": {
                    "all": null
                }
            },
            "maxAssets": 1,
            "dest": {
                "parents": 1,
                "interior": {
                    "x1": {
                        "parachain": toParachain
                    }
                }
            },
            "xcm": [{
                "buyExecution": {
                    "fees": {
                        "id": {
                            "concrete": {
                                "parents": 1,
                                "interior": {
                                    "x2": [{
                                        "parachain": 3000
                                    }, {
                                        "generalIndex": 0
                                    }]
                                }
                            }
                        },
                        "fun": {
                            "fungible": getTransferFee()
                        }
                    },
                    "weightLimit": {
                        "limited": getTransferMaxWeightEstimate()
                    }
                }
            }, {
                "depositAsset": {
                    "assets": {
                        "wild": {
                            "all": null
                        }
                    },
                    "maxAssets": 1,
                    "beneficiary": {
                        "parents": 0,
                        "interior": {
                            "x1": {
                                "accountId32": {
                                    "network": {
                                        "any": null
                                    },
                                    "id": recipient
                                }
                            }
                        }
                    }
                }
            }]
        }
    };
}

async function init() {
    const api = await ApiPromise.create({
        provider: new WsProvider(endpoint3000)
    });
    // https://github.com/galacticcouncil/Basilisk-node/blob/532cd08b0fc5bc936e34580239b58139b1553bb0/integration-tests/src/cross_chain_transfer.rs#L162
    // for an asset to be recognised on the other chain, it must be registered.
    await api.tx.assetRegistry.setLocation(1, {
        parents: 0,
        interior: {
            X2: [
                {
                    Parachain: 3000
                },
                {
                    GeneralIndex: 0
                }
            ]
        }
    }).signAndSend("0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48");

    return ApiPromise.create({
        provider: new WsProvider(endpoint2000)
    });
}

transfer("0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48", 3000, 2000, 30000000000000, "0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48")
    .then((hash) => {
        console.log(hash);
        process.exit(0)
    })
    .catch((e) => {
        console.error(e);
        process.exit(-1);
    });