module.exports = {
    CreateStrategoGameState: () => {
        return {
            game_id: '',
            type: '',
            board:null,
            graveyard:  null,
            state:'',
            currentPlayer:0,
            messages:[],
            lastMove:''
        }
    },

    createStratigoBasicBoard: () => {
        let board = []
        for(let i = 0; i < 10; i++) {
            let row = []
            for(let y = 0; y < 10; y++) {
                if((i == 4 || i == 5) && (y == 2 || y ==3 || y == 6 || y == 7)) {
                    row.push(createStratigoBasicTile(1))
                } else {
                    row.push(createStratigoBasicTile(0))
                }
            }
            board.push(row)
        }
        return board
    },

    createStratigoBasicTile: (type) => {
        return {type:type,piece:null}
    },
    
    createGraveyard: () => {
        let graveyard = []
        for(let i = 0;i < 1; i++) {
            graveyard.push({owner:1,power:12})
            graveyard.push({owner:2,power:12})
            graveyard.push({owner:1,power:10})
            graveyard.push({owner:2,power:10})
            graveyard.push({owner:1,power:9})
            graveyard.push({owner:2,power:9})
        }
        for(let i = 0;i < 6; i++) {
            graveyard.push({owner:1,power:11})
            graveyard.push({owner:2,power:11})
        }
        for(let i = 0;i < 2; i++) {
            graveyard.push({owner:1,power:8})
            graveyard.push({owner:2,power:8})
        }
        for(let i = 0;i < 3; i++) {
            graveyard.push({owner:1,power:7})
            graveyard.push({owner:2,power:7})
        }
        for(let i = 0;i < 4; i++) {
            graveyard.push({owner:1,power:6})
            graveyard.push({owner:2,power:6})
            graveyard.push({owner:1,power:5})
            graveyard.push({owner:2,power:5})
            graveyard.push({owner:1,power:4})
            graveyard.push({owner:2,power:4})
        }
        for(let i = 0;i < 5; i++) {
            graveyard.push({owner:1,power:3})
            graveyard.push({owner:2,power:3})
        }
        for(let i = 0;i < 8; i++) {
            graveyard.push({owner:1,power:2})
            graveyard.push({owner:2,power:2})
        }
        for(let i = 0;i < 1; i++) {
            graveyard.push({owner:1,power:1})
            graveyard.push({owner:2,power:1})
        }
        return graveyard
    },

    HandleTicTacToeAction: async (command, gameState, db, dbHelper) => {
        let returnCommands = []
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