const fs = require('fs');
const sharp = require("sharp");

module.exports = {

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
    CreateFile: async (name,drive,data) => {
        try {
            await fs.writeFileSync(`${drive}/${name}`, Buffer.from(data))
            return true
        } catch(ex) {
            return false
        }
        
    },
    DeleteFile: async (name,drive) => {
        try {
            await fs.unlinkSync(`${drive}/${name}`)
            return true
        } catch (ex) {
            console.log(ex)
            return false
        }   
    },
    GetFile: async(name,drive) => {
        try {
            var result = await fs.readFileSync(`${drive}/${name}`)
            return result;
        } catch (ex) {
            console.log(ex)
            return false
        }
    },
    CreateDirectory: async (drive) => {
        try {
            var directryExists = fs.existsSync(drive)
            if(!directryExists) {
                var result = fs.mkdirSync(drive)
                return true
            }
            return true
        } catch(ex) {
            console.log(ex)
            return false
        }
    },
    DeleteDirectory: async (drive) => {
        try {
            var result = fs.rmSync(drive,{recursive:true,force:true})
            return true
        } catch(ex) {
            console.log(ex)
            return false
        }
    },
    CreateFileObject: (name, buffer, preview ) => {
        return {
            name: name,
            data:buffer,
            preview:preview
        }
    }
}