const socket = io();
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status-text');
const restartBtn = document.getElementById('restart-btn');

// องค์ประกอบของกล่องข้อความผู้ชนะ
const modal = document.getElementById('win-modal');
const winMessage = document.getElementById('win-message');
const closeModalBtn = document.getElementById('close-modal-btn');

// ระบบเสียงเอฟเฟกต์ (ใช้ลิงก์เสียงฟรี)
const clickSound = new Audio('https://actions.google.com/sounds/v1/ui/button_click.ogg');
const winSound = new Audio('https://actions.google.com/sounds/v1/cartoon/trumpet_success.ogg');

let myRole = ''; 
let gameActive = false; // ตัวแปรคุมว่าตอนนี้กดกระดานได้ไหม

// รับบทบาทจากเซิร์ฟเวอร์
socket.on('role', (role) => {
    myRole = role;
    if(role === 'Spectator') {
        statusText.innerText = "ห้องเต็มแล้ว คุณเป็นผู้ชม";
    } else {
        statusText.innerText = `รอผู้เล่นอีกคน... (คุณคือ ${role})`;
    }
    
    // แสดงปุ่มเริ่มใหม่เฉพาะคนที่เป็น 'X' (Host)
    if (myRole === 'X') {
        restartBtn.style.display = 'inline-block';
    }
});

socket.on('startGame', (message) => {
    statusText.innerText = message;
    gameActive = true;
});

// กดช่องกระดาน
cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        // เช็คว่าเกมรันอยู่ ช่องว่าง และเป็นคนเล่น
        if (gameActive && cell.innerText === '' && (myRole === 'X' || myRole === 'O')) {
            clickSound.currentTime = 0; // รีเซ็ตเสียงให้เล่นซ้อนกันได้
            clickSound.play();          // เล่นเสียงคลิก
            socket.emit('makeMove', { index: index, symbol: myRole });
        }
    });
});

socket.on('updateBoard', (data) => {
    cells[data.index].innerText = data.symbol;
    statusText.innerText = `ตาของ ${data.symbol === 'X' ? 'O' : 'X'}`;
});

// ---------- ส่วนจัดการผลแพ้ชนะ ----------
socket.on('gameOver', (winner) => {
    gameActive = false; // ล็อกกระดานไม่ให้กดต่อ
    winSound.play();    // เล่นเสียงชนะ
    
    if (winner === 'Draw') {
        winMessage.innerText = "เสมอ! 🤝";
        winMessage.style.color = "#333";
    } else {
        winMessage.innerText = `ผู้เล่น ${winner} ชนะ! 🎉`;
        winMessage.style.color = winner === 'X' ? "#0084ff" : "#ff4757"; // ใส่สีให้แยก X กับ O
    }
    
    // โชว์กล่องข้อความ
    modal.style.display = 'flex'; 
});

// การทำงานของปุ่มเริ่มใหม่ (กดได้แค่ Host)
restartBtn.addEventListener('click', () => {
    socket.emit('restartGame');
    modal.style.display = 'none'; // ปิดกล่องข้อความ
});

// ปุ่มปิดกล่องข้อความเฉยๆ
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// เมื่อเซิร์ฟเวอร์สั่งให้ทุกคนเริ่มกระดานใหม่
socket.on('resetBoard', () => {
    cells.forEach(cell => cell.innerText = ''); // ล้างช่อง
    modal.style.display = 'none';               // ปิดกล่องข้อความเผื่อใครเปิดค้างไว้
    gameActive = true;                          // ปลดล็อกกระดาน
});

socket.on('playerLeft', (message) => {
    statusText.innerText = message;
    gameActive = false;
});