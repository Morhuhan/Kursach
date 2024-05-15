function AddRowToTable(jsonRow, table, rowClickFunction) {
    var jsonData = (typeof jsonRow === 'string') ? JSON.parse(jsonRow) : jsonRow;
    var tableBody = table.querySelector('tbody');
    var headers = table.querySelectorAll('th');
    var row = tableBody.insertRow();

    // Проходим по всем заголовкам и заполняем ячейки
    Array.from(headers).forEach(function(header) {
        var cell = row.insertCell();
        // Используем атрибут 'name' заголовка для получения значения из jsonData
        var jsonFieldName = header.getAttribute('name');
        var value = jsonData[jsonFieldName] || '';
        cell.textContent = value;

        // Проверяем наличие атрибута 'data-expanded-source'
        var expandedSource = header.getAttribute('data-expanded-source');
        if (expandedSource) {
            // Вызываем функцию GetExpandedData для этого столбца
            GetExpandedData(cell, header);
        }
    });

    // Прикрепляем переданную функцию к событию клика по строке
    if (rowClickFunction && typeof rowClickFunction === 'function') {
        row.addEventListener('click', rowClickFunction);
    }
}

function GetPageFromTable(pageNumber, table, rowClickFunction) {
    currentPage = pageNumber;
    var itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    var tableName = table.getAttribute('name');
    var tableBody = table.querySelector('tbody');

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    var requestData = {
        tablename: tableName,
        pagenumber: pageNumber,
        itemsperpage: itemsPerPage
    };

    fetch('/getPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(result => {
        if (result.length === 0 && currentPage > 1) {
            currentPage -= 1;
            GetPageFromTable(currentPage, table, rowClickFunction); // Обновите рекурсивный вызов, чтобы включить новые аргументы
        } else {
            result.forEach(jsonRow => {
                AddRowToTable(jsonRow, table, rowClickFunction); // Передайте rowClickFunction в AddRowToTable
            });

            SortTable(table, 0);
        }
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        alert(error.message);
    });
}

function formatDataWithPrefix(data, prefix) {
    // Если data не массив, превращаем его в массив
    if (!Array.isArray(data)) {
        data = [data];
    }

    // Используем reduce для создания строки с заменой символов * и $ на <br>
    return data.reduce((formattedString, value) => {
        // Заменяем первое вхождение * на текущее значение value
        formattedString = formattedString.replace('*', value);
        // Заменяем все вхождения $ на тег <br> для переноса строки в HTML
        return formattedString.replace(/\$/g, '<br>');
    }, prefix);
}

function GetExpandedData(cell, header) {
    var value = cell.textContent;

    // Установка скрытого атрибута с прочитанным значением
    cell.setAttribute('data-value', value);

    var expandedSource = header.dataset.expandedSource;
    var expandedColumns = header.dataset.expendedColumns.split(', ');
    var columnName = header.getAttribute('name');
    var expandedPrefix = header.dataset.expandedPrefix;

    var dataToSend = {
        value: value,
        columnName: columnName,
        expandedSource: expandedSource,
        expandedColumns: expandedColumns
    };

    var jsonString = JSON.stringify(dataToSend);

    fetch('getColumns', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: jsonString
    })
    .then(response => response.json())
    .then(data => {
        // Создаем упорядоченный массив данных
        var orderedData = expandedColumns.map(column => data[column]);

        // Форматируем данные с префиксом
        var formattedData = formatDataWithPrefix(orderedData, expandedPrefix);

        // Устанавливаем отформатированные данные в ячейку
        cell.innerHTML  = formattedData;
    })
    .catch(error => {
        console.error('Error fetching expanded data:', error);
        cell.textContent = 'Error loading data';
    });
}

