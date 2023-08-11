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

function GetNewItem(itemName) {
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

class Tile {
    constructor(options = {}) {
        this.x = options.x
        this.y = options.y
    }
}

class Item extends Tile{
    constructor(options) {
        super(options)
    }
}

class Item_SW extends Item {
    constructor(options) {
        super(options)
        this.tile = "tileSW"
    }

    Use(player) {
        player.IncreaceDamage(15)
    }
}

class Item_HP extends Item {
    constructor(options) {
        super(options)
        this.tile = "tileHP"
    }	
    
    Use(player) {
        player.IncreaceHealth(50)
    }
}

class Wall extends Tile {
    constructor(options) {
        super(options)
        this.tile = "tileW"
    }
}

class Enemy extends Tile {
    constructor(options) {
        super(options)
        this.DelayAfterAtack = 1000
        this.DelayAfterMoveToPlayer = 700
        this.DelayAfterRandomMove = 1500
    }
    
    set health(health) {
        this._health = health
        game.map.RerenderHealthBar(this.x, this.y, this.maxHealth, this._health)
    }

    get health() {
        return this._health
    }

    _canPassTo(x, y) {
        if (game.map.IsTileExist(x, y) &&
            !game.map.IsTileOnlyWall(x, y) &&
            !game.map.GetEnemyOnTyle(x, y)) {
            return true
        }
        return false
    }

    _unrender() {
        const enemyIndex = game.map.map[this.x][this.y].indexOf(this)
        game.map.map[this.x][this.y].splice(enemyIndex, 1)
        game.map.RerenderTile(this.x, this.y)
        game.map.UnrenderHealthBar(this.x, this.y)
    }

    _render() {
        game.map.map[this.x][this.y].push(this)
        game.map.RerenderTile(this.x, this.y)
        game.map.RenderHealthBar(this.x, this.y, this.maxHealth, this.health)
    }

    _moveTo(x, y) {
        this._unrender()
        this.x = x
        this.y = y
        this._render()
    }

    _randomMove() {
        let moveTo = Shuffle([[this.x, this.y - 1],
                              [this.x - 1, this.y],
                              [this.x, this.y + 1],
                              [this.x + 1, this.y]])

        let moveIndex = 0
        for (; moveIndex < 4; moveIndex++) {
            if (this._canPassTo(moveTo[moveIndex][0], moveTo[moveIndex][1])) {
                break
            }
        }
        if (moveIndex != 4) {
            this._moveTo(moveTo[moveIndex][0], moveTo[moveIndex][1])
        }
    }

    _atackPlayers(players) {
        for (let i = 0; i < players.length; i++) {
            players[i].GetDamage(this.damage)
        }
    }

    GetDamage(damage) {
        this.health -= damage
        console.log(`Enemy got ${damage} damage. Current health is ${this.health}`)
        this._dieIfNoHealth()
    }

    _isDead() {
        if (this.health <= 0) { return true } 
        return false
    }

    _dieIfNoHealth() {
        if (this._isDead()) {
            this._unrender()
            delete this
        }
    }

    _playersInRange(range) {
        let players = []
        for (let x = this.x - range; x <= this.x + range; x++) {
            for (let y = this.y - range; y <= this.y + range; y++) {
                const player = game.map.GetPlayerOnTyle(x, y)
                if (player) {
                    players.push(player)
                }
            }
        }
        return players
    }

    _action() {
        if (!this._isDead()) {
            let players = this._playersInRange(1)    
            if (players.length != 0) {
                this._atackPlayers(players)
                this.DelayTillAction(this.DelayAfterAtack)
            }
            else { // todo: реализовать преследование игрока по кратчайшему пути, если тот находится в радиусе зрения
                // players = this._playersInRange(4) 
                // if (players.length != 0) {
                //     console.log("Враг видит героя")
                //     this.DelayTillAction(this.DelayAfterMoveToPlayer)
                // }
                // else {
                    this._randomMove()
                    this.DelayTillAction(this.DelayAfterRandomMove)
                // }
            }
        }
    }

    DelayTillAction(ms) {
        return new Promise(r => setTimeout(() => r(), ms)).then(() => {
            this._action()
        })
    }

    init() {
        this._health = this.maxHealth
        this._render()
        this.DelayTillAction(1000)
    }
}

class Enemy_E extends Enemy {
    constructor(options) {
        super(options)
        this.maxHealth = 100
        this.damage = 30
        this.tile = "tileE"
    }
}

class Player extends Tile {
    constructor(options) {
        super(options)
        this.maxHealth = 100
        this.damage = 25
        this.tile = "tileP"
        this._keyDown = {
            "KeyW": false,
            "KeyA": false,
            "KeyS": false,
            "KeyD": false,
            "Space": false,
        }
    }

    set health(health) {
        this._health = health
        game.map.RerenderHealthBar(this.x, this.y, this.maxHealth, this._health)
    }

    get health() {
        return this._health
    }

    IncreaceDamage(damage) { this.damage += damage }

    IncreaceHealth(health) {
        this.health += health
        if (this.health > this.maxHealth) { this.health = this.maxHealth }
    }

    GetDamage(damage) {
        this.health -= damage
        console.log(`Player got ${damage} damage. Current health is ${this.health}`)
        this._dieIfNoHealth()
    }

    _atackAround() {
        let enemies = this._getEnemiesAround()
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].GetDamage(this.damage)
        }
    }

    _getEnemiesAround() {
        let enemies = []
        for (let x = this.x - 1; x <= this.x + 1; x++) {
            for (let y = this.y - 1; y <= this.y + 1; y++) {
                const enemy = game.map.GetEnemyOnTyle(x, y)
                if (enemy) {
                    enemies.push(enemy)
                }
            }
        }
        return enemies
    }

    _dieIfNoHealth() {
        if (this.health <= 0) {
            this._unrender()
            this._downKeypressEvents()
            delete this
        }
    }

    _render() {
        game.map.map[this.x][this.y].push(this)
        game.map.RerenderTile(this.x, this.y)
        game.map.RenderHealthBar(this.x, this.y, this.maxHealth, this.health)
    }

    _unrender() {
        const playerIndex = game.map.map[this.x][this.y].indexOf(this)
        game.map.map[this.x][this.y].splice(playerIndex, 1)
        game.map.RerenderTile(this.x, this.y)
        game.map.UnrenderHealthBar(this.x, this.y)
    }

    _canPassTo(x, y) {
        if (game.map.IsTileExist(x, y) &&
            !game.map.IsTileOnlyWall(x, y) &&
            !game.map.GetEnemyOnTyle(x, y)) {
            return true
        }
        return false
    }

    _moveByVector(xVector, yVector) {
        const x = this.x + xVector
        const y = this.y + yVector
        if (this._canPassTo(x, y)) {
            this._unrender()
            this.x = x
            this.y = y
            this._render()
            console.log(`player moved to x = ${x}, y = ${y}`)
        }
        this._useItemOnTile()
    }

    _useItemOnTile() {
        let i = 0
        while (i < game.map.map[this.x][this.y].length) {   
            if (game.map.map[this.x][this.y][i] instanceof Item) {
                game.map.map[this.x][this.y][i].Use(this)
                game.map.RemoveFromTile(this.x, this.y, i)
            }
            i++
        }
    }

    _keydownEvents = (event) => (this._keydownEvent(event))
    _keyupEvents = (event) => (this._keyupEvent(event))

    _keydownEvent(event) {
        if (this._keyDown[event.code] == false) {
            this._keyDown[event.code] = true
            switch(event.code) {
            case "KeyW": this._moveByVector(0, -1); break
            case "KeyA": this._moveByVector(-1, 0); break
            case "KeyS": this._moveByVector(0, 1); break
            case "KeyD": this._moveByVector(1, 0); break
            case "Space": this._atackAround(); break
            }
        }
    }

    _keyupEvent(event) {
        this._keyDown[event.code] = false
    }

    _upKeypressEvents() {
        document.addEventListener("keydown", this._keydownEvents)
        document.addEventListener("keyup", this._keyupEvents)
    }

    _downKeypressEvents() {
        document.removeEventListener("keydown", this._keydownEvents)
        document.removeEventListener("keyup", this._keyupEvents)
    }

    init() {
        this._health = this.maxHealth
        this._render()
        this._upKeypressEvents()
    }
}

