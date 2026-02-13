const SUPABASE_URL = 'https://fboxorvsijnczzzqzvqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi0iJzdXBhYmFzZSIsInJl';



//const API_BASE_FULL = 'https://localhost:7280/api';
//const API_BASE = '/api';
let currentUser = null;
let currentToken = null;

document.addEventListener('DOMContentLoaded', function () {
    checkAuthStatus();
    setupEventListeners();
});

function setupEventListeners() {
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            currentToken = token;
            currentUser = JSON.parse(user);
            document.getElementById('userInfo').textContent = `${currentUser.username} (${currentUser.role === 'manager' ? 'Менеджер' : 'Продавец'})`;
            setupRoleBasedUI();
            showSection('cars');
        } catch (error) {
            logout();
        }
    } else {
        window.location.href = 'index.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function setupRoleBasedUI() {
    const isManager = currentUser.role === 'manager';
    const isSeller = currentUser.role === 'seller';

    const managerSections = ['cars', 'models', 'clients', 'employees', 'sales', 'suppliers', 'supplies', 'users'];
    const sellerSections = ['cars', 'clients', 'sales'];

    const existingModelsLink = document.querySelector('#modelsLink');
    const existingUsersLink = document.querySelector('#usersLink');
    if (existingModelsLink) existingModelsLink.remove();
    if (existingUsersLink) existingUsersLink.remove();

    if (isManager) {
        const modelsLink = document.createElement('a');
        modelsLink.id = 'modelsLink';
        modelsLink.href = '#';
        modelsLink.className = 'nav-link';
        modelsLink.textContent = 'Модели';
        modelsLink.onclick = () => showSection('models');

        const navLinks = document.querySelector('.nav-links');
        const carsLink = document.querySelector('a[onclick*="cars"]');
        navLinks.insertBefore(modelsLink, carsLink.nextSibling);
    }

    if (isManager) {
        const usersLink = document.createElement('a');
        usersLink.id = 'usersLink';
        usersLink.href = '#';
        usersLink.className = 'nav-link';
        usersLink.textContent = 'Пользователи';
        usersLink.onclick = () => showSection('users');

        const navLinks = document.querySelector('.nav-links');
        const suppliesLink = document.querySelector('a[onclick*="supplies"]');
        navLinks.insertBefore(usersLink, suppliesLink.nextSibling);
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        const section = link.onclick.toString().match(/showSection\('(\w+)'\)/)?.[1];
        if (section && isSeller && !sellerSections.includes(section)) {
            link.style.display = 'none';
        } else {
            link.style.display = 'block';
        }
    });

    const userSection = document.querySelector('.user-section');
    const navLinks = document.querySelector('.nav-links');
    navLinks.appendChild(userSection);
}

async function showSection(sectionName) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<p>Загрузка...</p>';

    try {
        let html = '';
        let data = [];

        switch (sectionName) {
            case 'cars':
                data = await fetchWithAuth(`${API_BASE_FULL}/Cars`);
                html = generateCarsHTML(data);
                break;
            case 'clients':
                data = await fetchWithAuth(`${API_BASE_FULL}/Clients`);
                html = generateClientsHTML(data);
                break;
            case 'employees':
                data = await fetchWithAuth(`${API_BASE_FULL}/Employees`);
                html = generateEmployeesHTML(data);
                break;
            case 'sales':
                data = await fetchWithAuth(`${API_BASE_FULL}/Sales`);
                html = generateSalesHTML(data);
                break;
            case 'suppliers':
                data = await fetchWithAuth(`${API_BASE_FULL}/Suppliers`);
                html = generateSuppliersHTML(data);
                break;
            case 'supplies':
                data = await fetchWithAuth(`${API_BASE_FULL}/Supplies`);
                html = generateSuppliesHTML(data);
                break;
            case 'models':
                if (currentUser.role !== 'manager') {
                    contentArea.innerHTML = '<p>Доступ запрещен</p>';
                    return;
                } else {
                    data = await fetchWithAuth(`${API_BASE_FULL}/Model`);
                    html = generateModelsHTML(data);
                }
                break;
            case 'users':
                if (currentUser.role !== 'manager') {
                    contentArea.innerHTML = '<p>Доступ запрещен</p>';
                    return;
                } else {
                    data = await fetchWithAuth(`${API_BASE_FULL}/Users`);
                    html = generateUsersHTML(data);
                }
                break;
            default:
                contentArea.innerHTML = '<p>Раздел не найден</p>';
                return;
        }

        contentArea.innerHTML = html;
    } catch (error) {
        console.error('Error loading section:', error);
        contentArea.innerHTML = '<p>Ошибка загрузки данных</p>';
    }
}

