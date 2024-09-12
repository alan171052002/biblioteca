const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
console.log(navToggle, navMenu);

navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("nav-menu_visible");
})

// Aquí verificamos si el nombre del usuario está disponible en la sesión
/*fetch('/getUser')  // Este endpoint debe devolver la información del usuario
    .then(response => response.json())
    .then(user => {
        if (user && user.nombre) {
            // Reemplazar "Iniciar Sesión" por el nombre del usuario
            document.getElementById('menu-login').innerHTML = `<a href="#" class="nav-menu-link nav-link">${user.nombre}</a>`;
        }
    });*/

document.addEventListener('DOMContentLoaded', () => {
    fetch('/user-session')
        .then(response => response.json())
        .then(data => {
            const menuLogin = document.getElementById('menu-login');
            if (data.loggedIn) {
                menuLogin.innerHTML = `<a href="/logout" class="nav-menu-link nav-link">Cerrar Sesión</a>`;
            }
        });
});



/*

*/
document.addEventListener('DOMContentLoaded', function () {
    // Cargar la lista de archivos al cargar la página
    fetch('/archivos/listar')  // Suponiendo que tienes una ruta que devuelve la lista de archivos
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            data.forEach(archivo => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${archivo.nombre}</td>
                    <td>${archivo.descripcion}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="verArchivo('${archivo.pdf_path}')">Ver</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarArchivo(${archivo.id})">Eliminar</button>
                        <label for="paginaEliminar${archivo.id}">Páginas a eliminar:</label>
                        <input type="text" id="paginaEliminar${archivo.id}" placeholder="Ej: 1,2" />
                        <button class="btn btn-danger btn-sm" onclick="eliminarPaginas('${archivo.pdf_path}', ${archivo.id})">Eliminar</button>
                    </td>
                `;
                fileList.appendChild(row);
            });
        })
        .catch(err => console.error('Error al cargar archivos:', err));

    // Manejar el envío del formulario de agregar archivo
    const addFileForm = document.getElementById('addFileForm');
    addFileForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(addFileForm);

        fetch('/archivos/agregar', { // Suponiendo que tienes una ruta para agregar archivos
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload(); // Recargar la página para mostrar el nuevo archivo
                } else {
                    alert('Error al agregar archivo.');
                }
            })
            .catch(err => console.error('Error al agregar archivo:', err));
    });
});

// Función para ver el archivo en un modal
function verArchivo(pdfPath) {
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.src = `/${pdfPath}`; // Cargar el PDF en el iframe
    const viewFileModal = new bootstrap.Modal(document.getElementById('viewFileModal'));
    viewFileModal.show();
}

// Función para eliminar archivo
function eliminarArchivo(id) {
    if (confirm('¿Estás seguro de eliminar este archivo?')) {
        fetch(`/archivos/eliminar/${id}`, { // Suponiendo que tienes una ruta para eliminar archivos
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload(); // Recargar la página para reflejar la eliminación
                } else {
                    alert('Error al eliminar archivo.');
                }
            })
            .catch(err => console.error('Error al eliminar archivo:', err));
    }
}


/*


*/

document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addFileModal = document.getElementById('addFileModal');
    const closeViewModalBtn = document.getElementById('closeViewModalBtn');
    const viewFileModal = document.getElementById('viewFileModal');

    // Abrir el modal de agregar archivo
    openModalBtn.addEventListener('click', () => {
        addFileModal.style.display = 'block';
    });

    // Cerrar el modal de agregar archivo
    closeModalBtn.addEventListener('click', () => {
        addFileModal.style.display = 'none';
    });

    // Cerrar el modal de ver archivo
    closeViewModalBtn.addEventListener('click', () => {
        viewFileModal.style.display = 'none';
        document.getElementById('pdfViewer').src = ""; // Limpiar el src del iframe
    });

    // Cerrar modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target === addFileModal) {
            addFileModal.style.display = 'none';
        } else if (event.target === viewFileModal) {
            viewFileModal.style.display = 'none';
            document.getElementById('pdfViewer').src = ""; // Limpiar el src del iframe
        }
    };

    // Código existente para cargar archivos, agregar, ver y eliminar archivos...
});

async function eliminarPaginas(pdfPath, id) {
    const input = document.getElementById(`paginaEliminar${id}`);
    const paginas = input.value.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num)); // Convertir a números y filtrar

    if (paginas.length > 0) {
        // Cargar el PDF
        const existingPdfBytes = await fetch(pdfPath).then(res => res.arrayBuffer());
        const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

        // Eliminar las páginas especificadas
        for (let i = paginas.length - 1; i >= 0; i--) {
            const pagina = paginas[i] - 1; // Convertir a índice de 0
            pdfDoc.removePage(pagina);
        }

        // Guardar el nuevo PDF
        const pdfBytes = await pdfDoc.save();

        // Crear un blob y permitir la descarga
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archivo_modificado_${id}.pdf`; // Nombre del archivo a descargar
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        alert('Páginas eliminadas con éxito');
    } else {
        alert('Por favor, introduce al menos un número de página a eliminar.');
    }
}


/************************************ */
document.addEventListener('DOMContentLoaded', function () {
    const manualForm = document.getElementById('manualForm');
    const manualTableBody = document.querySelector('#manualTable tbody');

    // Función para listar manuales
    function listarManuales() {
        fetch('/manuales/listar')
            .then(response => response.json())
            .then(manuales => {
                manualTableBody.innerHTML = ''; // Limpiar la tabla
                manuales.forEach(manual => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${manual.nombre}</td>
                        <td>${manual.descripcion}</td>
                        <td>
                            <a href="/manuales/${manual.pdf_path}" download>Descargar</a>
                            <button class="delete-btn" data-id="${manual.id}">Eliminar</button>
                        </td>
                    `;
                    manualTableBody.appendChild(row);
                });
            });
    }

    // Función para agregar un manual
    manualForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(manualForm);

        fetch('/manuales/agregar', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    listarManuales(); // Actualizar lista de manuales
                }
            });
    });

    // Función para eliminar un manual
    manualTableBody.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');

            fetch(`/manuales/eliminar/${id}`, {
                method: 'DELETE'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        listarManuales(); // Actualizar lista de manuales
                    }
                });
        }
    });

    // Cargar manuales al cargar la página
    listarManuales();
});



document.addEventListener('DOMContentLoaded', () => {
    // Hacer una petición al servidor para obtener el rol del usuario
    fetch('/api/rol')
        .then(response => response.json())
        .then(data => {
            const role = data.role;

            if (role !== 'Gerente') {
                // Si el rol no es 'Gerente', ocultar el menú de archivos
                const archivosMenu = document.getElementById('menu-archivos');
                if (archivosMenu) {
                    archivosMenu.style.display = 'none';
                }

                // Ocultar el menú de usuarios si no es gerente
                const usuariosMenu = document.getElementById('menu-usuarios'); // Asegúrate de que este ID coincida con el del HTML
                if (usuariosMenu) {
                    usuariosMenu.style.display = 'none';
                }

                // Oculta el formulario para agregar manual si no es gerente
                const manualForm = document.getElementById('manualForm');
                const manualSection = document.getElementById('manualSection');
                if (manualForm) {
                    manualForm.style.display = 'none';
                }
                if (manualSection) {
                    manualSection.style.display = 'block';
                }

                // Oculta los botones de eliminar para los operadores
                const deleteButtons = document.querySelectorAll('.delete-button');
                deleteButtons.forEach(button => {
                    button.style.display = 'none';
                });
            }
        })
        .catch(error => console.error('Error al obtener el rol del usuario:', error));
});



/**********************************
 * 
 * 
 */


document.addEventListener('DOMContentLoaded', function () {
    // Cargar la lista de usuarios al cargar la página
    fetch('/usuarios/listar')
        .then(response => response.json())
        .then(usuarios => {
            const usuariosBody = document.getElementById('usuarios-body');
            usuarios.forEach(usuario => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.Nombre}</td>
                    <td>${usuario.cargo}</td>
                    <td>${usuario.user_name}</td>
                    <td>
                        <button class="edit-btn" data-id="${usuario.id}" data-nombre="${usuario.Nombre}" data-cargo="${usuario.cargo}" data-username="${usuario.user_name}" data-password="${usuario.password}">Editar</button>
                        <button class="delete-btn" data-id="${usuario.id}">Eliminar</button>
                    </td>
                `;
                usuariosBody.appendChild(row);

                // Crear la fila del formulario de edición y mantenerla oculta
                const editRow = document.createElement('tr');
                editRow.classList.add('editFormRow');
                editRow.style.display = 'none'; // Mantener oculto

                editRow.innerHTML = `
                    <td colspan="5">
                        <form class="editUserForm" data-id="${usuario.id}">
                            <label>Nombre:</label>
                            <input type="text" id="editNombre-${usuario.id}" value="${usuario.Nombre}">
                            <label>Cargo:</label>
                            <input type="text" id="editCargo-${usuario.id}" value="${usuario.cargo}">
                            <label>Usuario:</label>
                            <input type="text" id="editUserName-${usuario.id}" value="${usuario.user_name}">
                            <label>Password:</label>
                            <input type="password" id="editPassword-${usuario.id}" placeholder="Ingresa nueva contraseña">
                            <button type="submit">Guardar cambios</button>
                        </form>
                    </td>
                `;
                usuariosBody.appendChild(editRow);

                // Manejador de evento para abrir/cerrar el formulario de edición
                const editButton = row.querySelector('.edit-btn');
                editButton.addEventListener('click', function () {
                    const formRow = editRow;
                    formRow.style.display = formRow.style.display === "none" ? "table-row" : "none";
                });
            });

            // Manejador para el envío del formulario de edición
            document.querySelectorAll('.editUserForm').forEach(form => {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const userId = this.getAttribute('data-id');
                    const updatedUser = {
                        Nombre: document.getElementById(`editNombre-${userId}`).value,
                        cargo: document.getElementById(`editCargo-${userId}`).value,
                        user_name: document.getElementById(`editUserName-${userId}`).value,
                        password: document.getElementById(`editPassword-${userId}`).value
                    };

                    console.log('Datos a enviar:', updatedUser); // Añadir este console.log

                    fetch(`/usuarios/editar/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify(updatedUser),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log('Respuesta del servidor:', data); // Agregar este console.log
                            if (data.success) {
                                alert('Usuario actualizado exitosamente');
                                console.log('Respuesta del servidor:', data); // Agregar este console.log
                                location.reload(); // Actualizar la página después de guardar
                            } else {
                                alert('Error al actualizar el usuario');
                            }
                        })
                        .catch(err => console.error('Error:', err));
                });
            });
        })
        .catch(err => console.error('Error al obtener los usuarios:', err));
});
