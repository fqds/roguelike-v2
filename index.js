const config = {
    "field": {
        "width": 40,
        "height": 24,
        "tunnels": {
            "horizontal": {
                "minAmount": 3,
                "maxAmount": 5,
            },
            "vertical": {
                "minAmount": 3,
                "maxAmount": 5,
            },
        },
        "rooms": {
            "minAmount": 5,
            "maxAmount": 10,
            "minWidth": 3,
            "maxWidth": 8,
            "minHeight": 3,
            "maxHeight": 8,
        },
        "items": {
            "SW": {
                "amount": 2,
            },
            "HP": {
                "amount": 10,
            }
        },
        "enemies": {
            "E": {
                "amount": 10,
            },
        },
    },
}

function GetNewItem(itemName) { // todo: сделать лучше
    switch (itemName) {
    case "SW": return new Item_SW()
    case "HP": return new Item_HP()
    }
}

function GetNewEnemy(enemyName, options) {
    switch (enemyName) {
    case "E": return new Enemy_E(options)
    }
}



class Item {
    constructor(options) {
        this.type = "ITEM"
    }

    Use() {
        console.log("Used empty item")
    }
}

class Item_SW extends Item {
    constructor(options) {
        super(options)
        this.name = "SW"
        this.tile = "tileSW"
    }

    Use(player) {
        player.IncreaceDamage(15)
    }
}

class Item_HP extends Item {
    constructor(options) {
        super(options)
        this.name = "HP"
        this.tile = "tileHP"
    }	
    
    Use(player) {
        player.IncreaceHealth(50)
    }
}

class Wall {
    constructor(options) {
        this.type = "WALL"
        this.name = "W"
        this.tile = "tileW"
    }
}

class Enemy {
    constructor(options) {
        this.type = "ENEMY"
        this.x = options.x
        this.y = options.y
    }
}

class Enemy_E extends Enemy {
    constructor(options) {
        super(options)
        this.maxHealth = 100
        this.health = 100
        this.damage = 30
        this.tile = "tileE"
    }

    CanPassTo(x, y) {
        if (game.map.IsTileExist(x, y) &&
            !game.map.IsTileOnlyWall(x, y) &&
            !game.map.IsEnemyOnTyle(x, y)) {
            return true
        }
        return false
    }

    Unrender() {
        const enemyIndex = game.map.map[this.x][this.y].indexOf(this)
        game.map.map[this.x][this.y].splice(enemyIndex, 1)
        game.map.ReRenderTile(this.x, this.y)

    }

    Render() {
        game.map.map[this.x][this.y].push(this)
        game.map.ReRenderTile(this.x, this.y)
    }

    MoveTo(x, y) {
        this.Unrender()
        this.x = x
        this.y = y
        this.Render()
    }

    RandomMove() {
        let moveTo = shuffle([[this.x, this.y - 1],
                              [this.x - 1, this.y],
                              [this.x, this.y + 1],
                              [this.x + 1, this.y]])

        let moveIndex = 0
        for (; moveIndex < 4; moveIndex++) {
            if (this.CanPassTo(moveTo[moveIndex][0], moveTo[moveIndex][1])) {
                break
            }
        }

        this.MoveTo(moveTo[moveIndex][0], moveTo[moveIndex][1])
    }

    PlayersInRange(range) {
        let players = []
        for (let x = this.x - range; x <= this.x + range; x++) {
            for (let y = this.y - range; y <= this.y + range; y++) {
                const player = game.map.GetPlayerOnTyle(x, y)
                if (player) {
                    players.push(game.map.GetPlayerOnTyle(x, y))
                }
            }
        }
        return players
    }

    Action() {
        let players = this.PlayersInRange(1)
        if (players.length != 0) {
            console.log("Враг атакует героя")
            this.DelayTillAction(1000)
        } else {
            players = this.PlayersInRange(5) 
            if (players.length != 0) {
                console.log("Враг видит героя")
                this.DelayTillAction(700)
            }
            else {
                console.log("Враг ищет героя")
                this.RandomMove()
                this.DelayTillAction(1500)
            }
        }
    }

    DelayTillAction(ms) {
        return new Promise(r => setTimeout(() => r(), ms)).then(() => {
            this.Action()
        })
    }

    init() {
        this.DelayTillAction(1000)
    }
}

class Player {
    constructor(options) {
        this.x = options.x
        this.y = options.y
        this.maxHealth = 100
        this.health = 100
        this.damage = 25
        this.type = "PLAYER"
        this.tile = "tileP"
    }

    IncreaceDamage(damage) { this.damage += damage }

    IncreaceHealth(health) {
        this.health += health
        if (this.health > this.maxHealth) { this.health = this.maxHealth }
    }

    Render() { // todo: добавить хп бары
        game.map.map[this.x][this.y].push(this)
        game.map.ReRenderTile(this.x, this.y)
    }