async function fetchWithAuth(url, options = {}) {
    const config = {
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        },
        ...options
    };

    console.log('Making request to:', url);

    const response = await fetch(url, config);

    if (!response.ok) {
        console.log('Response status:', response.status);
        if (response.status === 401) {
            logout();
            throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }

    return await response.json();
}

function generateCarsHTML(cars) {
    const canEdit = ['manager', 'seller'].includes(currentUser.role);
    const canDelete = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Автомобили</h2>
                ${canEdit ? '<button class="btn-add" onclick="showCarForm()">Добавить автомобиль</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ID модели</th>
                        <th>Год</th>
                        <th>Комплектация</th>
                        <th>Цвет</th>
                        <th>Пробег</th>
                        <th>Цена</th>
                        <th>Статус</th>
                        <th>Состояние</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${cars.map(car => `
                        <tr>
                            <td>${car.car_id}</td>
                            <td>${car.model_id}</td>
                            <td>${car.manufacture_year}</td>
                            <td>${car.trim_level}</td>
                            <td>${car.color}</td>
                            <td>${car.mileage} км</td>
                            <td>${car.price.toLocaleString()} ₽</td>
                            <td><span class="status-badge status-${car.status}">${getStatusText(car.status)}</span></td>
                            <td>${car.condition}</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editCar(${car.car_id})">Изменить</button>
                                    ${canDelete ? `<button class="btn-delete" onclick="deleteCar(${car.car_id})">Удалить</button>` : ''}
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getStatusText(status) {
    const statusMap = {
        'available': 'Доступен',
        'sold': 'Продан',
        'reserved': 'Зарезервирован',
        'maintenance': 'На обслуживании'
    };
    return statusMap[status] || status;
}

function generateClientsHTML(clients) {
    const canEdit = ['manager', 'seller'].includes(currentUser.role);
    const canDelete = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Клиенты</h2>
                ${canEdit ? '<button class="btn-add" onclick="showClientForm()">Добавить клиента</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Контакты</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(client => `
                        <tr>
                            <td>${client.client_id}</td>
                            <td>${client.full_name}</td>
                            <td>${client.contact}</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editClient(${client.client_id})">Изменить</button>
                                    ${canDelete ? `<button class="btn-delete" onclick="deleteClient(${client.client_id})">Удалить</button>` : ''}
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateEmployeesHTML(employees) {
    const canEdit = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Сотрудники</h2>
                ${canEdit ? '<button class="btn-add" onclick="showEmployeeForm()">Добавить сотрудника</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Контакт</th>         
                        <th>Отдел</th>
                        <th>Должность</th>
                        <th>Зарплата</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${employees.map(employee => `
                        <tr>
                            <td>${employee.employee_id}</td>
                            <td>${employee.full_name}</td>
                            <td>${employee.contact}</td>
                            <td>${employee.department}</td>
                            <td>${employee.position}</td>
                            <td>${employee.salary.toLocaleString()} ₽</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editEmployee(${employee.employee_id})">Изменить</button>
                                    <button class="btn-delete" onclick="deleteEmployee(${employee.employee_id})">Удалить</button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateSalesHTML(sales) {
    const canEdit = ['manager', 'seller'].includes(currentUser.role);
    const canDelete = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Продажи</h2>
                ${canEdit ? '<button class="btn-add" onclick="showSaleForm()">Добавить продажу</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ID клиента</th>
                        <th>ID автомобиля</th>
                        <th>ID сотрудника</th>
                        <th>Цена продажи</th>
                        <th>Цена закупки</th>
                        <th>Дата продажи</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${sales.map(sale => `
                        <tr>
                            <td>${sale.sale_id}</td>
                            <td>${sale.client_id}</td>
                            <td>${sale.car_id}</td>
                            <td>${sale.employee_id}</td>
                            <td>${sale.sale_price.toLocaleString()} ₽</td>
                            <td>${sale.purchase_price?.toLocaleString() || '-'} ₽</td>
                            <td>${new Date(sale.sale_date).toLocaleDateString('ru-RU')}</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editSale(${sale.sale_id})">Изменить</button>
                                    ${canDelete ? `<button class="btn-delete" onclick="deleteSale(${sale.sale_id})">Удалить</button>` : ''}
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateSuppliersHTML(suppliers) {
    const canEdit = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Поставщики</h2>
                ${canEdit ? '<button class="btn-add" onclick="showSupplierForm()">Добавить поставщика</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Контакты</th>
                        <th>Доп. информация</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${suppliers.map(supplier => `
                        <tr>
                            <td>${supplier.supplier_id}</td>
                            <td>${supplier.name}</td>
                            <td>${supplier.contact}</td>
                            <td>${supplier.additional_info || '-'}</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editSupplier(${supplier.supplier_id})">Изменить</button>
                                    <button class="btn-delete" onclick="deleteSupplier(${supplier.supplier_id})">Удалить</button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateSuppliesHTML(supplies) {
    const canEdit = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Поставки</h2>
                ${canEdit ? '<button class="btn-add" onclick="showSupplyForm()">Добавить поставку</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ID поставщика</th>
                        <th>ID автомобиля</th>
                        <th>Цена закупки</th>
                        <th>Дата поставки</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${supplies.map(supply => `
                        <tr>
                            <td>${supply.supply_id}</td>
                            <td>${supply.supplier_id}</td>
                            <td>${supply.car_id}</td>
                            <td>${supply.purchase_price.toLocaleString()} ₽</td>
                            <td>${new Date(supply.supply_date).toLocaleDateString('ru-RU')}</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editSupply(${supply.supply_id})">Изменить</button>
                                    <button class="btn-delete" onclick="deleteSupply(${supply.supply_id})">Удалить</button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateModelsHTML(models) {
    const canEdit = currentUser.role === 'manager';

    return `
        <div class="table-container">
            <div class="table-header">
                <h2>Модели автомобилей</h2>
                ${canEdit ? '<button class="btn-add" onclick="showModelForm()">Добавить модель</button>' : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Бренд</th>
                        <th>Модель</th>
                        <th>Тип ТС</th>
                        <th>Тип кузова</th>
                        <th>Страна</th>
                        <th>Тип топлива</th>
                        <th>Коробка передач</th>
                        <th>Расположение руля</th>
                        <th>Привод</th>
                        ${canEdit ? '<th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${models.map(model => `
                        <tr>
                            <td>${model.model_id}</td>
                            <td><strong>${model.brand}</strong></td>
                            <td>${model.model || '-'}</td>
                            <td>${model.vehicle_type}</td>
                            <td>${model.body_type}</td>
                            <td>${model.country || '-'}</td>
                            <td>${model.fuel_type}</td>
                            <td>${model.transmission}</td>
                            <td>${model.steering === 'left' ? 'Левый' : model.steering === 'right' ? 'Правый' : model.steering || '-'}</td>
                            <td>${model.drive_type}</td>
                            ${canEdit ? `
                                <td>
                                    <button class="btn-edit" onclick="editModel(${model.model_id})">Изменить</button>
                                    <button class="btn-delete" onclick="deleteModel(${model.model_id})">Удалить</button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateUsersHTML(users) {
    return `
        <div class="user-info-panel">
            <h3>Система управления пользователями</h3>
            <div>Текущий пользователь: <strong>${currentUser.username}</strong> (<span class="user-role">${currentUser.role === 'manager' ? 'Менеджер' : 'Продавец'}</span>)</div>
        </div>
        <div class="table-container">
            <div class="table-header">
                <h2>Пользователи системы</h2>
                <button class="btn-add" onclick="showUserForm()">Добавить пользователя</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя пользователя</th>
                        <th>Роль</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.user_id}</td>
                            <td>${user.username}</td>
                            <td>
                                <span class="role-badge ${user.role === 'manager' ? 'role-manager' : 'role-seller'}">
                                    ${user.role === 'manager' ? 'Менеджер' : 'Продавец'}
                                </span>
                            </td>
                            <td>
                                <button class="btn-edit" onclick="editUser(${user.user_id})">Изменить</button>
                                ${user.username !== currentUser.username ? `<button class="btn-delete" onclick="deleteUser(${user.user_id})">Удалить</button>` : `<span class="text-muted">Текущий пользователь</span>`}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showModal() {
    document.getElementById('modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalBody').innerHTML = '';
    document.body.style.overflow = '';
}

// Формы для каждой сущности

// Автомобили
function showCarForm(car = null) {
    const isEdit = car !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</h3>
        <form id="carForm">
            <div class="form-group">
                <label for="model_id">ID модели:</label>
                <input type="number" id="model_id" value="${car?.model_id || ''}" required>
            </div>
            <div class="form-group">
                <label for="manufacture_year">Год выпуска:</label>
                <input type="number" id="manufacture_year" value="${car?.manufacture_year || ''}" required>
            </div>
            <div class="form-group">
                <label for="trim_level">Комплектация:</label>
                <input type="text" id="trim_level" value="${car?.trim_level || ''}" required>
            </div>
            <div class="form-group">
                <label for="color">Цвет:</label>
                <input type="text" id="color" value="${car?.color || ''}" required>
            </div>
            <div class="form-group">
                <label for="mileage">Пробег (км):</label>
                <input type="number" id="mileage" value="${car?.mileage || ''}" required>
            </div>
            <div class="form-group">
                <label for="price">Цена (₽):</label>
                <input type="number" id="price" value="${car?.price || ''}" required>
            </div>
            <div class="form-group">
                <label for="status">Статус:</label>
                <select id="status" required>
                    <option value="available" ${car?.status === 'available' ? 'selected' : ''}>Доступен</option>
                    <option value="sold" ${car?.status === 'sold' ? 'selected' : ''}>Продан</option>
                    <option value="reserved" ${car?.status === 'reserved' ? 'selected' : ''}>Зарезервирован</option>
                    <option value="maintenance" ${car?.status === 'maintenance' ? 'selected' : ''}>На обслуживании</option>
                </select>
            </div>
            <div class="form-group">
                <label for="condition">Состояние:</label>
                <input type="text" id="condition" value="${car?.condition || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('carForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveCar(car?.car_id);
    });

    showModal();
}

async function saveCar(carId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    try {
        const formData = {
            model_id: parseInt(document.getElementById('model_id').value),
            manufacture_year: parseInt(document.getElementById('manufacture_year').value),
            trim_level: document.getElementById('trim_level').value,
            color: document.getElementById('color').value,
            mileage: parseInt(document.getElementById('mileage').value),
            price: parseFloat(document.getElementById('price').value),
            status: document.getElementById('status').value,
            condition: document.getElementById('condition').value
        };

        console.log('Отправляемые данные:', formData);

        const url = `${API_BASE_FULL}/Cars${carId ? `/${carId}` : ''}`;
        const method = carId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('cars');
        alert(`Автомобиль ${carId ? 'обновлен' : 'добавлен'} успешно!`);

    } catch (error) {
        console.error('Error saving car:', error);
        alert('Ошибка при сохранении автомобиля: ' + error.message);
    }
}

async function editCar(id) {
    try {
        const car = await fetchWithAuth(`${API_BASE_FULL}/Cars/${id}`);
        showCarForm(car);
    } catch (error) {
        alert('Ошибка при загрузке данных автомобиля');
    }
}

// Клиенты
function showClientForm(client = null) {
    const isEdit = client !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать клиента' : 'Добавить клиента'}</h3>
        <form id="clientForm">
            <div class="form-group">
                <label for="full_name">ФИО:</label>
                <input type="text" id="full_name" value="${client?.full_name || ''}" required>
            </div>
            <div class="form-group">
                <label for="contact">Контакт:</label>
                <input type="text" id="contact" value="${client?.contact || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('clientForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveClient(client?.client_id);
    });

    showModal();
}

async function saveClient(clientId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        full_name: document.getElementById('full_name').value,
        contact: document.getElementById('contact').value
    };

    if (clientId) {
        formData.client_id = clientId;
    }

    try {
        const url = `${API_BASE_FULL}/Clients${clientId ? `/${clientId}` : ''}`;
        const method = clientId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('clients');
        alert(`Клиент ${clientId ? 'обновлен' : 'добавлен'} успешно!`);

    } catch (error) {
        console.error('Error saving client:', error);
        alert('Ошибка при сохранении клиента: ' + error.message);
    }
}

async function editClient(id) {
    try {
        const client = await fetchWithAuth(`${API_BASE_FULL}/Clients/${id}`);
        showClientForm(client);
    } catch (error) {
        alert('Ошибка при загрузке данных клиента');
    }
}

// Сотрудники
function showEmployeeForm(employee = null) {
    const isEdit = employee !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h3>
        <form id="employeeForm">
            <div class="form-group">
                <label for="full_name">ФИО:</label>
                <input type="text" id="full_name" value="${employee?.full_name || ''}" required>
            </div>
            <div class="form-group">
                <label for="contact">Контакт:</label>
                <input type="text" id="contact" value="${employee?.contact || ''}" required>
            </div>
            <div class="form-group">
                <label for="department">Отдел:</label>
                <input type="text" id="department" value="${employee?.department || ''}" required>
            </div>
            <div class="form-group">
                <label for="position">Должность:</label>
                <input type="text" id="position" value="${employee?.position || ''}" required>
            </div>
            <div class="form-group">
                <label for="salary">Зарплата (₽):</label>
                <input type="number" id="salary" value="${employee?.salary || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('employeeForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveEmployee(employee?.employee_id);
    });

    showModal();
}

async function saveEmployee(employeeId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        full_name: document.getElementById('full_name').value,
        contact: document.getElementById('contact').value,
        department: document.getElementById('department').value,
        position: document.getElementById('position').value,
        salary: parseInt(document.getElementById('salary').value)
    };

    if (employeeId) {
        formData.employee_id = employeeId;
    }

    try {
        const url = `${API_BASE_FULL}/Employees${employeeId ? `/${employeeId}` : ''}`;
        const method = employeeId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('employees');
        alert(`Сотрудник ${employeeId ? 'обновлен' : 'добавлен'} успешно!`);

    } catch (error) {
        console.error('Error saving employee:', error);
        alert('Ошибка при сохранении сотрудника: ' + error.message);
    }
}

async function editEmployee(id) {
    try {
        const employee = await fetchWithAuth(`${API_BASE_FULL}/Employees/${id}`);
        showEmployeeForm(employee);
    } catch (error) {
        alert('Ошибка при загрузке данных сотрудника');
    }
}

// Поставщики
function showSupplierForm(supplier = null) {
    const isEdit = supplier !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать поставщика' : 'Добавить поставщика'}</h3>
        <form id="supplierForm">
            <div class="form-group">
                <label for="name">Название:</label>
                <input type="text" id="name" value="${supplier?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="contact">Контакт:</label>
                <input type="text" id="contact" value="${supplier?.contact || ''}" required>
            </div>
            <div class="form-group">
                <label for="additional_info">Доп. информация:</label>
                <textarea id="additional_info" rows="3">${supplier?.additional_info || ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('supplierForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveSupplier(supplier?.supplier_id);
    });

    showModal();
}

async function saveSupplier(supplierId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        name: document.getElementById('name').value,
        contact: document.getElementById('contact').value,
        additional_info: document.getElementById('additional_info').value
    };

    if (supplierId) {
        formData.supplier_id = supplierId;
    }

    try {
        const url = `${API_BASE_FULL}/Suppliers${supplierId ? `/${supplierId}` : ''}`;
        const method = supplierId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('suppliers');
        alert(`Поставщик ${supplierId ? 'обновлен' : 'добавлен'} успешно!`);

    } catch (error) {
        console.error('Error saving supplier:', error);
        alert('Ошибка при сохранении поставщика: ' + error.message);
    }
}

async function editSupplier(id) {
    try {
        const supplier = await fetchWithAuth(`${API_BASE_FULL}/Suppliers/${id}`);
        showSupplierForm(supplier);
    } catch (error) {
        alert('Ошибка при загрузке данных поставщика');
    }
}

// Поставки
function showSupplyForm(supply = null) {
    const isEdit = supply !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать поставку' : 'Добавить поставку'}</h3>
        <form id="supplyForm">
            <div class="form-group">
                <label for="supplier_id">ID поставщика:</label>
                <input type="number" id="supplier_id" value="${supply?.supplier_id || ''}" required>
            </div>
            <div class="form-group">
                <label for="car_id">ID автомобиля:</label>
                <input type="number" id="car_id" value="${supply?.car_id || ''}" required>
            </div>
            <div class="form-group">
                <label for="purchase_price">Цена закупки (₽):</label>
                <input type="number" id="purchase_price" value="${supply?.purchase_price || ''}" required>
            </div>
            <div class="form-group">
                <label for="supply_date">Дата поставки:</label>
                <input type="date" id="supply_date" value="${supply?.supply_date || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('supplyForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveSupply(supply?.supply_id);
    });

    showModal();
}

async function saveSupply(supplyId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        supplier_id: parseInt(document.getElementById('supplier_id').value),
        car_id: parseInt(document.getElementById('car_id').value),
        purchase_price: parseFloat(document.getElementById('purchase_price').value),
        supply_date: document.getElementById('supply_date').value
    };

    if (supplyId) {
        formData.supply_id = supplyId;
    }

    try {
        const url = `${API_BASE_FULL}/Supplies${supplyId ? `/${supplyId}` : ''}`;
        const method = supplyId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('supplies');
        alert(`Поставка ${supplyId ? 'обновлена' : 'добавлена'} успешно!`);

    } catch (error) {
        console.error('Error saving supply:', error);
        alert('Ошибка при сохранении поставки: ' + error.message);
    }
}

async function editSupply(id) {
    try {
        const supply = await fetchWithAuth(`${API_BASE_FULL}/Supplies/${id}`);
        showSupplyForm(supply);
    } catch (error) {
        alert('Ошибка при загрузке данных поставки');
    }
}

// Продажи
function showSaleForm(sale = null) {
    const isEdit = sale !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать продажу' : 'Добавить продажу'}</h3>
        <form id="saleForm">
            <div class="form-group">
                <label for="client_id">ID клиента:</label>
                <input type="number" id="client_id" value="${sale?.client_id || ''}" required>
            </div>
            <div class="form-group">
                <label for="car_id">ID автомобиля:</label>
                <input type="number" id="car_id" value="${sale?.car_id || ''}" required>
            </div>
            <div class="form-group">
                <label for="employee_id">ID сотрудника:</label>
                <input type="number" id="employee_id" value="${sale?.employee_id || ''}" required>
            </div>
            <div class="form-group">
                <label for="sale_price">Цена продажи (₽):</label>
                <input type="number" id="sale_price" value="${sale?.sale_price || ''}" required>
            </div>
            <div class="form-group">
                <label for="purchase_price">Цена закупки (₽):</label>
                <input type="number" id="purchase_price" value="${sale?.purchase_price || ''}" required>
            </div>
            <div class="form-group">
                <label for="sale_date">Дата продажи:</label>
                <input type="date" id="sale_date" value="${sale?.sale_date || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('saleForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveSale(sale?.sale_id);
    });

    showModal();
}

