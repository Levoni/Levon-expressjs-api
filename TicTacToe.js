module.exports = {
    CreateTicTacToeGameState: () => {
        return {
            game_id:'',
            type:'',
            messages:[],
            current_turn:0,
            board:{},
            state:'stopped'
        }
    },

    HandleTicTacToeAction: async (command, id, db, dbHelper) => {
        let returnCommands = []
        let getGameStateSQL = `SELECT FROM tot_game where id = ?`
        let gameStateResult =  await dbHelper.select(getGameStateSQL, [id], db)
        if(gameStateResult.err) {
            return 'error'
        }
        let gameState = JSON.parse(gameStateResult.rows[0]);
        let data = JSON.parse(command)

        if(data.action == 'start') {
            gameState.state = 'placing'
            gameState.board=createStratigoBasicBoard()
            gameState.graveyard=createGraveyard()
            returnCommands.push(`{"action":"start"}`)
        } else if(data.action == 'place') {
            let placeIndex = gameState.graveyard.findIndex((element) => {return element.owner == data.player && element.power == data.power})
            let piece = gameState.graveyard.splice(placeIndex,1)[0]
            gameState.board[data.x][data.y].piece = piece
            returnCommands.push(`{"action":"piecePlaced","x":"${data.x}","y":"${data.y}","power":"${data.power}","player":"${data.player}"}`)
            let anyPiceIndex = gameState.graveyard.findIndex((element)=>{return element.owner == data.player})
            if(anyPiceIndex == -1) {
                returnCommands.push(`{"action":"lastPiecePlaced"}`)
            }
            if(gameState.graveyard.length == 0) {
                returnCommands.push(`{"action":"allPiecesPlayed"}`)
            }
        } else if(data.action == 'remove') {
            let piece = gameState.board[data.x][data.y].piece
            gameState.graveyard.push(piece)
            gameState.board[data.x][data.y].piece = null
            returnCommands.push(`{"action":"pieceRemoved","x":"${data.x}","y":"${data.y}"}`)
        } else if(data.action == 'removeAndPlace') {
            let piece = gameState.board[data.x][data.y].piece
            gameState.graveyard.push(piece)
            gameState.board[data.x][data.y].piece = null
            let placeIndex = gameState.graveyard.findIndex((element) => {return element.owner == data.player && element.power == data.power})
            piece = gameState.graveyard.splice(placeIndex,1)[0]
            gameState.board[data.x][data.y].piece = piece
            returnCommands.push(`{"action":"removeAndPlace","player":"${data.player}","power":"${data.power}","x":"${data.x}","y":"${data.y}"}`)
        } else if(data.action == 'movePiece') {
            let piece = gameState.board[data.xStart][data.yStart].piece
            let endPiece = gameState.board[data.x][data.y].piece
            if(endPiece == null) {
                gameState.board[data.x][data.y].piece = piece
                gameState.board[data.xStart][data.yStart].piece = null
                returnCommands.push(`{"action":"movePiece","xStart":"${data.xStart}","yStart":"${data.yStart}","x":"${data.x}","y":"${data.y}"}`)
            } else {
                if(piece.power == 1 && endPiece.power == 10) {
                    gameState.board[data.xStart][data.yStart].piece = null
                    gameState.board[data.x][data.y].piece = piece
                } else if (piece.power == 3 && endPiece.power == 11) {
                    gameState.board[data.xStart][data.yStart].piece = null
                    gameState.board[data.x][data.y].piece = piece
                } else if (endPiece.power == 12) {
                    gameState.board[data.xStart][data.yStart].piece = null
                    gameState.board[data.x][data.y].piece = piece
                } else if(piece.power > endPiece.power) {
                    gameState.board[data.xStart][data.yStart].piece = null
                    gameState.board[data.x][data.y].piece = piece
                } else if(piece.power < endPiece.power) {
                    gameState.board[data.xStart][data.yStart].piece = null
                } else {
                    gameState.board[data.xStart][data.yStart].piece = null
                    gameState.board[data.x][data.y].piece = null
                }
                returnCommands.push(`{"action":"battle","xStart":"${data.xStart}","yStart":"${data.yStart}","x":"${data.x}","y":"${data.y}"}`)
                if(endPiece.power == 12) {
                    gameState.state = 'stopped'
                }
            }
        } else if(data.action == 'end') {
            returnCommands.push(`{"action":"end"}`)
        } else if(data.action == 'message') {
            returnCommands.push(`{"action":"message","message":"${users[uuid4.toString()].name}: ${data.message}"}`)
        } else  if(data.action == 'sync') {
            returnCommands.push(`{"action":"sync","room":${JSON.stringify(gameState)}}`)
        }

        let updateSQL = `UPDATE tot_game set game_json = ?`
        let updateResult = dbHelper.insert(updateSQL, [gameState], db)
        if(updateResult.err) {
            return 'error'
        }

        return returnCommands
    },

}