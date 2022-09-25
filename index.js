//const { ApiPromise, WsProvider} = require("@polkadot/api");
const scale = require("parity-scale-codec");

// function based on:
// https://github.com/galacticcouncil/Basilisk-node/blob/532cd08b0fc5bc936e34580239b58139b1553bb0/integration-tests/src/cross_chain_transfer.rs#L159
// Polkadot.js:
// https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fbasilisk-rpc.dwellir.com#/extrinsics/decode/0x34030208000400010200e12e0500000b00e057eb481b0e010004010100411f081300010200e12e050000070010a5d4e80107001c040a5d0d010004000101008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48001c040a5d000000
// async function transfer(
//     originParachainId = 3000,
//     destinationParachainId = 2000,
//     recipient = "8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48",
//     assetIdExecution = 1,
//     assetIdTransfer = 1,
//     amount = 30000000000000
// ) {
//     const api = await init();
//     const bytes = `0x34030208000400010200e12e0500000b00e057eb481b0e010004010100411f081300010200e12e050000070010a5d4e80107001c040a5d0d010004000101008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48001c040a5d000000`;
//
//     return api.rpc.author.submitAndWatchExtrinsic(bytes);
// }

function createTransferCodec() {
    const fungibleCodex = scale.object(["Fungible", scale.compactU128]);
    const parachainCodec = scale.object(["Parachain", scale.compactU32]);
    const generalIndexCodec = scale.object(["GeneralIndex", scale.compactU128]);
    const x2CodecInterior = scale.object(["X2", scale.array(parachainCodec, generalIndexCodec)]);
    const x1CodecInterior = scale.object(["X1", parachainCodec])
    const concreteCodex = scale.object(["parents", scale.u8], ["interior", x2CodecInterior]);
    const idCodex = scale.object(["Concrete", concreteCodex]);
    const fungibleAmountCodec = scale.object(["id", idCodex], ["fun", fungibleCodex]);
    const withdrawAssetCodec = scale.object(["WithdrawAsset", scale.array(fungibleAmountCodec)]);
    const assetsCodex = scale.object(["Wild", scale.str]);
    const destCodex = scale.object(["parents", scale.u8], ["interior", x1CodecInterior]);
    const weightLimitCodec = scale.object(["Limited", scale.compactU64]);
    const buyExecutionCodec = scale.object(["BuyExecution",
        scale.object(
            ["fees", fungibleAmountCodec],
            ["weightLimit", weightLimitCodec]
        )
    ]);
    const x1AccountCodec = scale.object(["X1", scale.object(["AccountId32", scale.object(["network", scale.str], ["id", scale.sizedUint8array(32)])])]);
    const beneficiaryCodec = scale.object(["parents", scale.u8], ["interior", x1AccountCodec]);
    const depositAssetCodec = scale.object(["DepositAsset", scale.object(["assets", assetsCodex], ["maxAssets", scale.compactU32], ["beneficiary", beneficiaryCodec])]);
    const depositReserveAssetCodec = scale.object([
        "DepositReserveAsset",
        scale.object(
            ["assets", assetsCodex],
            ["maxAssets", scale.compactU32],
            ["dest", destCodex],
            ["xcm", scale.tuple(buyExecutionCodec, depositAssetCodec)],
        )
    ]);
    const v2XCMTransfer = scale.object(["V2", scale.tuple(withdrawAssetCodec, depositReserveAssetCodec)]);

    const data = {
        V2: [
            {
                "WithdrawAsset": [
                    {
                        "id": {
                            "Concrete": {
                                "parents": 1,
                                "interior": {
                                    "X2": [
                                        {
                                            "Parachain": 3000
                                        },
                                        {
                                            "GeneralIndex": 0
                                        }
                                    ]
                                }
                            }
                        },
                        "fun": {
                            "Fungible": BigInt(30000000000000)
                        }
                    }
                ]
            },
            {
                "DepositReserveAsset": {
                    "assets": {
                        "Wild": "All"
                    },
                    "maxAssets": 1,
                    "dest": {
                        "parents": 1,
                        "interior": {
                            "X1": {
                                "Parachain": 2000
                            }
                        }
                    },
                    "xcm": [
                        {
                            "BuyExecution": {
                                "fees": {
                                    "id": {
                                        "Concrete": {
                                            "parents": 1,
                                            "interior": {
                                                "X2": [
                                                    {
                                                        "Parachain": 3000
                                                    },
                                                    {
                                                        "GeneralIndex": 0
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    "fun": {
                                        "Fungible": BigInt(1000000000000)
                                    }
                                },
                                "weightLimit": {
                                    "Limited": BigInt(399600000000)
                                }
                            }
                        },
                        {
                            "DepositAsset": {
                                "assets": {
                                    "Wild": "All"
                                },
                                "maxAssets": 1,
                                "beneficiary": {
                                    "parents": 0,
                                    "interior": {
                                        "X1": {
                                            "AccountId32": {
                                                "network": "Any",
                                                "id": Uint8Array.from(Buffer.from("8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48", 'hex'))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]
    };

    const encoded = v2XCMTransfer.encode(data);
    const decoded = v2XCMTransfer.decode(encoded);
    // const original = Uint8Array.from(Buffer.from("0x34030208000400010200e12e0500000b00e057eb481b0e010004010100411f081300010200e12e050000070010a5d4e80107001c040a5d0d010004000101008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48001c040a5d000000", 'hex'));
    // const originalDecoded = v2XCMTransfer.decode(original);
    // console.log("Original: ", originalDecoded);
    console.log("Encoded: ", encoded);
    console.log("\nHex: ",  '0x' + Buffer.from(encoded).toString('hex'));
    console.log("\nDecoded: ", decoded);
}

// // create and register the token on testnet
// async function init() {
//     const api = await ApiPromise.create({ provider: new WsProvider("wss://basilisk-rpc.dwellir.com") });
//     await api.tx.assets.create(1, "0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48", 10000000000000000);
//     const api2 = await ApiPromise.create({ provider: new WsProvider("wss://basilisk-rpc.dwellir.com") });
//     await api2.registry.register("1");
//     api2.tx.registrar.register(1, "3000", "0");
//
//     return api;
// }

//transfer().then(console.log).catch(console.log);

createTransferCodec();