async function saveSale(saleId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        client_id: parseInt(document.getElementById('client_id').value),
        car_id: parseInt(document.getElementById('car_id').value),
        employee_id: parseInt(document.getElementById('employee_id').value),
        sale_price: parseFloat(document.getElementById('sale_price').value),
        purchase_price: parseFloat(document.getElementById('purchase_price').value),
        sale_date: document.getElementById('sale_date').value
    };

    if (saleId) {
        formData.sale_id = saleId;
    }

    console.log('Отправляемые данные продажи:', formData);

    try {
        const url = `${API_BASE_FULL}/Sales${saleId ? `/${saleId}` : ''}`;
        const method = saleId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('sales');
        alert(`Продажа ${saleId ? 'обновлена' : 'добавлена'} успешно!`);

    } catch (error) {
        console.error('Error saving sale:', error);
        alert('Ошибка при сохранении продажи: ' + error.message);
    }
}

async function editSale(id) {
    try {
        const sale = await fetchWithAuth(`${API_BASE_FULL}/Sales/${id}`);
        showSaleForm(sale);
    } catch (error) {
        alert('Ошибка при загрузке данных продажи');
    }
}

// Модели
function showModelForm(model = null) {
    const isEdit = model !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать модель' : 'Добавить модель'}</h3>
        <form id="modelForm">
            <div class="form-group">
                <label for="brand">Бренд:</label>
                <input type="text" id="brand" value="${model?.brand || ''}" required>
            </div>
            <div class="form-group">
                <label for="model">Модель:</label>
                <input type="text" id="model" value="${model?.model || ''}" required>
            </div>
            <div class="form-group">
                <label for="vehicle_type">Тип ТС:</label>
                <input type="text" id="vehicle_type" value="${model?.vehicle_type || ''}" required>
            </div>
            <div class="form-group">
                <label for="body_type">Тип кузова:</label>
                <input type="text" id="body_type" value="${model?.body_type || ''}" required>
            </div>
            <div class="form-group">
                <label for="country">Страна производства:</label>
                <input type="text" id="country" value="${model?.country || ''}" required>
            </div>
            <div class="form-group">
                <label for="fuel_type">Тип топлива:</label>
                <input type="text" id="fuel_type" value="${model?.fuel_type || ''}" required>
            </div>
            <div class="form-group">
                <label for="transmission">Коробка передач:</label>
                <input type="text" id="transmission" value="${model?.transmission || ''}" required>
            </div>
            <div class="form-group">
                <label for="steering">Расположение руля:</label>
                <select id="steering" required>
                    <option value="">Выберите расположение</option>
                    <option value="left" ${model?.steering === 'left' ? 'selected' : ''}>Левый</option>
                    <option value="right" ${model?.steering === 'right' ? 'selected' : ''}>Правый</option>
                </select>
            </div>
            <div class="form-group">
                <label for="drive_type">Привод:</label>
                <input type="text" id="drive_type" value="${model?.drive_type || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('modelForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveModel(model?.model_id);
    });

    showModal();
}

