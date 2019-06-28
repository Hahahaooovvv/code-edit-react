import io from 'socket.io-client';


export default class SocketHelper {
    public static Socket: SocketIOClient.Socket;

    /**初始化socket */
    public static IniSocket() {
        SocketHelper.Socket = io('http://localhost:3100');
        SocketHelper.Socket.on('connect', (socket: SocketIOClient.Socket) => {
            console.log('链接成功')
        })
    }

}