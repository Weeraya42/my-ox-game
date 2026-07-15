const socket = io(); // คำสั่งเชื่อมต่อไปยังเซิร์ฟเวอร์
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status-text');

let myRole = ''; // เก็บว่าเราเป็น X หรือ O

// 1. รับบทบาทจากเซิร์ฟเวอร์เมื่อเข้ามาในหน้าเว็บ
socket.on('role', (role) => {
    myRole = role;
    if(role === 'Spectator') {
        statusText.innerText = "ห้องเต็มแล้ว คุณเป็นผู้ชม";
    } else {
        statusText.innerText = `รอผู้เล่นอีกคน... (คุณคือ ${role})`;
    }
});

// 2. เซิร์ฟเวอร์บอกว่าครบ 2 คนแล้ว เริ่มเกมได้
socket.on('startGame', (message) => {
    statusText.innerText = message;
});

// 3. เมื่อเราคลิกที่ช่องในกระดาน
cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        // เช็คว่าช่องนั้นยังว่างอยู่ และเรามีสิทธิ์เล่น (ไม่ใช่คนดู)
        if (cell.innerText === '' && (myRole === 'X' || myRole === 'O')) {
            // ส่งข้อมูลไปบอกเซิร์ฟเวอร์ว่าเราคลิกช่องไหน
            socket.emit('makeMove', { index: index, symbol: myRole });
        }
    });
});

// 4. เมื่อมีการส่งอัปเดตกระดานจากเซิร์ฟเวอร์ (อัปเดตหน้าจอของทุกคนให้ตรงกัน)
socket.on('updateBoard', (data) => {
    // เอา X หรือ O ไปวาดลงในช่องที่ถูกคลิก
    cells[data.index].innerText = data.symbol;
    
    // สลับข้อความบอกว่าตาใคร
    if (data.symbol === 'X') {
        statusText.innerText = "ตาของ O";
    } else {
        statusText.innerText = "ตาของ X";
    }
});

// 5. หากมีผู้เล่นคนใดคนหนึ่งปิดหน้าเว็บหนี
socket.on('playerLeft', (message) => {
    statusText.innerText = message;
});