async function saveModel(modelId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        model_id: modelId || 0,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        vehicle_type: document.getElementById('vehicle_type').value,
        body_type: document.getElementById('body_type').value,
        country: document.getElementById('country').value,
        fuel_type: document.getElementById('fuel_type').value,
        transmission: document.getElementById('transmission').value,
        steering: document.getElementById('steering').value,
        drive_type: document.getElementById('drive_type').value
    };

    console.log('Отправляемые данные модели:', formData);

    try {
        const url = `${API_BASE_FULL}/Model${modelId ? `/${modelId}` : ''}`;
        const method = modelId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('models');
        alert(`Модель ${modelId ? 'обновлена' : 'добавлена'} успешно!`);

    } catch (error) {
        console.error('Error saving model:', error);
        alert('Ошибка при сохранении модели: ' + error.message);
    }
}

async function editModel(id) {
    try {
        const model = await fetchWithAuth(`${API_BASE_FULL}/Model/${id}`);
        showModelForm(model);
    } catch (error) {
        alert('Ошибка при загрузке данных модели');
    }
}

// Пользователи
function showUserForm(user = null) {
    const isEdit = user !== null;
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h3>${isEdit ? 'Редактировать пользователя' : 'Добавить пользователя'}</h3>
        <form id="userForm">
            <div class="form-group">
                <label for="username">Имя пользователя:</label>
                <input type="text" id="username" value="${user?.username || ''}" required>
            </div>
            <div class="form-group">
                <label for="password">${isEdit ? 'Новый пароль (оставьте пустым, если не меняется):' : 'Пароль:'}</label>
                <input type="password" id="password" ${isEdit ? '' : 'required'}>
            </div>
            <div class="form-group">
                <label for="role">Роль:</label>
                <select id="role" required>
                    <option value="seller" ${user?.role === 'seller' ? 'selected' : ''}>Продавец</option>
                    <option value="manager" ${user?.role === 'manager' ? 'selected' : ''}>Менеджер</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `;

    document.getElementById('userForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveUser(user?.user_id);
    });

    showModal();
}

async function saveUser(userId = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
        return;
    }

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    if (userId) {
        formData.user_id = userId;
    }

    console.log('Отправляемые данные пользователя:', formData);

    try {
        const url = `${API_BASE_FULL}/Users${userId ? `/${userId}` : ''}`;
        const method = userId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        closeModal();
        showSection('users');
        alert(`Пользователь ${userId ? 'обновлен' : 'добавлен'} успешно!`);

    } catch (error) {
        console.error('Error saving user:', error);
        alert('Ошибка при сохранении пользователя: ' + error.message);
    }
}

async function editUser(id) {
    try {
        const user = await fetchWithAuth(`${API_BASE_FULL}/Users/${id}`);
        showUserForm(user);
    } catch (error) {
        alert('Ошибка при загрузке данных пользователя');
    }
}

// Фунции для удаления

async function deleteCar(id) {
    if (!confirm('Вы уверены, что хотите удалить этот автомобиль?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Cars/${id}`, { method: 'DELETE' });
        showSection('cars');
        alert('Автомобиль удален успешно!');
    } catch (error) {
        console.error('Error deleting car:', error);
        alert('Ошибка при удалении автомобиля: ' + error.message);
    }
}

