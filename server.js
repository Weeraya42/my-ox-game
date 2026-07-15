const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let players = [];
let board = ['', '', '', '', '', '', '', '', '']; // ให้เซิร์ฟเวอร์จำกระดานไว้

// ฟังก์ชันตรวจสอบการชนะ
function checkWin() {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8], // แนวนอน
        [0,3,6], [1,4,7], [2,5,8], // แนวตั้ง
        [0,4,8], [2,4,6]           // แนวทแยง
    ];
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        // ถ้าช่องมีค่าและเหมือนกันทั้ง 3 ช่อง
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // ส่งกลับว่า 'X' หรือ 'O' ชนะ
        }
    }
    // ถ้าไม่มีช่องว่างเหลือเลยแปลว่า เสมอ
    if (!board.includes('')) return 'Draw'; 
    return null; // ยังไม่จบเกม
}

io.on('connection', (socket) => {
    // จัดการผู้เล่นเข้าห้อง
    if (players.length === 0) {
        players.push({ id: socket.id, symbol: 'X' });
        socket.emit('role', 'X'); // X คือ Host
    } else if (players.length === 1) {
        players.push({ id: socket.id, symbol: 'O' });
        socket.emit('role', 'O');
        io.emit('startGame', 'เกมเริ่มแล้ว! ตาของ X');
    } else {
        socket.emit('role', 'Spectator');
    }

    socket.on('makeMove', (data) => {
        // อัปเดตกระดานบนเซิร์ฟเวอร์
        if (board[data.index] === '') {
            board[data.index] = data.symbol;
            io.emit('updateBoard', data);

            // เช็คผลแพ้ชนะทุกครั้งที่มีการเดิน
            const winner = checkWin();
            if (winner) {
                io.emit('gameOver', winner); // แจ้งทุกคนว่ามีคนชนะแล้ว
            }
        }
    });

    socket.on('restartGame', () => {
        // ตรวจสอบว่าคนที่สั่งเริ่มใหม่คือ X (Host) เท่านั้น
        const player = players.find(p => p.id === socket.id);
        if (player && player.symbol === 'X') {
            board = ['', '', '', '', '', '', '', '', '']; // ล้างกระดานบนเซิร์ฟเวอร์
            io.emit('resetBoard'); // สั่งให้หน้าจอทุกคนล้างกระดาน
            io.emit('startGame', 'เริ่มเกมใหม่แล้ว! ตาของ X');
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        board = ['', '', '', '', '', '', '', '', '']; // เคลียร์กระดานเมื่อมีคนออก
        io.emit('playerLeft', 'ผู้เล่นอีกคนออกไปแล้ว กรุณารีเฟรชหน้าเว็บ');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์รันบนพอร์ต ${PORT}`);
});