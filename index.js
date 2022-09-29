const { ApiPromise, WsProvider} = require("@polkadot/api");

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
    const xcmTransferSample = {callIndex: 0x3403, args: {message: {"v2":[{"withdrawAsset":[{"id":{"concrete":{"parents":1,"interior":{"x2":[{"parachain":fromParachain},{"generalIndex":0}]}}},"fun":{"fungible":amount}}]},{"depositReserveAsset":{"assets":{"wild":{"all":null}},"maxAssets":1,"dest":{"parents":1,"interior":{"x1":{"parachain":toParachain}}},"xcm":[{"buyExecution":{"fees":{"id":{"concrete":{"parents":1,"interior":{"x2":[{"parachain":3000},{"generalIndex":0}]}}},"fun":{"fungible":1000000000000}},"weightLimit":{"limited":399600000000}}},{"depositAsset":{"assets":{"wild":{"all":null}},"maxAssets":1,"beneficiary":{"parents":0,"interior":{"x1":{"accountId32":{"network":{"any":null},"id":recipient}}}}}}]}}]}, max_weight: 399600000000}};
    // TODO sign with a key that has a balance on a private testnet
    return api.tx.polkadotXcm.execute({ V2: xcmTransferSample.args.message.v2 }, xcmTransferSample.args.max_weight).signAndSend(fromAccount);
}

// TODO create and register the token on a private testnet
async function init() {
    return ApiPromise.create({ provider: new WsProvider("wss://basilisk-rpc.dwellir.com") });
}

transfer("", 3000, 2000, 30000000000000, "0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48")
    .then((hash) => {
        console.log(hash);
        process.exit(0)
    })
    .catch((e) => {
        console.error(e);
        process.exit(-1);
    });