    Unrender() {
        const playerIndex = game.map.map[this.x][this.y].indexOf(this)
        game.map.map[this.x][this.y].splice(playerIndex, 1)
        game.map.ReRenderTile(this.x, this.y)
    }

    CanPassTo(x, y) {
        if (game.map.IsTileExist(x, y) &&
            !game.map.IsTileOnlyWall(x, y)) {
            return true
        }
        return false
    }

    MoveByVector(xVector, yVector) {
        const x = this.x + xVector
        const y = this.y + yVector
        if (this.CanPassTo(x, y)) {
            this.Unrender()
            this.x = x
            this.y = y
            this.Render()
            console.log(`player moved to x = ${x}, y = ${y}`)
        }
        this.UseItemOnTile()
    }

    UseItemOnTile() {
        for (let i = 0; i < game.map.map[this.x][this.y].length; i++) { // todo: заменить на while
            if (game.map.map[this.x][this.y][i].type == "ITEM") {
                game.map.map[this.x][this.y][i].Use(this)
                game.map.RemoveFromTile(this.x, this.y, i)
            }
        }
    }

    init() {
        this.Render()
    }
}

function KeypressEvents(player) {
    let keyDown = {
        "KeyW": false,
        "KeyA": false,
        "KeyS": false,
        "KeyD": false,
        "Space": false,
    }

    document.addEventListener("keydown", function(event) {
        if (keyDown[event.code] == false) {
            keyDown[event.code] = true
            switch(event.code) {
            case "KeyW": player.MoveByVector(0, -1); break
            case "KeyA": player.MoveByVector(-1, 0); break
            case "KeyS": player.MoveByVector(0, 1); break
            case "KeyD": player.MoveByVector(1, 0); break
            }
        }
    })
    document.addEventListener("keyup", function(event) {
        keyDown[event.code] = false
    })
}

class Map { // todo: добавить синглтон
    constructor(options) {
        this.config = config.field
        this.field = document.getElementsByClassName("field-box")[0]
    }

    GenateMap() { // todo: Разделить методы на приватные и публичные, поработать над конвенцией
        this.map = Array.from({length: this.config.width}, () => Array.from({length: this.config.height}, () => [new Wall()])) // todo: Сделать эту строку красивее

        this.GenerateTunnels()

        this.GenerateRandomRooms()

        this.GenerateItems()

        this.GenerateEnemies()
    }

    GetRandomFreeCoord() {
        let freeCoords = []
        for (let x = 0; x < this.config.width; x++) {
            for (let y = 0; y < this.config.height; y++) {
                if (this.map[x][y].length == 0) {
                    freeCoords.push([x, y])
                }
            }
        }
        return freeCoords[GetRandomInt(0, freeCoords.length - 1)] 
        // Можно ли в js вернуть 2 поля, так, чтобы их можно было присвоить двум разным переменным? 
        // a, b = GetAB()
    }

    GenerateTunnels() {
        for (let i = 0; i < GetRandomInt(
            this.config.tunnels.horizontal.minAmount, 
            this.config.tunnels.horizontal.maxAmount
        ); i++) {
            this.GenerateHorizontalTunnel()
        }

        for (let i = 0; i < GetRandomInt(
            this.config.tunnels.vertical.minAmount, 
            this.config.tunnels.vertical.maxAmount
        ); i++) {
            this.GenerateVerticalTunnel()
        }
    }

    GenerateItems() {
        for (const [itemName, itemData] of Object.entries(this.config.items)) {
            for (let i = 0; i < itemData.amount; i++) {
                const xy = this.GetRandomFreeCoord()
                this.SetItem(itemName, xy[0], xy[1])
            }
        }
    }

    SetItem(itemName, x, y) {
        const item = GetNewItem(itemName)
        this.map[x][y].push(item)
        console.log(`Item ${itemName} placed at x = ${x}, y = ${y}`)
    }

    GenerateEnemies() {
        for (const [enemyName, enemyData] of Object.entries(this.config.enemies)) {
            for (let i = 0; i < enemyData.amount; i++) {
                const xy = this.GetRandomFreeCoord()
                this.SetEnemy(enemyName, xy[0], xy[1])
            }
        }
    }

    SetEnemy(enemyName, x, y) {
        const options = {
            "x": x,
            "y": y,
        }

        const enemy = GetNewEnemy(enemyName, options)
        this.map[x][y].push(enemy)
        enemy.init()
        console.log(`Enemy ${enemyName} placed at x = ${x}, y = ${y}`)
    }

    GenerateHorizontalTunnel() {
        const x = GetRandomInt(0, this.config.width - 1)
        for (let y = 0; y < this.config.height; y++) {
            this.ClearTile(x, y)
        }
        console.log("built horizontal tunnel with x =", x)
    }

