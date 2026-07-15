const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// อนุญาตให้แสดงผลไฟล์ HTML และ CSS ในโฟลเดอร์นี้
app.use(express.static(__dirname));

let players = [];

// เมื่อมีผู้เล่นเปิดหน้าเว็บเข้ามา
io.on('connection', (socket) => {
    console.log('มีผู้เล่นเชื่อมต่อ:', socket.id);

    // ระบบจับคู่ผู้เล่น (X และ O)
    if (players.length === 0) {
        players.push({ id: socket.id, symbol: 'X' });
        socket.emit('role', 'X'); // บอกผู้เล่นคนแรกว่าเขาคือ X
    } else if (players.length === 1) {
        players.push({ id: socket.id, symbol: 'O' });
        socket.emit('role', 'O'); // บอกผู้เล่นคนที่สองว่าเขาคือ O
        
        // เมื่อครบ 2 คน สั่งให้เกมเริ่ม
        io.emit('startGame', 'เกมเริ่มแล้ว! ตาของ X');
    } else {
        socket.emit('role', 'Spectator'); // คนที่เข้ามาทีหลังให้เป็นแค่คนดู
    }

    // เมื่อผู้เล่นกดวาง X หรือ O ให้ส่งข้อมูลไปอัปเดตกระดานทุกคน
    socket.on('makeMove', (data) => {
        io.emit('updateBoard', data);
    });

    // เมื่อผู้เล่นปิดหน้าเว็บหรือเน็ตหลุด
    socket.on('disconnect', () => {
        console.log('ผู้เล่นออก:', socket.id);
        players = players.filter(player => player.id !== socket.id);
        io.emit('playerLeft', 'ผู้เล่นอีกคนออกไปแล้ว กรุณารีเฟรชหน้าเว็บ');
    });
});

// เปลี่ยนโค้ดตรงฟังช์ชัน listen ด้านล่างสุดเป็นแบบนี้ครับ
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์รันบนพอร์ต ${PORT}`);
});