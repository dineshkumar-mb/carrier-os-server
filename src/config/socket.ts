import { Server } from 'socket.io';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

export let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO Engine] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO Engine] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitLiveActivity = async (message: string) => {
  if (io) {
    io.emit('live-activity', message);
  }
};
