const config = {
    "field": {
        "width": 40,
        "height": 24,
        "tunnels": {
            "horizontal": {
                "minAmount": 130,
                "maxAmount": 1666,
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
                "amount": 299,
            },
            "HP": {
                "amount": 10,
            }
        },
    },
}

function GetNewItem(itemName) { // todo: сделать лучше
    switch (itemName) {
    case "SW": return new Item_SW()
    case "HP": return new Item_HP()
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

    Use() {
        game.player.IncreaceDamage(3)
    }
}

class Item_HP extends Item {
    constructor(options) {
        super(options)
        this.name = "HP"
        this.tile = "tileHP"
    }	
    
    Use() {
        game.player.IncreaceHealth(50)
    }
}

class Wall {
    constructor(options) {
        this.type = "WALL"
        this.name = "W"
        this.tile = "tileW"
    }
}

class Player {
    constructor(options) {
        this.x = options.x
        this.y = options.y
        this.maxHealth = 100
        this.health = 100
        this.damage = 5
        this.tile = "tileP"
    }

    IncreaceDamage(damage) { this.damage += damage }

    IncreaceHealth(health) { this.health += health }

    RenderPlayer() {
        game.map.map[this.x][this.y].push(this)
        game.map.ReRenderTile(this.x, this.y)
    }

    UnrenderPlayer() {
        const playerIndex = game.map.map[this.x][this.y].indexOf(this);
        game.map.map[this.x][this.y].splice(playerIndex)
        game.map.ReRenderTile(this.x, this.y)
    }

    IsPlayerCanPassTo(x, y) {
        if (game.map.IsTileExist(x, y) &&
            !game.map.IsTileOnlyWall(x, y)) {
            return true
        }
        return false
    }

    MoveByVector(xVector, yVector) {
        const x = this.x + xVector
        const y = this.y + yVector
        if (this.IsPlayerCanPassTo(x, y)) {
            this.UnrenderPlayer()
            this.x = x
            this.y = y
            this.RenderPlayer()
        }
    }

    KeypressEvents() {
        
        document.addEventListener("keypress", function(event) {
            console.log(event.code)
          })
    }

    init() {
        this.RenderPlayer()
        this.KeypressEvents()
    }
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

    init() {
        this.GenateMap()
        this.RenderMap()
    }
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Game {
    constructor(options) {
        this.map = new Map()
        this.map.init()

        console.log(this.map)
    }

    init() {
        const xy = this.map.GetRandomFreeCoord()
        this.player = new Player({
            x: xy[0],
            y: xy[1],
        })
        this.player.init()
        console.log(this.player)
    }
}