function SubmitCreateForm(event) {
    event.preventDefault();

    var form = document.getElementById('createForm');
    var inputs = form.getElementsByTagName('input');

    var objectData = {};
    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');

    for (var i = 0; i < inputs.length; i++) {
        objectData[inputs[i].name] = inputs[i].value;
    }

    var jsonData = JSON.stringify(objectData);
    var url = '/addData/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        GetPageFromTable(currentPage, mainTable);
        UpdateNavigationPanel();
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function SubmitEditForm(event) {
    event.preventDefault();

    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');

    var formData = new FormData(document.getElementById('editForm'));

    // Преобразование FormData в простой объект
    var rowData = {};
    formData.forEach(function(value, key){
        rowData[key] = value;
    });

    // Преобразование объекта rowData в строку JSON
    var jsonString = JSON.stringify(rowData);

    var url = '/editData/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonString
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        else {
            GetPageFromTable(currentPage); // Предполагается, что эта функция обновляет текущую страницу или таблицу
        }
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function SubmitDeleteForm(event) {
    event.preventDefault();

    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');

    var formData = new FormData(document.getElementById('deleteForm'));
    var rowData = {}; // Объявляем объект rowData

    // Перебираем все элементы input внутри формы
    document.querySelectorAll('#deleteForm input').forEach(function(input){
        // Добавляем в объект rowData значения, если input не пустой
        if(input.value) {
            rowData[input.name] = input.value;
        }
    });

    // Преобразование объекта rowData в строку JSON
    var jsonString = JSON.stringify(rowData);

    var url = '/deleteData/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonString
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        else {
            GetPageFromTable(currentPage); // Предполагается, что currentPage определен где-то в коде
            UpdateNavigationPanel(); // Предполагается, что UpdateNavigationPanel определена где-то в коде
        }
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function UpdateNavigationPanel() {
    var itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    var navigationPanel = document.getElementById('navigationPanel');
    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');

    navigationPanel.innerHTML = '';

    var url = '/getCount/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        var totalItems = data;
        var totalPages = Math.ceil(totalItems / itemsPerPage);

        // Установка currentPage в 1, если totalPages равно 0
        if (totalPages === 0) {
            totalPages = 1;
        }

        if (currentPage > totalPages) {
            currentPage = totalPages;
        } else if (currentPage < 1) {
            currentPage = 1;
        }

        for (var i = 1; i <= totalPages; i++) {
            (function(i) {
                var button = document.createElement('button');
                button.innerText = i;
                button.onclick = function() {
                    currentPage = i; // Обновление currentPage при клике
                    GetPageFromTable(i, mainTable);
                    var buttons = navigationPanel.getElementsByTagName('button');
                    for (var j = 0; j < buttons.length; j++) {
                        buttons[j].classList.remove('active');
                    }
                    button.classList.add('active');
                };
                // Установка класса active для кнопки, соответствующей текущей странице
                if (i === currentPage) {
                    button.classList.add('active');
                }
                navigationPanel.appendChild(button);
            })(i);
        }
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function TableRowClick() {
    var cells = this.cells; // Получаем ячейки текущей строки
    var mainTable = document.getElementById('mainTable');
    var columns = mainTable.getElementsByTagName('th'); // Получаем колонки таблицы

    // Получаем формы для редактирования и удаления
    var editForm = document.getElementById("editForm");
    var deleteForm = document.getElementById("deleteForm");

    // Заполняем input элементы в форме редактирования
    Array.from(editForm.querySelectorAll("input")).forEach(function(input) {
        var fieldName = input.name;
        var column = Array.from(columns).find(th => th.getAttribute("name") === fieldName);
        var cellIndex = Array.from(columns).indexOf(column);
        if (cellIndex !== -1) {
            // Проверяем наличие атрибута data-value у ячейки
            var cellValue = cells[cellIndex].hasAttribute('data-value') ? cells[cellIndex].getAttribute('data-value') : cells[cellIndex].textContent;
            input.value = cellValue;
        }
    });

    // Заполняем input элементы в форме удаления
    Array.from(deleteForm.querySelectorAll("input")).forEach(function(input) {
        var fieldName = input.name;
        var column = Array.from(columns).find(th => th.getAttribute("name") === fieldName);
        var cellIndex = Array.from(columns).indexOf(column);
        if (cellIndex !== -1) {
            // Проверяем наличие атрибута data-value у ячейки
            var cellValue = cells[cellIndex].hasAttribute('data-value') ? cells[cellIndex].getAttribute('data-value') : cells[cellIndex].textContent;
            input.value = cellValue;
        }
    });

    // Убираем выделение со всех строк таблицы
    var tableRows = document.querySelectorAll('.mainTable tr');
    tableRows.forEach(function(otherRow) {
        otherRow.classList.remove("selected");
    });

    // Добавляем класс "selected" к текущей строке, чтобы выделить её
    this.classList.add("selected");
}

function AddSortingToTableHeaders(table) {
    var headers = table.getElementsByTagName("th");
    for (let i = 0; i < headers.length; i++) {
        headers[i].addEventListener("click", function() {
            SortTable(table, i);
        });
    }
}

function SortTable(table, columnIndex) {
    var rows, switching, i, x, y, shouldSwitch;
    switching = true;
    // Продолжаем цикл до тех пор, пока не будет выполнено ни одной перестановки
    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");
        // Проходим по всем строкам таблицы, кроме заголовка
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            // Получаем сравниваемые элементы
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            // Проверяем, являются ли значения числами
            var xValue = isNaN(x.innerHTML) ? x.innerHTML.toLowerCase() : parseFloat(x.innerHTML);
            var yValue = isNaN(y.innerHTML) ? y.innerHTML.toLowerCase() : parseFloat(y.innerHTML);
            // Определяем, должны ли элементы поменяться местами
            if (xValue > yValue) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            // Если элементы должны поменяться местами, выполняем перестановку и помечаем, что была выполнена перестановка
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

function AttachDataSourceRowClick() {
    // Получаем все формы на странице
    var forms = document.querySelectorAll('form');

    // Перебираем каждую форму
    forms.forEach(function(form) {
        // Находим все элементы внутри формы с атрибутом data-source
        var elementsWithDataSources = form.querySelectorAll('[data-source]');

        // Перебираем найденные элементы
        elementsWithDataSources.forEach(function(element) {
            // Навешиваем событие onClick на каждый элемент
            element.onclick = function() {
                // Вызываем функцию DataSourceRowClick с аргументом - значением атрибута data-source
                DataSourceRowClick(element, form);
            };
        });
    });
}

function DataSourceRowClick(element, form) {
    var sourceTableName = element.getAttribute('data-source');
    var orderValue = element.getAttribute('data-order');
    var orders = [];

    if (orderValue) {
        var orderElements = form.querySelectorAll('[data-order]');

        orderElements.forEach(function(el) {
            var elOrderValue = el.getAttribute('data-order');
            if (elOrderValue < orderValue) {
                var key = el.getAttribute('name') || el.getAttribute('id');
                var orderObject = {};
                orderObject[key] = el.value;
                orders.push(orderObject);
            }
        });
    }

    var url = '/getAllRecords/' + encodeURIComponent(sourceTableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orders)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        return response.json();
    })
    .then(result => {
        DataSourceCreateModal(result, element);
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function DataSourceCreateModal(data, element) {
    // Создаем элемент модального окна
    var modal = document.createElement('div');
    modal.setAttribute('class', 'modal');

    // Создаем элемент таблицы
    var table = document.createElement('table');
    table.setAttribute('class', 'table');

    // Получаем порядок столбцов из атрибута data-columns-order
    var columnsOrder = element.getAttribute('data-columns-order').split(', ');

    // Создаем заголовки таблицы на основе columnsOrder
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    columnsOrder.forEach(function(column) {
        var th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Создаем тело таблицы
    var tbody = document.createElement('tbody');

    // Проверяем, что data содержит массив объектов
    if (Array.isArray(data) && data.length > 0) {
        // Добавляем строки в таблицу
        data.forEach(function(item) {
            var row = document.createElement('tr');

            columnsOrder.forEach(function(column) {
                var td = document.createElement('td');
                // Используем column для получения значения из объекта item
                td.textContent = item[column] || ''; // Если ключа нет, вставляем пустую строку
                td.setAttribute('data-field-name', column);
                row.appendChild(td);
            });

            // Навешиваем обработчик события onclick на каждую строку
            row.addEventListener('click', function() {
                DataSourceModalRowClick(element, this);
                var event = new Event('input', { bubbles: true });
                element.dispatchEvent(event);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
    } else {
        // Если данных нет, выводим сообщение
        var noDataMsg = document.createElement('p');
        noDataMsg.textContent = 'No data available.';
        modal.appendChild(noDataMsg);
    }

    // Добавляем таблицу в модальное окно
    modal.appendChild(table);

    // Добавляем модальное окно в body документа
    document.body.appendChild(modal);

    // Отображаем модальное окно
    modal.style.display = 'block';

    // Создаем элемент затемнения фона
    var backdrop = document.createElement('div');
    backdrop.setAttribute('class', 'modal-backdrop');

    // Добавляем затемнение фона в body документа
    document.body.appendChild(backdrop);

    // Отображаем затемнение фона
    backdrop.style.display = 'block';

    // Добавляем обработчик клика на затемнение фона для закрытия модального окна
    backdrop.addEventListener('click', function() {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
        document.body.removeChild(modal);
        document.body.removeChild(backdrop);
    });
}

function DataSourceModalRowClick(element, row) {
    // Получаем значение атрибута data-name для input элемента
    var dataName = element.getAttribute('name');

    // Находим ячейку в строке с соответствующим data-field-name
    var selectedCell = row.querySelector(`td[data-field-name="${dataName}"]`);

    // Проверяем, что ячейка найдена
    if (selectedCell) {
        // Вставляем текст из ячейки в input элемент
        element.value = selectedCell.textContent;

        // Закрываем модальное окно и затемнение фона
        var modal = document.querySelector('.modal');
        var backdrop = document.querySelector('.modal-backdrop');
        if (modal && backdrop) {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        }
    } else {
        // Если ячейка не найдена, выводим сообщение об ошибке
        console.error('No matching data-field-name found in the row');
    }
}


////

function ShowPreviewTableRowClick() {
    // Получаем строку таблицы через this
    const row = this;

    // Находим таблицу, в которой находится эта строка
    const table = row.closest('table');

    // Получаем атрибут name этой таблицы
    const tableName = table.getAttribute('name');

    // Получаем columnName из атрибута data-preview таблицы
    const columnName = table.getAttribute('data-preview');

    // Формируем JSON с данными строки
    const rowData = Array.from(row.cells).reduce((acc, cell, index) => {
        const key = table.querySelectorAll('th')[index].getAttribute('name');
        acc[key] = cell.textContent;
        return acc;
    }, {});

    // Отправляем POST fetch запрос
    fetch(`/getCell/${tableName}/${columnName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(rowData),
    })
    .then(response => response.text())
    .then(imageUrl => {
        // Ищем элемент с id imagePreview
        const imagePreview = document.getElementById('imagePreview');

        // Очищаем содержимое imagePreview, чтобы удалить предыдущее изображение, если оно есть
        imagePreview.innerHTML = '';

        // Создаем новый элемент img
        const img = document.createElement('img');

        // Устанавливаем URL изображения в атрибут src нового элемента img
        img.src = imageUrl;

        // Добавляем класс для стилизации, если необходимо
        img.classList.add('some-class-name');

        // Добавляем новый элемент img внутрь div элемента imagePreview
        imagePreview.appendChild(img);
    })
    .catch(error => console.error('Error:', error));
}

function CreateModalSaleRecipe() {
    // Создаем элементы модального окна
    const modal = document.createElement('div');
    modal.id = 'modalSaleRecipe';
    modal.classList.add('modal');

    // Заголовок
    const title = document.createElement('h2');
    title.innerText = 'Рецепт';
    modal.appendChild(title);

    // Поля ввода
    const inputNumber = document.createElement('input');
    inputNumber.type = 'text';
    inputNumber.placeholder = 'Номер';
    inputNumber.classList.add('modalInput');
    modal.appendChild(inputNumber);

    const inputSeries = document.createElement('input');
    inputSeries.type = 'text';
    inputSeries.placeholder = 'Серия';
    inputSeries.classList.add('modalInput');
    modal.appendChild(inputSeries);

    const inputTotal = document.createElement('input');
    inputTotal.type = 'text';
    inputTotal.placeholder = 'Всего';
    inputTotal.classList.add('modalInput');
    modal.appendChild(inputTotal);

    // Контейнер для радиокнопок
    const radioContainer = document.createElement('div');
    radioContainer.classList.add('modalRadioContainer');

    // Радиокнопка "Стандартный"
    const radioStandard = document.createElement('input');
    radioStandard.type = 'radio';
    radioStandard.id = 'radioStandard';
    radioStandard.name = 'recipeType';
    radioStandard.value = 'standard';
    radioStandard.checked = true;

    const labelStandard = document.createElement('label');
    labelStandard.htmlFor = 'radioStandard';
    labelStandard.innerText = 'Стандартный';

    radioContainer.appendChild(radioStandard);
    radioContainer.appendChild(labelStandard);

    // Радиокнопка "Наркотический"
    const radioNarcotic = document.createElement('input');
    radioNarcotic.type = 'radio';
    radioNarcotic.id = 'radioNarcotic';
    radioNarcotic.name = 'recipeType';
    radioNarcotic.value = 'narcotic';

    const labelNarcotic = document.createElement('label');
    labelNarcotic.htmlFor = 'radioNarcotic';
    labelNarcotic.innerText = 'Наркотический';

    radioContainer.appendChild(radioNarcotic);
    radioContainer.appendChild(labelNarcotic);

    // Добавляем контейнер с радиокнопками в модальное окно
    modal.appendChild(radioContainer);

    // Контейнер для кнопок
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modalButtonsContainer');

    // Кнопка Отмена
    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Отмена';
    cancelButton.classList.add('modalButton');
    cancelButton.onclick = function() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    };
    buttonContainer.appendChild(cancelButton);

    // Кнопка Далее
    const nextButton = document.createElement('button');
    nextButton.innerText = 'Далее';
    nextButton.classList.add('modalButton');
    buttonContainer.appendChild(nextButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonContainer);

    // Находим существующий элемент overlay
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.style.display = 'block';
        overlay.style.zIndex = '1000';  // z-index на 1 меньше, чем у модального окна
    }

    // Добавляем модальное окно на страницу
    document.body.appendChild(modal);

    // Присваиваем модальному окну максимальный z-index
    modal.style.zIndex = '1001';
}

function ModalSaleRecipeSubmitClick() {
    // Создаем элементы модального окна
    const modal = document.createElement('div');
    modal.id = 'modalSaleRecipe';
    modal.classList.add('modal');

    // Заголовок
    const title = document.createElement('h2');
    title.innerText = 'Рецепт';
    modal.appendChild(title);

    // Поля ввода
    const inputNumber = document.createElement('input');
    inputNumber.type = 'text';
    inputNumber.placeholder = 'Номер';
    inputNumber.classList.add('modalInput');
    modal.appendChild(inputNumber);

    const inputSeries = document.createElement('input');
    inputSeries.type = 'text';
    inputSeries.placeholder = 'Серия';
    inputSeries.classList.add('modalInput');
    modal.appendChild(inputSeries);

    const inputTotal = document.createElement('input');
    inputTotal.type = 'text';
    inputTotal.placeholder = 'Всего';
    inputTotal.classList.add('modalInput');
    modal.appendChild(inputTotal);

    // Контейнер для кнопок
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modalButtonsContainer');

    // Кнопка Отмена
    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Отмена';
    cancelButton.classList.add('modalButton');
    cancelButton.onclick = function() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    };
    buttonContainer.appendChild(cancelButton);

    // Кнопка Далее
    const nextButton = document.createElement('button');
    nextButton.innerText = 'Далее';
    nextButton.classList.add('modalButton');
    buttonContainer.appendChild(nextButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonContainer);

    // Находим существующий элемент overlay
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.style.display = 'block';
        overlay.style.zIndex = '1000';  // z-index на 1 меньше, чем у модального окна
    }

    // Добавляем модальное окно на страницу
    document.body.appendChild(modal);

    // Присваиваем модальному окну максимальный z-index
    modal.style.zIndex = '1001';
}

function CreateModalSale() {
    // Создаем сам модальный контейнер и присваиваем класс и id
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.id = 'modalSale';
    modal.style.zIndex = '9';

    // Создаем контейнер для "Рецепт" и кнопки "Добавить"
    const headerContainer = document.createElement('div');

    const labelRecipe = document.createElement('label');
    labelRecipe.textContent = 'Рецепт';
    headerContainer.appendChild(labelRecipe);

    const addButtonHeader = document.createElement('button');
    addButtonHeader.textContent = 'Добавить';
    headerContainer.appendChild(addButtonHeader);

    modal.appendChild(headerContainer);

    // Создаем контейнер для таблицы и кнопок "Добавить" и "Удалить"
    const tableContainer = document.createElement('div');

    const table = document.createElement('table');
    table.classList.add('table');
    table.id = 'modalSaleTable';
    const tableHeader = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Название', 'Количество', 'Цена'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);
    table.appendChild(tableHeader);

    const tableBody = document.createElement('tbody');
    table.appendChild(tableBody);

    tableContainer.appendChild(table);

    const buttonContainer = document.createElement('div');

    const addButton = document.createElement('button');
    addButton.textContent = 'Добавить';
    buttonContainer.appendChild(addButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    buttonContainer.appendChild(deleteButton);

    tableContainer.appendChild(buttonContainer);
    modal.appendChild(tableContainer);

    // Создаем контейнер для "Всего" и поля для суммы
    const totalContainer = document.createElement('div');

    const labelTotal = document.createElement('label');
    labelTotal.textContent = 'Всего';
    totalContainer.appendChild(labelTotal);

    const totalField = document.createElement('input');
    totalField.type = 'text';
    totalField.readOnly = true;
    totalField.classList.add('modalInput');
    totalContainer.appendChild(totalField);

    modal.appendChild(totalContainer);

    // Создаем контейнер для кнопок "Отмена" и "Далее" и присваиваем класс
    const footerContainer = document.createElement('div');
    footerContainer.classList.add('modalButtonsContainer');

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Отмена';
    footerContainer.appendChild(cancelButton);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Далее';
    footerContainer.appendChild(nextButton);

    modal.appendChild(footerContainer);

    // Добавляем модальное окно в body
    document.body.appendChild(modal);

    // Обрабатываем элемент с id 'modalOverlay'
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay && modalOverlay.style.display === 'none') {
        modalOverlay.style.display = 'block';
        modalOverlay.style.zIndex = '8';
    }
}

function createModal() {
    // Создание модального окна и его основных контейнеров
    const modal = document.createElement('div');
    modal.id = 'modalSale';
    modal.className = 'modal';

     const container1 = document.createElement('div');
     container1.id = 'modalSaleContainer1';

     const container2 = document.createElement('div');
     container2.id = 'modalSaleContainer2';

     const container3 = document.createElement('div');
     container3.id = 'modalSaleContainer3';

     const container4 = document.createElement('div');
     container4.id = 'modalSaleContainer4';

     // Наполнение container1
     const label = document.createElement('label');
     label.textContent = 'Label Text';
     const addButton1 = document.createElement('button');
     addButton1.className = 'addButton';
     addButton1.textContent = 'Add';
     container1.appendChild(label);
     container1.appendChild(addButton1);

     // Наполнение container2
     const table = document.createElement('table');
     table.id = 'modalSaleTable';
     table.className = 'table';

     // Создание заголовков таблицы
     const headerRow = document.createElement('tr');
     const nameHeader = document.createElement('th');
     nameHeader.textContent = 'Название';
     const priceHeader = document.createElement('th');
     priceHeader.textContent = 'Цена';
     headerRow.appendChild(nameHeader);
     headerRow.appendChild(priceHeader);
     table.appendChild(headerRow);

     // Создание элемента tbody
     const tbody = document.createElement('tbody');

     // Добавление тестовых данных
     const testData = [
         { name: 'Item 1', price: '100' },
         { name: 'Item 2', price: '200' },
         { name: 'Item 3', price: '300' }
     ];

     testData.forEach(data => {
         const row = document.createElement('tr');
         const nameCell = document.createElement('td');
         nameCell.textContent = data.name;
         const priceCell = document.createElement('td');
         priceCell.textContent = data.price;
         row.appendChild(nameCell);
         row.appendChild(priceCell);
         tbody.appendChild(row); // Добавление строки в tbody, а не напрямую в table
     });

     // Добавление tbody в table
     table.appendChild(tbody);

     container2.appendChild(table);
     container2.appendChild(container3); // container3 внутри container2

     // Наполнение container3
     const addButton2 = document.createElement('button');
     addButton2.className = 'addButton';
     addButton2.textContent = 'Add';
     const deleteButton = document.createElement('button');
     deleteButton.className = 'deleteButton';
     deleteButton.textContent = 'Delete';
     container3.appendChild(addButton2);
     container3.appendChild(deleteButton);

     // Наполнение container4
     const submitButton = document.createElement('button');
     submitButton.className = 'submitButton';
     submitButton.textContent = 'Submit';
     const cancelButton = document.createElement('button');
     cancelButton.className = 'cancelButton';
     cancelButton.textContent = 'Cancel';
     container4.appendChild(submitButton);
     container4.appendChild(cancelButton);

     // Вставка всех контейнеров в модальное окно
     modal.appendChild(container1);
     modal.appendChild(container2);
     modal.appendChild(container4);

     // Вставка модального окна в body
     document.body.appendChild(modal);
}