class Map { // todo: впихнуть синглтон
    constructor(options) {
        this.config = config.field
        this.field = document.getElementsByClassName("field-box")[0]
    }

    GenateMap() {
        this.map = Array.from({length: this.config.width}, () => Array.from({length: this.config.height}, () => [new Wall()])) // todo: Сделать эту строку красивее

        this._generateTunnels()

        this._generateRandomRooms()

        this._generateItems()
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

    _generateTunnels() {
        for (let i = 0; i < GetRandomInt(
            this.config.tunnels.horizontal.minAmount, 
            this.config.tunnels.horizontal.maxAmount
        ); i++) {
            this._generateHorizontalTunnel()
        }

        for (let i = 0; i < GetRandomInt(
            this.config.tunnels.vertical.minAmount, 
            this.config.tunnels.vertical.maxAmount
        ); i++) {
            this._generateVerticalTunnel()
        }
    }

    _generateItems() {
        for (const [itemName, itemData] of Object.entries(this.config.items)) {
            for (let i = 0; i < itemData.amount; i++) {
                const xy = this.GetRandomFreeCoord()
                this._setItem(itemName, xy[0], xy[1])
            }
        }
    }

    _setItem(itemName, x, y) {
        const item = GetNewItem(itemName)
        this.map[x][y].push(item)
        console.log(`Item ${itemName} placed at x = ${x}, y = ${y}`)
    }

    GenerateEnemies() {
        let enemies = []
        for (const [enemyName, enemyData] of Object.entries(this.config.enemies)) {
            for (let i = 0; i < enemyData.amount; i++) {
                const xy = this.GetRandomFreeCoord()
                enemies.push(this.SetEnemy(enemyName, xy[0], xy[1]))
            }
        }
        return enemies
    }

    SetEnemy(enemyName, x, y) {
        const options = {
            "x": x,
            "y": y,
        }

        const enemy = GetNewEnemy(enemyName, options)
        enemy.init()
        console.log(`Enemy ${enemyName} placed at x = ${x}, y = ${y}`)
        return enemy
    }

    _generateHorizontalTunnel() {
        const x = GetRandomInt(0, this.config.width - 1)
        for (let y = 0; y < this.config.height; y++) {
            this._clearTileBeforeRender(x, y)
        }
        console.log("built horizontal tunnel with x =", x)
    }

    _generateVerticalTunnel() {
        const y = GetRandomInt(0, this.config.height - 1)
        for (let x = 0; x < this.config.width; x++) {
            this._clearTileBeforeRender(x, y)
        }
        console.log("built vertical tunnel with y =", y)
    }

    _generateRandomRooms() {
        for (let i = 0; i < GetRandomInt(
            this.config.rooms.minAmount,
            this.config.rooms.maxAmount
        ); i++) {
            this._generateRandomRoom()
        }
    }
    
    _generateRandomRoom() {
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
            if (this. _isRoomConnected(xOffset, yOffset, width, height)) { break }
        }
        this._setRoom(xOffset, yOffset, width, height)
    }

