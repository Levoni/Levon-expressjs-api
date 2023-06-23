module.exports = {
    GetYYYYMMDDhhmmss: (date) => {
        var seconds = date.getUTCSeconds();
        var minutes = date.getUTCMinutes();
        var hour = date.getUTCHours();
        var day = date.getUTCDate();
        var month = date.getUTCMonth() + 1;
        var year = date.getUTCFullYear();
        return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`
    },
    GetYYYYMMDD: (date) => {
        var day = date.getUTCDate();
        var month = date.getUTCMonth() + 1;
        var year = date.getUTCFullYear();   
        return `${year}-${month}-${day}`
    }
}