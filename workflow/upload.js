const Path = require('path')
const Fs = require('fs-extra')
const aws = require('aws-sdk')
const s3 = new aws.S3({
    region: 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const filters = {
    darwin: '\.zip$',
    linux: '\.tar\.gz$',
    win32: '\.zip$'
}

const folder = Path.join(__dirname, '../build')
const files = Fs.readdirSync(folder)

if (!files || files.length === 0) {
    console.log(`Folder ${folder} is empty. Aborting S3 upload.`)
    process.exit(1)
}

for (const file of files) {
    // If file doesn't match the given filter, continue.
    if (filters[process.platform] && file.search(new RegExp(filters[process.platform])) === -1) {
        continue
    }

    const filePath = Path.join(folder, file)

    // Abort if file is a directory.
    if (Fs.lstatSync(filePath).isDirectory()) {
        continue
    }

    s3.upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `dev/${process.platform}/${file}`,
        Body: Fs.readFileSync(filePath)
    }, (res) => {
        console.log(`Successfully uploaded '${file}'.`)
    })
}