const Path = require('path')
const Fs = require('fs-extra')
const aws = require('aws-sdk')
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const folder = Path.join(__dirname, '../build')
Fs.readdir(folder, (err, files) => {
    if (err) {
        console.error(err)
        return
    } else if (!files || files.length === 0) {
        console.log(`Folder ${folder} is empty. Aborting S3 upload.`)
        return
    }

    for (const file of files) {
        const filePath = Path.join(folder, file)

        if (Fs.lstatSync(filePath).isDirectory()) {
            continue
        }

        Fs.readFile(filePath, (error, fileContent) => {
            if (error) {
                throw error
            }

            s3.upload({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `dev/${file}`,
                Body: fileContent
            }, (res) => {
                console.log(`Successfully uploaded '${file}'.`)
            })
        })
    }
})