async function deleteClient(id) {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Clients/${id}`, { method: 'DELETE' });
        showSection('clients');
        alert('Клиент удален успешно!');
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('Ошибка при удалении клиента: ' + error.message);
    }
}

async function deleteEmployee(id) {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Employees/${id}`, { method: 'DELETE' });
        showSection('employees');
        alert('Сотрудник удален успешно!');
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Ошибка при удалении сотрудника: ' + error.message);
    }
}

async function deleteSale(id) {
    if (!confirm('Вы уверены, что хотите удалить эту продажу?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Sales/${id}`, { method: 'DELETE' });
        showSection('sales');
        alert('Продажа удалена успешно!');
    } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Ошибка при удалении продажи: ' + error.message);
    }
}

async function deleteSupplier(id) {
    if (!confirm('Вы уверены, что хотите удалить этого поставщика?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Suppliers/${id}`, { method: 'DELETE' });
        showSection('suppliers');
        alert('Поставщик удален успешно!');
    } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Ошибка при удалении поставщика: ' + error.message);
    }
}

async function deleteSupply(id) {
    if (!confirm('Вы уверены, что хотите удалить эту поставку?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Supplies/${id}`, { method: 'DELETE' });
        showSection('supplies');
        alert('Поставка удалена успешно!');
    } catch (error) {
        console.error('Error deleting supply:', error);
        alert('Ошибка при удалении поставки: ' + error.message);
    }
}

async function deleteModel(id) {
    if (!confirm('Вы уверены, что хотите удалить эту модель?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Model/${id}`, { method: 'DELETE' });
        showSection('models');
        alert('Модель удалена успешно!');
    } catch (error) {
        console.error('Error deleting model:', error);
        alert('Ошибка при удалении модели: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    try {
        const result = await fetchWithAuth(`${API_BASE_FULL}/Users/${id}`, { method: 'DELETE' });
        showSection('users');
        alert('Пользователь удален успешно!');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка при удалении пользователя: ' + error.message);
    }
}