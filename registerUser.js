'use strict';

const {Gateway, FileSystemWallet} = require('fabric-network');
const path = require('path');

const ccpPath = path.join('..', 'fabric-boilerplate', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');

async function register() {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        if (await wallet.exists('user1')) {
            console.log('User 1 already exists!');
            return true;
        }

        if (!await wallet.exists('admin')) {
            console.log('Enroll admin first!');
            return false;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, {
            wallet,
            identity: 'admin',
            discovery: {
                enabled: true,
                asLocalhost: true,
            }
        });

        const client = gateway.getClient();
        const ca = client.getCertificateAuthority();
        const adminUser = await client.getUserContext('admin', false);

        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'user1',
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: 'user1',
            enrollmentSecret: secret,
        });
        const X509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.import('user1', X509Identity);
        console.log('Successfully register user1');
        return true;

    } catch (e) {
        console.error(`Failed to register user: ${e}`);
        return false;
    }
}

register();

