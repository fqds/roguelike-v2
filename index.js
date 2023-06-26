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
        player.IncreaceDamage(3)
    }
}

class Item_HP extends Item {
    constructor(options) {
        super(options)
        this.name = "HP"
        this.tile = "tileHP"
    }	
    
    Use() {
        player.IncreaceHP(50)
    }
}

class Wall {
    constructor(options) {
        this.type = "WALL"
        this.name = "W"
        this.tile = "tileW"
    }
}
class Map {
    constructor(options) {
        this.config = config.field
        this.field = document.getElementsByClassName("field-box")[0]
    }

    GenateMap() { // todo: Разделить методы на приватные и публичные
        this.map = Array.from({length: this.config.width}, () => Array.from({length: this.config.height}, () => [new Wall()])) // todo: Сделать эту строку красивее

        for (let i = 0; i < GetRandomInt( // todo: раскидать по методам
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

        for (let i = 0; i < GetRandomInt(
            this.config.rooms.minAmount,
            this.config.rooms.maxAmount
        ); i++) {
            this.GenerateRandomRoom()
        }

        this.GenerateItems()
    }

    GetRandomFreeCoord() {
        let freeCoords = []
        for (let x = 0; x < this.config.width; x++) { // todo: Сделать функцию, которая будет проходиться по всей карте и выполнять поданый в нее код
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

    GenerateItems() {
        for (const [itemName, itemData] of Object.entries(this.config.items)) {
            for (let i = 0; i < itemData.amount; i++) {
                const item = GetNewItem(itemName)
                const xy = this.GetRandomFreeCoord()
                this.map[xy[0]][xy[1]].push(item)
            }
        }
    }
    GenerateHorizontalTunnel() {
        const x = GetRandomInt(0, this.config.width - 1)
        console.log("built horizontal tunnel with x =", x)
        for (let y = 0; y < this.config.height; y++) {
            this.ClearTile(x, y)
        }
    }

    GenerateVerticalTunnel() {
        const y = GetRandomInt(0, this.config.height - 1)
        console.log("built vertical tunnel with y =", y)
        for (let x = 0; x < this.config.width; x++) {
            this.ClearTile(x, y)
        }
    }
    
    GenerateRandomRoom() {
        let width = 0
        let height = 0
        let xOffset = 0
        let yOffset = 0
        let isConnected = false
        while (!isConnected) {
            width = GetRandomInt(this.config.rooms.minWidth,
                                    this.config.rooms.maxWidth)
            height = GetRandomInt(this.config.rooms.minHeight,
                                        this.config.rooms.maxHeight)
            xOffset = GetRandomInt(0, this.config.width - width)
            yOffset = GetRandomInt(0, this.config.height - height)
            
            for (let x = xOffset; x < xOffset + width; x++) {
                if ((this.IsTileExist(x, yOffset - 1) && 
                    !this.IsTileWall(x, yOffset - 1)) ||
                    this.IsTileExist(x, yOffset + height) && 
                    !this.IsTileWall(x, yOffset + height)) {
                    isConnected = true
                    break
                }
            }
            if (isConnected) { break }

            for (let y = yOffset; y < yOffset + height; y++) {
                if ((this.IsTileExist(xOffset - 1, y) && 
                    !this.IsTileWall(xOffset - 1, y)) ||
                    (this.IsTileExist(xOffset + width, y) && 
                    !this.IsTileWall(xOffset + width, y))) {
                    isConnected = true
                    break
                }
            }
            console.log(`didn't build room with x = ${xOffset}, y = ${yOffset}, width = ${width}, height = ${height}`)
        }

        console.log(`built room with x = ${xOffset}, y = ${yOffset}, width = ${width}, height = ${height}`)
        for (let x = xOffset; x < xOffset + width; x++) {
            for (let y = yOffset; y < yOffset + height; y++) { this.map[x][y] = [] }
        }
    }

    RenderMap() {
        for (let x = 0; x < this.config.width; x++) {
            let newColumn = document.createElement("div")
            newColumn.className = "field";
            this.field.appendChild(newColumn)

            for (let y = 0; y < this.config.height; y++) {
                let newTile = document.createElement("div") 
                newTile.className = "tile"
                if (this.map[x][y]) {
                    for (let i = 0; i < this.map[x][y].length; i++) {
                        newTile.className += " " + this.map[x][y][i].tile
                    } 
                }
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
    
    IsTileWall(x, y) { if (this.map[x][y].length == 1 && this.map[x][y][0].type == "WALL") { return true } return false } // todo: предусмотреть расположение сторонних предметов на тайле со стеной
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
