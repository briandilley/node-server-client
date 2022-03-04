
import { Server, Socket } from 'net';
import yargs from "yargs";

interface ClientInfo {
    socket: Socket
    username: string
}

let clients: ClientInfo[] = []

/**
 * Handles a line from a client
 */
function handleLine(from: Socket, line: string) {

    let fromClient = clients.find((c) => c.socket == from)
    if (fromClient == undefined) {
        throw Error("Unknown client")
    }

    let sep = line.indexOf(':')
    let cmd = ((sep != -1) ? line.substring(0, sep) : line).replace('\r', '')
    let arg = ((sep != -1) ? line.substring(sep) : "").replace('\r', '')

    switch (cmd) {

        // handle msg command that sends a chat message to all connectd clients
        // example = msg:The message goes here
        case 'msg': {
            console.log(`<${fromClient.username}>: ${arg}`)
            for (var i=0; i<clients.length; i++) {
                let client = clients[i]
                if (client.socket != from) {
                    client.socket.write(`${fromClient.username}: ${arg}\n`)
                }
            }
            break
        }

        // handle username command that sets the username for the connected client
        // example = username:The New Username Here
        case 'username': {
            console.log(`username sep change from ${fromClient.username} to ${arg}`)
            fromClient.username = arg
            break
        }

        // handle clients command that tells who is connected
        // example = clients:
        case 'clients': {
            fromClient.socket.write('Connected clients:\n')
            for (var i=0; i<clients.length; i++) {
                let client = clients[i]
                fromClient.socket.write(`\t${client.username} @ ${client.socket.remoteAddress || "Unknown"}\n`)
            }
            break
        }

        default: {
            console.log(`Unknown line: ${line}`)
        }
    }


}

/**
 * Handles a new client connection
 */
function handleNewConnection(socket: Socket) {

    // when client closes connection, remove it from the client list
    socket.on('close', () => {
        clients = clients.filter((c) => c.socket != c.socket)
        console.log(`Dropped connection from ${socket.remoteAddress}, ${clients.length} clients connected`)
    })

    // when client sends data, add it to the backlog buffer and check
    // to see if a full line has been sent yet
    var backlog: string = ""
    socket.on('data', (data) => {
        backlog += data
        var n = backlog.indexOf('\n')
        while (n >= 0) {
            handleLine(socket, backlog.substring(0, n))
            backlog = backlog.substring(n + 1)
            n = backlog.indexOf('\n')
        }
    })

    // add the client to the client list
    clients.push({
        socket: socket,
        username: socket.remoteAddress || "Unknown"
    })
    console.log(`New connection from ${socket.remoteAddress}, ${clients.length} clients connected`)
}

/**
 * Starts the server
 */
function main() {
    let args = yargs
        .option('host', {
            alias: 'h',
            demand: true,
            default: '0.0.0.0'
        })
        .option('port', {
            alias: 'p',
            demand: true,
            default: 9876
        })
        .argv
    
    let server = new Server()
    server.on('close', () => console.log("Server closing"))
    server.on('error', () => console.log("Server error"))
    server.on('listening', () => console.log("Server listening"))
    server.on('connection', (socket) => handleNewConnection(socket))
    server.listen(args.port, args.host)
}

main();