const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    window.addEventListener('click', function (event) {
        const registerModal = document.getElementById('registerModal');
        if (event.target === registerModal) {
            closeRegisterModal();
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/Auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                username: data.username,
                role: data.role
            }));
            window.location.href = 'system.html';
        } else {
            const error = await response.text();
            showLoginError(error);
        }
    } catch (error) {
        showLoginError('Ошибка сети');
    }
}

function showLoginError(message) {
    document.getElementById('loginError').textContent = message;
}

function showRegisterForm() {
    const modalBody = document.getElementById('registerModalBody');

    modalBody.innerHTML = `
        <form id="registerForm" autocomplete="off">
            <div class="form-group">
                <label for="regUsername">Имя пользователя:</label>
                <input type="text" id="regUsername" autocomplete="off" required>
            </div>
            <div class="form-group">
                <label for="regPassword">Пароль для входа:</label>
                <input type="password" id="regPassword" autocomplete="off" required>
                <small>Этот пароль будет использоваться для входа в систему</small>
            </div>
            <div class="form-group">
                <label for="regRolePassword">Пароль роли:</label>
                <input type="password" id="regRolePassword" autocomplete="off" required>
                <small>Этот пароль определит вашу роль в системе</small>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeRegisterModal()">Отмена</button>
                <button type="submit" class="btn-primary">Зарегистрироваться</button>
            </div>
        </form>
        <div id="registerError" class="error-message"></div>
    `;

    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await handleRegister();
    });

    document.getElementById('registerModal').style.display = 'block';
    document.body.classList.add('modal-open');
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const rolePassword = document.getElementById('regRolePassword').value;

    try {
        const response = await fetch(`${API_BASE}/Auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                rolePassword
            })
        });

        if (response.ok) {
            const result = await response.json();
            closeRegisterModal();
            showLoginError('');
            alert(`Пользователь ${result.username} успешно зарегистрирован как ${result.role === 'manager' ? 'Менеджер' : 'Продавец'}! Теперь вы можете войти в систему.`);
        } else {
            const error = await response.text();
            document.getElementById('registerError').textContent = error;
        }
    } catch (error) {
        document.getElementById('registerError').textContent = 'Ошибка при регистрации';
    }
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerModalBody').innerHTML = '';
    document.body.classList.remove('modal-open');
}

window.showRegisterForm = showRegisterForm;
window.closeRegisterModal = closeRegisterModal;