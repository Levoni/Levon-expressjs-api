const fs = require('fs/promises');
const sharp = require("sharp");
const logger = require('./logger');

module.exports = {
    GetFileType: (fileName) => {
        let splitFileName = fileName.split('.')
        let extension = splitFileName.at(-1)
        if (splitFileName.length <= 1) { //Directory
            return 0
        }
        else if (extension == 'jpg' || extension == 'JPG' ||
            extension == 'jpeg' || extension == 'JPEG' ||
            extension == 'png' || extension == 'PNG'
        ) { //Image
            return 1
        }
        else if (extension == 'pdf' || extension == 'PDF') { // pdf
            return 2
        } else { //Anything else
            return 10
        }
    },
    CreatePreviewFromBuffer: async (imageBuffer, fileName = '') => {
        let loweredName = fileName.toString().toLowerCase()
        if (loweredName.includes('.png') || loweredName.includes('.jpg' || loweredName.includes('.jpeg') || fileName === '')) {
            return await sharp(imageBuffer)
                .resize({ height: 50, fit: 'inside' })
                .toBuffer()
        }
        return null
    },
    GetFiles: async (drive, size, start, withPreview) => {
        var files = fs.readdir(drive)
        files = files.slice(start, start + size)
        var fileObjects = await Promise.all(files.map(async (x, i) => {
            let preview = null
            if (withPreview) {
                let loweredName = x.toString().toLowerCase()
                if (loweredName.includes('.png') || loweredName.includes('.jpg' || loweredName.includes('.jpeg'))) {
                    preview = await fs.readFile(`${drive}/${x}`)
                    preview = await sharp(preview)
                        .resize({ height: 50, fit: 'inside' })
                        .toBuffer()
                }
            }
            var object = module.exports.CreateFileObject(x, null, preview, 0)
            return object
        }))

        return fileObjects
    },
    GetFilesUsingRecords: async (driveRecords, driveInfo, withPreview) => {
        let drivePath = driveInfo.path
        var fileObjects = await Promise.all(driveRecords.map(async (x, i) => {
            let preview = null
            if (withPreview) {
                let loweredName = x.name.toString().toLowerCase()
                if (loweredName.includes('.png') || loweredName.includes('.jpg' || loweredName.includes('.jpeg'))) {
                    let fullPath = module.exports.ConstructFilePath(x.name, x.path, drivePath)
                    preview = await fs.readFile(fullPath)
                    preview = await sharp(preview)
                        .resize({ height: 50, fit: 'inside' })
                        .toBuffer()
                }
            }
            var object = module.exports.CreateFileObject(x.name, null, preview, x.id, x)
            return object
        }))

        return fileObjects
    },
    CreateFile: async (name, drivePath, path, data) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name, path, drivePath)
            await fs.writeFile(fullPath, Buffer.from(data))
            return true
        } catch (ex) {
            logger.logError('Error Creating File', [`name: ${name}`, `drivePath: ${path}`, `drive: ${drive}`])
            return false
        }

    },
    DeleteFile: async (name, drivePath, path) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name, path, drivePath)
            await fs.unlink(fullPath)
            return true
        } catch (ex) {
            console.log(ex)
            return false
        }
    },
    DeleteDirectory: async (name, drivePath, path) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name, path, drivePath)
            await fs.rm(fullPath, { recursive: true })
            return true
        } catch (ex) {
            console.log(ex)
            return false
        }
    },
    GetFileBuffer: async (name, drive, path) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name, path, drive)
            var result = await fs.readFile(fullPath)
            return result;
        } catch (ex) {
            logger.logError(`error getting file from drive`, [`ex: ${ex}`, `name: ${name}`, `drive: ${drive}`, `path: ${path}`])
            return false
        }
    },
    CreateDirectory: async (name, path, drivePath) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name, path, drivePath)
            var result = fs.mkdir(fullPath, { recursive: true })
            return true
        } catch (ex) {
            logger.logError('Failed to create directory', [`ex: ${ex}`])
            return false
        }
    },
    CreateFileObject: (name, buffer, preview, id, metaData = {}) => {
        return {
            name: name,
            id: id,
            buffer: buffer,
            preview: preview,
            metaData: {
                ...module.exports.CreateFileMetaData(metaData)
            }
        }
    },
    CreateFileMetaData: (metaData = {}) => {
        return {
            type: metaData.type,
            parentRecordId: metaData.parent_record_id,
            owner: metaData.created_by ? metaData.created_by : '',
            createdOn: metaData.created_on,
            fileSize: metaData.file_size
        }
    },
    ConstructFilePath: (fileName, filePath, drivePath) => {
        return `${drivePath ? drivePath + '/' : ''}${filePath ? filePath + '/' : ''}${fileName}`
    }
}