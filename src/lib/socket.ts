import io from 'socket.io-client';
export const socket = io(process.env.NODE_ENV === 'production' ? '' : 'https://webapi.storx.io', {
  transports: ['websocket'],
  upgrade: false,
  path: '/api/sockets'
});