    GenerateVerticalTunnel() {
        const y = GetRandomInt(0, this.config.height - 1)
        for (let x = 0; x < this.config.width; x++) {
            this.ClearTile(x, y)
        }
        console.log("built vertical tunnel with y =", y)
    }

    GenerateRandomRooms() {
        for (let i = 0; i < GetRandomInt(
            this.config.rooms.minAmount,
            this.config.rooms.maxAmount
        ); i++) {
            this.GenerateRandomRoom()
        }
    }
    
    GenerateRandomRoom() {
        let width = 0
        let height = 0
        let xOffset = 0
        let yOffset = 0
        while (true) {
            width = GetRandomInt(this.config.rooms.minWidth,
                                    this.config.rooms.maxWidth)
            height = GetRandomInt(this.config.rooms.minHeight,
                                        this.config.rooms.maxHeight)
            xOffset = GetRandomInt(0, this.config.width - width)
            yOffset = GetRandomInt(0, this.config.height - height)
            if (this. IsRoomConnected(xOffset, yOffset, width, height)) { break }
        }
        this.SetRoom(xOffset, yOffset, width, height)
    }

    IsRoomConnected(xOffset, yOffset, width, height) {
        for (let x = xOffset; x < xOffset + width; x++) {
            if ((this.IsTileExist(x, yOffset - 1) && 
                !this.IsTileOnlyWall(x, yOffset - 1)) ||
                this.IsTileExist(x, yOffset + height) && 
                !this.IsTileOnlyWall(x, yOffset + height)) {
                return true
            }
        }

        for (let y = yOffset; y < yOffset + height; y++) {
            if ((this.IsTileExist(xOffset - 1, y) && 
                !this.IsTileOnlyWall(xOffset - 1, y)) ||
                (this.IsTileExist(xOffset + width, y) && 
                !this.IsTileOnlyWall(xOffset + width, y))) {
                return true
            }
        }
        console.log(`unconnected room with x = ${xOffset}, y = ${yOffset}, width = ${width}, height = ${height}`)
        return false
    }

    SetRoom(xOffset, yOffset, width, height) {
        for (let x = xOffset; x < xOffset + width; x++) {
            for (let y = yOffset; y < yOffset + height; y++) { this.map[x][y] = [] }
        }
        console.log(`built room with x = ${xOffset}, y = ${yOffset}, width = ${width}, height = ${height}`)

    }

    RemoveFromTile(x, y, i) {
        delete this.map[x][y][i] // todo: узнать, как работает сборщик мусора в js
        this.map[x][y].splice(i, 1)
        this.ReRenderTile(x, y)
    }

    ReRenderTile(x, y) {
        let tile = this.field.children[x].children[y]
        tile.className = this.GetClassName(x, y)
    }

    GetClassName(x, y) {
        let className = "tile"
        for (let i = 0; i < this.map[x][y].length; i++) {
            className += " " + this.map[x][y][i].tile
        }
        return className
    }
    
    RenderMap() {
        for (let x = 0; x < this.config.width; x++) {
            let newColumn = document.createElement("div")
            newColumn.className = "field"
            this.field.appendChild(newColumn)

            for (let y = 0; y < this.config.height; y++) {
                let newTile = document.createElement("div") 
                newTile.className = this.GetClassName(x, y)
                this.field.lastChild.appendChild(newTile)
            }
        }
    }

    ClearTile(x, y) {
        this.map[x][y] = []
    }

    IsTileExist(x, y) { 
        if (x >= 0 && x < this.config.width && 
            y >= 0 && y < this.config.height) {
            return true
        }
        return false
    }

    IsTileEmpty(x, y) { if (this.map[x][y].length == 0) { return true } return false }

    IsTileOnlyWall(x, y) { if (this.map[x][y].length == 1 && this.map[x][y][0].type == "WALL") { return true } return false }

    IsEnemyOnTyle(x, y) {
        for (let i = 0; i < this.map[x][y].length; i++) {
            if (this.IsTileExist() && this.map[x][y][i].type == "ENEMY") {
                return true
            }
        }
        return false
    }

    GetPlayerOnTyle(x, y) {
        if (!this.IsTileExist(x, y)) {
            return false
        }
        for (let i = 0; i < this.map[x][y].length; i++) {
            if (this.map[x][y][i].type == "PLAYER") {
                return this.map[x][y][i]
            }
        }
        return false
    }

    init() {
        this.GenateMap()
        this.RenderMap()
    }
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]]
    }
    return array
  }

class Game {
    constructor(options) {
        this.map = new Map()
        console.log(this.map)
    }

    init() {
        this.map.init()
        const xy = this.map.GetRandomFreeCoord()
        this.player = new Player({
            x: xy[0],
            y: xy[1],
        })
        this.player.init()
        console.log(this.player)
        KeypressEvents(this.player)
    }
}