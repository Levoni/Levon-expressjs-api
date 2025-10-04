const dbHelper = require("../databaseHelper.js")
const logger = require("../logger.js")

module.exports = {
    GetAllDrives: async () => {
        let selectSQL = `SELECT * FROM drive`
        let results = await dbHelper.select(selectSQL,[])
        if (results.err) {
            logger.logError(`error getting drives: ${results.err}`)
            return {error:`error getting drives`}
        }
        return results.rows
    },

    GetDriveById: async (driveId) => {
        let selectSQL = `SELECT * FROM drive WHERE id = ?`
        let results = await dbHelper.select(selectSQL,[driveId])
        if (results.err) {
            logger.logError(`error getting drive: ${results.err}`, [`Drive Id: ${driveId}`])
            return {error:`error getting drives`}
        }
        return results.rows.length == 0 ? null : results.rows[0]
    },

    GetUserDrives: async (username) => {
        let selectSQL = `
        SELECT s.id,s.name,s.path,usl.user_name,usl.is_owner 
        FROM drive s 
        JOIN user_drive_link usl 
            ON s.id = usl.drive_id
        WHERE usl.user_name = ?`
        let results = await dbHelper.select(selectSQL,[username])
        if (results.err) {
            logger.logError(`error getting shares ${results.err}`)
            return {error:`error getting shares`}
        }
        return results.rows
    },

    GetDriveUsers: async (driveId) => {
        let selectSQL = `SELECT * from user_drive_link`
        if(!driveId) {
            driveId = `'%%'`
        }
        selectSQL += ` where drive_id like ${driveId}`
        let results = await dbHelper.select(selectSQL,[])
        if (results.err) {
            logger.logError(`error getting share users: ${results.err}`)
            return {error:`error getting share users`}
        }
        return results.rows
    },

    GetDriveRecordById: async (recordId) => {
        let selectSQL = `SELECT * from drive_record where id = ?`
        let results = await dbHelper.select(selectSQL,[recordId])
        if (results.err) {
            logger.logError(`error getting drive record info: ${results.err}`, [`Id: ${recordId}`])
            return {error:`error getting drive record info`}
        }
        return results.rows.length == 0 ? null : results.rows[0]
    },

    GetDriveRecord: async (driveId, parentId, name) => {
        let selectSQL = `SELECT * from drive_record where drive_id = ? and parent_record_id = ? and name = ?`
        let results = await dbHelper.select(selectSQL,[driveId,parentId,name])
        if (results.err) {
            logger.logError(`error getting drive record info: ${results.err}`, [`Drive: ${driveId}`, `parentId: ${parentId}`, `Name: ${name}`])
            return {error:`error getting drive record info`}
        }
        return results.rows.length == 0 ? null : results.rows[0]
    },
    
    GetDriveRecords: async (driveId, parentId, limit, offset, orderByColumn , orderByDirection) => {
        let selectSQL = `SELECT * from drive_record 
        WHERE drive_id = ? and parent_record_id = ?
        ${module.exports.GetFilterSQL(limit,offset,orderByColumn,orderByDirection)}`

        let results = await dbHelper.select(selectSQL,[driveId,parentId])
        if (results.err) {
            logger.logError(`error getting drive records info: ${results.err}`, [`Drive: ${driveId}`, `parentId: ${parentId}`])
            return {error:`error getting drive records info`}
        }
        return results.rows
    },

    GetAllDriveRecords: async (driveId) => {
        let selectSQL = `SELECT * from drive_record where drive_id = ?`
        let results = await dbHelper.select(selectSQL,[driveId])
        if (results.err) {
            logger.logError(`error getting drive records info: ${results.err}`, [`Drive: ${driveId}`])
            return {error:`error getting drive records info`}
        }
        return results.rows
    },
    GetDriveRecordsWithName: async (driveId, nameSearch) => {
        let selectSQL = `SELECT * from drive_record where type != 0 and drive_id = ? and name LIKE ?`
        let results = await dbHelper.select(selectSQL,[driveId,`%${nameSearch}%`])
        if (results.err) {
            logger.logError(`error getting drive records info: ${results.err}`, [`Drive: ${driveId}`])
            return {error:`error getting drive records info`}
        }
        return results.rows
    },
    AddDrive: async (driveName,path,creatorUserName) => {
        let SQL = `INSERT INTO drive (name,path,creator_name) 
        VALUES (?,?,?) 
        returning id`
        let results = await dbHelper.insertAndGet(SQL,[driveName,path,creatorUserName])
        if (results.err) {
            logger.logError(`error adding drive: ${results.err}`,[`drive name: ${driveName}`,`path: ${path}`, `user name: ${creatorUserName}`])
            return {error:`error to drive`}
        }
        return results.rows
    },

    AddDriveUser: async (driveId, userName, isOwner) => {
        let SQL = `INSERT INTO user_drive_link (drive_id,user_name,is_owner)
        VALUES (?,?,?)
        returning id`
        let results = await dbHelper.insertAndGet(SQL,[driveId,userName,isOwner])
        if (results.err) {
            logger.logError(`error adding user to drive: ${results.err}`,[`userName: ${userName}`,`DriveId: ${driveId}`])
            return {error:`error adding user to drive`}
        }
        return results.rows
    },

    AddDriveRecord: async (fileName, driveId, parentId, type, data, userName) => {
        let filePath = ''
        if(parentId != 0) {
            let getParentInfo = await module.exports.GetDriveRecordById(parentId)
            if(getParentInfo.error) {
                return {error: getParentInfo.error}
            }
            filePath = getParentInfo.path + '/' + getParentInfo.name
            filePath = filePath.startsWith('/') ? filePath.slice(1) : filePath
        }

        let fileBufferSize = !data ? 0 : Buffer.from(data).length

        let SQL = `INSERT INTO drive_record (drive_id, parent_record_id, name, path, type, file_size, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        returning id`
        let results = await dbHelper.insertAndGet(SQL, [driveId,parentId,fileName, filePath, type, fileBufferSize, userName])
        if (results.err) {
            logger.logError(`error adding user to drive: ${results.err}`,[`userName: ${userName}`,`DriveId: ${driveId}`])
            return {error:`error adding user to drive`}
        }
        return {
            id: results.rows.id,
            driveId: driveId,
            parent_record_id: parentId,
            name: fileName,
            path: filePath,
            type: type,
            file_size: fileBufferSize,
            created_by: userName,
        }
    },

    DeleteDriveUser: async (driveId, userName) => {
        let SQL = `DELETE FROM user_drive_link where drive_id = ? and user_name = ?`
        let results = await dbHelper.delete(SQL,[driveId,userName])
        if (results.err) {
            logger.logError(`error deleting user from drive: ${results.err}`,[`userName: ${userName}`,`DriveId: ${driveId}`])
            return {error:`error deleting user from drive`}
        }
        return results.rows
    },

    DeleteDriveUsers: async (driveId) => {
        let SQL = `DELETE FROM user_drive_link where drive_id = ?`
        let results = await dbHelper.delete(SQL,[driveId])
        if (results.err) {
            logger.logError(`error deleting users from drive: ${results.err}`,[`DriveId: ${driveId}`])
            return {error:`error deleting users from drive`}
        }
        return results.rows
    },

    DeleteDrive: async (driveId) => {
        let SQL = `DELETE FROM drive where id = ?`
        let results = await dbHelper.delete(SQL,[driveId])
        if (results.err) {
            logger.logError(`error deleting drive: ${results.err}`,[`DriveId: ${driveId}`])
            return {error:`error deleting drive`}
        }
        return results.rows
    },

    DeleteDriveRecord: async (recordId) => {
        let SQL = `DELETE FROM drive_record where id = ?`
        let results = await dbHelper.delete(SQL,[recordId])
        if (results.err) {
            logger.logError(`error deleting drive record: ${results.err}`,[`RecordId: ${recordId}`])
            return {error:`error deleting drive record`}
        }
        return results.rows
    },
    DeleteDrivePath: async (driveId, path) => {
                let SQL = `DELETE FROM drive_record where drive_id = ? and path like ?`
        let results = await dbHelper.delete(SQL,[driveId,`${path}%`])
        if (results.err) {
            logger.logError(`error deleting drive path: ${results.err}`,[`DriveId: ${driveId}`,`Path: ${path}`])
            return {error:`error deleting drive record`}
        }
        return results.rows
    },
    GetFilterSQL: (limit = 20, offset = 0, orderByColumn, orderByDirection) => {
        return `${!orderByColumn ? '' : `ORDER BY ${orderByColumn} ${orderByDirection}`}
        LIMIT ${limit} OFFSET ${offset}`
    }
}