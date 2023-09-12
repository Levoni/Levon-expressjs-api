module.exports = {
    CreateTicTacToeGameState: () => {
        return {
            game_id:'',
            type:'tic-tac-toe',
            messages:[],
            currentPlayer:0,
            board:{},
            state:'stopped'  
        }
    },

    checkTicTacToeWin: (board) => {
        if(board['00'] == board['01'] && board['01'] == board['02'] && board['00'] != undefined) {
            return board['00']
        }
        if(board['10'] == board['11'] && board['11'] == board['12'] && board['10'] != undefined) {
            return board['10']
        }
        if(board['20'] == board['21'] && board['21'] == board['22'] && board['20'] != undefined) {
            return board['20']
        }
        if(board['00'] == board['10'] && board['10'] == board['20'] && board['00'] != undefined) {
            return board['00']
        }
        if(board['01'] == board['11'] && board['11'] == board['21'] && board['01'] != undefined) {
            return board['01']
        }
        if(board['02'] == board['12'] && board['12'] == board['22'] && board['02'] != undefined) {
            return board['02']
        }
        if(board['00'] == board['11'] && board['11'] == board['22'] && board['00'] != undefined) {
            return board['00']
        }
        if(board['20'] == board['11'] && board['11'] == board['02'] && board['20'] != undefined) {
            return board['20']
        }
        if(board['00'] != undefined && board['01'] != undefined && board['02'] != undefined &&
        board['10'] != undefined && board['11'] != undefined && board['12'] != undefined &&
        board['20'] != undefined && board['21'] != undefined && board['22'] != undefined ) {
            return 3
        }
        return 0
    },

    HandleTicTacToeAction: async (command, gameState, db, dbHelper) => {
        let returnCommands = []
        let data = JSON.parse(command)

        if(data.action == 'start') {
            gameState.state = 'started'
            gameState.board = {}
            gameState.currentPlayer= 1
            returnCommands.push(`{"action":"start","startPlayer":"${currentPlayer}"}`)
            returnCommands.push(`{"action":"message","message":"The game has started"}`)
            gameState.messages.push('The game has started')
        } else if (data.action == 'place' && gameState.state == 'started') {
            if(gameState.board[data.location] == undefined) {
                gameState.board[data.location] = data.player
                let winner = checkTicTacToeWin(gameState.board)
                returnCommands.push(`{"action":"placeMark","player":"${data.player}","place":"${data.location}"}`)
                if(winner != 0) {
                    returnCommands.push(`{"action":"end","winner":"${winner}"}`)
                    gameState.state == 'stopped'
                    returnCommands.push(`{"action":"message","message":"${winner == 3 ? 'Cats Game': 'Player ' + currentPlayer + ' is the winner'}"}`)
                    gameState.messages.push(winner == 3 ? 'Cats Game': 'Player ' + currentPlayer + ' is the winner')
                }
            }
        } else if (data.action == 'message') {
            returnCommands.push(`{"action":"message","message":"${currentPlayer}: ${data.message}"}`)
            gameState.messages.push(`${currentPlayer}: ${data.message}"}`)
        } else  if(data.action == 'sync') {
            returnCommands.push(`{"action":"sync","room":${JSON.stringify(gameState)}}`)
        }

        let updateSQL = `UPDATE tot_game set game_json = ?`
        let updateResult = dbHelper.update(updateSQL, [gameState], db)
        if(updateResult.err) {
            return 'error'
        }

        return returnCommands
    },

}