    _isRoomConnected(xOffset, yOffset, width, height) {
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

    _setRoom(xOffset, yOffset, width, height) {
        for (let x = xOffset; x < xOffset + width; x++) {
            for (let y = yOffset; y < yOffset + height; y++) { this._clearTileBeforeRender(x, y) }
        }
        console.log(`built room with x = ${xOffset}, y = ${yOffset}, width = ${width}, height = ${height}`)

    }

    _clearTileBeforeRender(x, y) {
        this.map[x][y] = []
    }

    RemoveFromTile(x, y, i) {
        delete this.map[x][y][i] // todo: узнать, как работает сборщик мусора в js
        this.map[x][y].splice(i, 1)
        this.RerenderTile(x, y)
    }

    UnrenderHealthBar(x, y) {
        let tile = this.field.children[x].children[y]
        tile.children[0].remove()
    }

    RerenderHealthBar(x, y, maxHealth, health) {
        this.field.children[x].children[y].children[0].setAttribute("style",`width:${100 * (health / maxHealth)}%`)
    }

    RenderHealthBar(x, y, maxHealth, health) {
        let tile = this.field.children[x].children[y]
        let healthBar = document.createElement("div")
        healthBar.className = "health"
        healthBar.style.width = (100 * (health / maxHealth) + "%")
        tile.appendChild(healthBar)
    }

    RerenderTile(x, y) {
        let tile = this.field.children[x].children[y]
        tile.className = this._getClassName(x, y)
    }

    _getClassName(x, y) {
        let className = "tile"
        for (let i = 0; i < this.map[x][y].length; i++) {
            className += " " + this.map[x][y][i].tile
        }
        return className
    }
    
    _renderMap() {
        for (let x = 0; x < this.config.width; x++) {
            let newColumn = document.createElement("div")
            newColumn.className = "field"
            this.field.appendChild(newColumn)

            for (let y = 0; y < this.config.height; y++) {
                let newTile = document.createElement("div") 
                newTile.className = this._getClassName(x, y)
                this.field.lastChild.appendChild(newTile)
            }
        }
    }

    IsTileExist(x, y) { 
        if (x >= 0 && x < this.config.width && 
            y >= 0 && y < this.config.height) {
            return true
        }
        return false
    }

    IsTileOnlyWall(x, y) { if (this.map[x][y].length == 1 && this.map[x][y][0] instanceof Wall) { return true } return false }

    GetEnemyOnTyle(x, y) {
        if (!this.IsTileExist(x, y)) {
            return false
        }
        for (let i = 0; i < this.map[x][y].length; i++) {
            if (this.map[x][y][i] instanceof Enemy) {
                return this.map[x][y][i]
            }
        }
        return false
    }

    GetPlayerOnTyle(x, y) {
        if (!this.IsTileExist(x, y)) {
            return false
        }
        for (let i = 0; i < this.map[x][y].length; i++) {
            if (this.map[x][y][i] instanceof Player) {
                return this.map[x][y][i]
            }
        }
        return false
    }

    init() {
        this.GenateMap()
        this._renderMap()
    }
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function Shuffle(array) {
    let currentIndex = array.length, randomIndex
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
        this.enemies = this.map.GenerateEnemies()
        console.log(this.player)
    }
}