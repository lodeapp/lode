const Fs = require('fs-extra')
const Crypto = require('crypto');

if (process.argv.length < 3) {
    throw Error('Missing project.db file path.')
}

const encryptionAlgorithm = 'aes-256-cbc'
const encryptionKey = 'v1'
const path = process.argv[2]

// Decipher encrypted project.db files
let data = Fs.readFileSync(path, null);
const decipher = Crypto.createDecipher(encryptionAlgorithm, encryptionKey)
data = Buffer.concat([decipher.update(data), decipher.final()])

console.log(JSON.stringify(JSON.parse(data)))
