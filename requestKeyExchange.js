const {FileSystemWallet, Gateway} = require('fabric-network');
const path = require('path');
const crypto = require('crypto');

const ccpPath = path.join('..', 'fabric-boilerplate', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');


function encrypt(data, pk) {
    let encrypted = crypto.publicEncrypt(pk, buffer);
    return encrypted.toString("base64");
}

function sign(data, key) {
    let sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(key, 'hex');
}

const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'top secret'
    }
});

async function requestKeyExchange(vehicle, smdest) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        if (!await wallet.exists('user1')) {
            console.log('user1 does not exist');
            return false;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, {
            wallet,
            identity: 'user1',
            discovery: {
                asLocalhost: true,
                enabled: true,
            }
        });

        const channel = gateway.getNetwork('main');
        const contract = (await channel).getContract('vehiclekey');

        const info = `${vehicle}`;
        const encryptedInfo = encrypt(info, smdest);

        const sk = privateKey;
        const smthis = publicKey;

        const signature = sign(encryptedInfo + smdest, sk);

        await contract.submitTransaction('exchangeKey', smdest, smthis, vehicle, encryptedInfo, signature);
        await gateway.disconnect();
        return true;
    } catch (e) {
        console.error(`Cannot request key exchange: ${e}`);
        return false;
    }
}

requestKeyExchange(1,2);
