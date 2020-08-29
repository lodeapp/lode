const Fs = require('fs-extra')
const Crypto = require('crypto')

if (process.argv.length < 3) {
    throw Error('Missing project.db file path.')
}

const encryptionAlgorithm = 'aes-256-cbc'
const encryptionKey = 'v1'
const path = process.argv[2]

// Decipher encrypted project.db files
let data = Fs.readFileSync(path, null)
if (data.slice(16, 17).toString() === ':') {
    const initializationVector = data.slice(0, 16)
    const password = Crypto.pbkdf2Sync(encryptionKey, initializationVector.toString(), 10000, 32, 'sha512')
    const decipher = Crypto.createDecipheriv(encryptionAlgorithm, password, initializationVector)
    data = Buffer.concat([decipher.update(data.slice(17)), decipher.final()])
} else {
    const decipher = Crypto.createDecipher(encryptionAlgorithm, encryptionKey)
    data = Buffer.concat([decipher.update(data), decipher.final()])
}

console.log(JSON.stringify(JSON.parse(data)))
