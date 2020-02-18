const { FileSystemWallet } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');

const ccpPath = path.join('..', 'fabric-boilerplate','test-network', 'organizations','peerOrganizations', 'org1.example.com','connection-org1.json');
const ccpJson = fs.readFileSync(ccpPath, 'utf-8');
const ccp = JSON.parse(ccpJson);

const cert = '-----BEGIN CERTIFICATE-----' +
    'MIICJjCCAc2gAwIBAgIUb7w7wVuqGtsRVYJ4UFK1n/6KhmQwCgYIKoZIzj0EAwIw' +
    'cDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH' +
    'EwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh' +
    'Lm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwMjExMTY1NTAwWhcNMzUwMjA3MTY1NTAw' +
    'WjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV' +
    'BAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT' +
    'Y2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABC96' +
    'Hw+KhVsMehloO3VLl03FzzA3HO+fBpIuFf8AHQwD+5NKuJUvbZUJnc/jpgCM3GY3' +
    '3PEwMlBYzC1r3b5RxYujRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG' +
    'AQH/AgEBMB0GA1UdDgQWBBQK7J9g+klGdESME6nbiWdqwlNAQjAKBggqhkjOPQQD' +
    'AgNHADBEAiAeVvew+SOfvkFGTZrB+35bTsc+HL3ZGZhTQsNodZVSHgIgAVbLa+ID' +
    'dxiWXvppmSathHO2YGEOYmh4wMgD9YPmzEM=' +
    '-----END CERTIFICATE-----';
const csr = '-----BEGIN PRIVATE KEY-----' +
    'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgm8nwKsBlBlE7vvE2' +
    'nhhL5ZKSI96GX2aXvmZ4Uo5wMLOhRANCAARH3ymWjq1zNpH2wdvtH6Wiy7amvVXX' +
    'T8UDS+HU+Txf3gXSBgER4V3TqqUhKxF2/WNNxMs3Z8UZik8M3nmyPzmx' +
    '-----END PRIVATE KEY-----';

console.log(ccp);

async function enroll() {
    try {
        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: [caTLSCACerts], verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        if (await wallet.exists('admin')) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return true;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.import('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        return true;
    } catch (e) {
        console.log(`Cannot enroll admin: ${e}`);
        return false;
    }
}

enroll();
