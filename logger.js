module.exports = {
    logError: (message, data) => {
        console.log(`Error: ${message}`)
        if(data) {
            let dataString = data.join(',')
            console.log(dataString)
        }
    },
    logResult: (message, data) => {
        console.log(`Result: ${message}`)
        if(data) {
            let dataString = data.join(',')
            console.log(dataString)
        }
    }
}