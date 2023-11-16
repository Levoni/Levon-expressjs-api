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
        var day = date.getUTCDate().toString().padStart(2, "0");
        var month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        var year = date.getUTCFullYear().toString().padStart(2, "0");   
        return `${year}-${month}-${day}`
    },
    SubtractMonths: (date, months) => {
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth() - months, 
            date.getUTCDate()
        );
    },
    SubtractDays: (date, days) => {
        var dateOffset = (24*60*60*1000) * days; //5 days
        date.setTime(date.getTime() - dateOffset);
        return date
    },
    AddMonths: (date, months) => {
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth() + months, 
            date.getUTCDate()
        );
    },
    AddDays: (date, days) => {
        var dateOffset = (24*60*60*1000) * days; //5 days
        date.setTime(date.getTime() + dateOffset);
        return date
    },
}