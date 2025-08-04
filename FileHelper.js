const fs = require('fs');
const sharp = require("sharp");
const logger = require('./logger');
const Module = require('module');

module.exports = {
    GetFileType: (fileName) => {
        let splitFileName = fileName.split('.')
        let extension = splitFileName.at(-1)
        if(splitFileName.length <= 1) { //Directory
            return 0
        }
        else if(extension == 'jpg' || extension == 'JPG' ||
            extension == 'jpeg' || extension == 'JPEG' ||
            extension == 'png' || extension == 'PNG'
        ) { //Image
            return 1
        }
        else if(extension == 'pdf' || extension == 'PDF') { // pdf
            return 2
        } else { //Anything else
            return 10
        }
    },

    GetFiles: async (drive,size,start,withPreview) => {
        var files = fs.readdirSync(drive)
        files = files.slice(start,start + size)
        var fileObjects = await Promise.all(files.map(async (x,i) => {
            let preview = null
            if(withPreview) {
                let loweredName = x.toString().toLowerCase()
                if(loweredName.includes('.png') || loweredName.includes('.jpg' || loweredName.includes('.jpeg'))) {
                    preview = await fs.readFileSync(`${drive}/${x}`)
                    preview = await sharp(preview)
                    .resize({height:50,fit:'inside'})
                    .toBuffer()
                }
            }
            var object = module.exports.CreateFileObject(x,null,preview)
            return object
        }))

        return fileObjects
    },
    GetFilesUsingRecords: async (driveRecords, driveInfo, withPreview) => {
        let drivePath = driveInfo.path
        var fileObjects = await Promise.all(driveRecords.map(async (x,i) => {
            let preview = null
            if(withPreview) {
                let loweredName = x.toString().toLowerCase()
                if(loweredName.includes('.png') || loweredName.includes('.jpg' || loweredName.includes('.jpeg'))) {
                    let fullPath = Module.exports.ConstructFilePath(x.name, x.path, drivePath)
                    preview = await fs.readFileSync(fullPath)
                    preview = await sharp(preview)
                    .resize({height:50,fit:'inside'})
                    .toBuffer()
                }
            }
            var object = module.exports.CreateFileObject(x.name,null,preview)
            return object
        }))

        return fileObjects
    },
    CreateFile: async (name,drivePath,path,data) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name,path,drivePath)
            await fs.writeFileSync(fullPath, Buffer.from(data))
            return true
        } catch(ex) {
            logger.logError('Error Creating File', [`name: ${name}`, `drivePath: ${path}`,`drive: ${drive}`])
            return false
        }
        
    },
    DeleteFile: async (name,drivePath, path) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name,path,drivePath)
            await fs.unlinkSync(fullPath)
            return true
        } catch (ex) {
            console.log(ex)
            return false
        }   
    },
    GetFile: async(name,drive,path) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name,path,drive)
            var result = await fs.readFileSync(fullPath)
            return result;
        } catch (ex) {
            logger.logError(`error getting file from drive`, [`ex: ${ex}`,`name: ${name}`,`drive: ${drive}`, `path: ${path}`])
            return false
        }
    },
    CreateDirectory: async (name, path, drivePath) => {
        try {
            let fullPath = module.exports.ConstructFilePath(name,path,drivePath)
            var directoryExists = fs.existsSync(fullPath)
            if(!directoryExists) {
                var result = fs.mkdirSync(fullPath, { recursive: true })
                return true
            }
            return true
        } catch(ex) {
            logger.logError('Failed to create directory',[`ex: ${ex}`])
            return false
        }
    },
    DeleteDirectory: async (drive) => {
        try {
            var result = fs.rmSync(drive,{recursive:true,force:true})
            return true
        } catch(ex) {
            logger.logError('Failed to delete directory',[`ex: ${ex}`])
            return false
        }
    },
    CreateFileObject: (name, buffer, preview ) => {
        return {
            name: name,
            data:buffer,
            preview:preview
        }
    },
    ConstructFilePath: (fileName, filePath, drivePath) => {
        return `${drivePath ? drivePath + '/' : ''}${filePath ? filePath : ''}${fileName}`
    }
}