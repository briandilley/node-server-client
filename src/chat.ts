import { program, command } from 'bandersnatch'
import { AddressInfo, Server, Socket } from 'net'

// all of the current connections
let sockets: Socket[] = []

// handles a new connection
function handleNewConnection(socket: Socket) {
    socket.setEncoding('utf8')
    socket.on('close', () => {
        sockets = sockets.filter((s) => s != socket)
    })
    socket.on('data', (data: string) => console.log(data))
    sockets.push(socket)
}

// connects to a server
function connectToServer(host: string, port: number) {
    let socket = new Socket()
    socket.connect(port, host)
    socket.on('connect', () => handleNewConnection(socket))
    socket.on('error', () => console.log("Error in socket"))
}

// create server
let serverPort = +process.argv[2]
var server: Server
function startServer() {
    server = new Server()
    server.on('close', () => console.log("Server closing"))
    server.on('error', (e) => {
        console.log("Server error", e)
        startServer()
    })
    // server.on('listening', () => console.log("Server listening"))
    server.on('connection', (socket) => handleNewConnection(socket))
    server.listen(serverPort)
}

const chat = program()
    .add(
        command('help')
            .action((args) => {
                console.log(`help`, args)
            })
    )
    .add(
        command('myip')
            .action(() => console.log(`my ip: ${(server.address() as AddressInfo).address}`))
    )
    .add(
        command('myport')
            .action(() => console.log(`my port: ${serverPort}`))
    )
    .add(
        command('connect')
            .argument('destination', { prompt: true })
            .argument('portNumber', { prompt: true })
            .action((args) => connectToServer(args.destination, +args.portNumber))
    )
    .add(
        command('list')
            .action(() => {
                console.log("todo")
                // loop through sockets and display according to thingy
            })
    )
    .add(
        command('terminate')
            .argument('connectionId', { prompt: true, type: 'number' })
            .action(() => {
                console.log("todo")
                // find socket
                // call socket.end()
                // remove socket from sockets array
            })
    )
    .add(
        command('send')
            .argument('connectionId', { prompt: true, type: 'number' })
            .argument('message', { prompt: true, variadic: true })
            .action((args) => {
                if (args.connectionId == undefined || args.connectionId >= sockets.length) {
                    console.error("Invalid connection id")
                    return
                }
                sockets[args.connectionId].write(args.message.join(' '))
            })
    )
    .add(
        command('exit')
            .action(() => process.exit())
    )

startServer()
chat.repl()