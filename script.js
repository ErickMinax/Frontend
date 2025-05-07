document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://74.163.96.57:8080';
    let currentSection = 'estudiantes';
    
    // Cargar sección inicial
    loadSection(currentSection);
    
    // Manejar clicks en la navegación
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            currentSection = this.getAttribute('data-section');
            loadSection(currentSection);
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Función para cargar secciones
    function loadSection(section) {
        const contentSection = document.getElementById('content-section');
        const template = document.getElementById(`${section}-template`);
        
        if (template) {
            contentSection.innerHTML = '';
            contentSection.appendChild(template.content.cloneNode(true));
            
            // Cargar datos según la sección
            switch(section) {
                case 'estudiantes':
                    loadEstudiantes();
                    setupEstudianteEvents();
                    break;
                case 'matriculas':
                    loadMatriculas();
                    setupMatriculaEvents();
                    break;
                case 'ciclos':
                    loadCiclos();
                    setupCicloEvents();
                    break;
                case 'asignaturas':
                    loadAsignaturas();
                    setupAsignaturaEvents();
                    break;
                case 'docentes':
                    loadDocentes();
                    setupDocenteEvents();
                    break;
            }
        }
    }
    
    // ========== FUNCIONES COMUNES ==========
    function showAlert(icon, title, text) {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            showConfirmButton: false,
            timer: 2000
        });
    }
    
    function confirmAction(message, callback) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                callback();
            }
        });
    }
    
    // ========== ESTUDIANTES ==========
    function loadEstudiantes() {
        fetch(`${API_BASE_URL}/estudiantes`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('estudiantes-table-body');
                tableBody.innerHTML = '';
                
                data.forEach(estudiante => {
                    const row = document.createElement('tr');
                    row.className = 'fade-in';
                    row.innerHTML = `
                        <td>${estudiante.ci}</td>
                        <td>${estudiante.nombres}</td>
                        <td>
                            <button class="btn btn-primary btn-sm btn-action btn-editar" data-id="${estudiante.ci}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-action btn-eliminar" data-id="${estudiante.ci}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los estudiantes');
            });
    }
    
    function setupEstudianteEvents() {
        // Nuevo estudiante
        document.getElementById('btnNuevoEstudiante')?.addEventListener('click', () => {
            showEstudianteForm();
        });
        
        // Delegación de eventos para editar/eliminar
        document.getElementById('estudiantes-table-body')?.addEventListener('click', (e) => {
            const target = e.target;
            const ci = target.getAttribute('data-id');
            
            if (target.classList.contains('btn-editar')) {
                fetch(`${API_BASE_URL}/estudiantes/${ci}`)
                    .then(response => response.json())
                    .then(estudiante => {
                        showEstudianteForm(estudiante);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo cargar el estudiante');
                    });
            } else if (target.classList.contains('btn-eliminar')) {
                confirmAction('¿Eliminar este estudiante?', () => {
                    fetch(`${API_BASE_URL}/estudiantes/${ci}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            showAlert('success', 'Éxito', 'Estudiante eliminado');
                            loadEstudiantes();
                        } else {
                            throw new Error('Error al eliminar');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo eliminar el estudiante');
                    });
                });
            }
        });
    }
    
    function showEstudianteForm(estudiante = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
    
        const isEdit = estudiante !== null;
    
        modalTitle.textContent = isEdit ? 'Editar Estudiante' : 'Nuevo Estudiante';
    
        modalBody.innerHTML = `
            <form id="estudianteForm">
                <div class="mb-3">
                    <label for="ci" class="form-label">Cédula de Identidad</label>
                    <input type="text" class="form-control" id="ci" ${isEdit ? 'readonly' : ''} maxlength="10" required>
                </div>
                <div class="mb-3">
                    <label for="nombres" class="form-label">Nombres</label>
                    <input type="text" class="form-control" id="nombres" required>
                </div>
            </form>
        `;
    
        if (isEdit) {
            document.getElementById('ci').value = estudiante.ci;
            document.getElementById('nombres').value = estudiante.nombres;
        }
    
        // Validación para que solo se ingresen números y máximo 10
        const ciInput = document.getElementById('ci');
        ciInput.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    
        document.getElementById('modalSaveBtn').onclick = () => {
            const ci = document.getElementById('ci').value.trim();
            const nombres = document.getElementById('nombres').value.trim();
    
            if (!/^\d{10}$/.test(ci)) {
                showAlert('warning', 'Cédula inválida', 'Debe tener exactamente 10 números sin letras ni signos.');
                return;
            }
    
            const formData = {
                ci: ci,
                nombres: nombres
            };
    
            const url = isEdit ? `${API_BASE_URL}/estudiantes/${ci}` : `${API_BASE_URL}/estudiantes`;
            const method = isEdit ? 'PUT' : 'POST';
    
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) {
                    showAlert('success', 'Éxito', isEdit ? 'Estudiante actualizado' : 'Estudiante creado');
                    modal.hide();
                    loadEstudiantes();
                } else {
                    throw new Error('Error en la operación');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'Error', isEdit ? 'No se pudo actualizar el estudiante' : 'No se pudo crear el estudiante');
            });
        };
    
        modal.show();
    }
    
    
    // ========== MATRÍCULAS ==========
    function loadMatriculas() {
        fetch(`${API_BASE_URL}/matriculas`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('matriculas-table-body');
            tableBody.innerHTML = '';
    
            // Asegurar que los IDs sean números y ordenar
            data.forEach(m => m.id_matricula = Number(m.id_matricula));
            data.sort((a, b) => a.id_matricula - b.id_matricula);
    
            console.log(data.map(m => m.id_matricula));
    
            // Mapear a una lista de promesas que traen al estudiante y combinan datos
            const promises = data.map(matricula => {
                return fetch(`${API_BASE_URL}/estudiantes/${matricula.ci_est_per}`)
                    .then(res => res.json())
                    .then(estudiante => ({ matricula, estudiante }))
                    .catch(error => {
                        console.error('Error al obtener estudiante:', error);
                        return { matricula, estudiante: { nombres: 'Error' } };
                    });
            });
    
            // Esperar a que todas las promesas terminen
            Promise.all(promises).then(resultados => {
                resultados.forEach(({ matricula, estudiante }) => {
                    const row = document.createElement('tr');
                    row.className = 'fade-in';
                    row.innerHTML = `
                        <td>${matricula.id_matricula}</td>
                        <td>${estudiante.nombres}</td>
                        <td>${matricula.id_cic_per}</td>
                        <td>${matricula.nota1 || '-'}</td>
                        <td>${matricula.nota2 || '-'}</td>
                        <td>${matricula.supletorio || '-'}</td>
                        <td>
                            ${matricula.aprobado === 'S' ? '<span class="badge bg-success">Sí</span>' :
                             matricula.aprobado === 'N' ? '<span class="badge bg-danger">No</span>' :
                             `<span class="badge bg-warning text-dark">${matricula.aprobado}</span>`}
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm btn-action btn-editar" data-id="${matricula.id_matricula}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-action btn-eliminar" data-id="${matricula.id_matricula}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            });
        })
        .catch(error => {
            console.error('Error al obtener matrículas:', error);
            showAlert('error', 'Error', 'No se pudieron cargar las matrículas');
        });
    }

    function setupMatriculaEvents() {
        // Nueva matrícula
        document.getElementById('btnNuevaMatricula')?.addEventListener('click', () => {
            showMatriculaForm();
        });
        
        // Delegación de eventos para editar/eliminar
        document.getElementById('matriculas-table-body')?.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.getAttribute('data-id');
            
            if (target.classList.contains('btn-editar')) {
                fetch(`${API_BASE_URL}/matriculas/${id}`)
                    .then(response => response.json())
                    .then(matricula => {
                        showMatriculaForm(matricula);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo cargar la matrícula');
                    });
            } else if (target.classList.contains('btn-eliminar')) {
                confirmAction('¿Eliminar esta matrícula?', () => {
                    fetch(`${API_BASE_URL}/matriculas/${id}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            showAlert('success', 'Éxito', 'Matrícula eliminada');
                            loadMatriculas();
                        } else {
                            throw new Error('Error al eliminar');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo eliminar la matrícula');
                    });
                });
            }
        });
    }
    
    function showMatriculaForm(matricula = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        const isEdit = matricula !== null;
        
        modalTitle.textContent = isEdit ? 'Editar Matrícula' : 'Nueva Matrícula';
        
        modalBody.innerHTML = `
    <form id="matriculaForm">
        ${isEdit ? `<input type="hidden" id="id_matricula" value="${matricula.id_matricula}">` : ''}
        <div class="mb-3">
            <label for="ci_est_per" class="form-label">CI Estudiante</label>
            <input type="text" class="form-control" id="ci_est_per" value="${isEdit ? matricula.ci_est_per : ''}" ${isEdit ? 'readonly' : ''} required>
        </div>
        <div class="mb-3">
            <label for="id_cic_per" class="form-label">ID Ciclo</label>
            <input type="number" class="form-control" id="id_cic_per" value="${isEdit ? matricula.id_cic_per : ''}" ${isEdit ? 'readonly' : ''} required>
        </div>
        <div class="mb-3">
            <label for="nota1" class="form-label">Nota 1</label>
            <input type="number" step="0.01" class="form-control" id="nota1" value="${isEdit ? matricula.nota1 || '' : ''}">
        </div>
        <div class="mb-3">
            <label for="nota2" class="form-label">Nota 2</label>
            <input type="number" step="0.01" class="form-control" id="nota2" value="${isEdit ? matricula.nota2 || '' : ''}">
        </div>
        <div class="mb-3">
            <label for="supletorio" class="form-label">Supletorio</label>
            <input type="number" step="0.01" class="form-control" id="supletorio" value="${isEdit ? matricula.supletorio || '' : ''}">
        </div>
        <div class="mb-3">
            <label for="aprobado" class="form-label">Aprobado</label>
            <select class="form-select" id="aprobado" ${isEdit ? 'disabled' : ''}>
                <option value="S" ${isEdit && matricula.aprobado === 'S' ? 'selected' : ''}>Sí</option>
                <option value="N" ${isEdit && matricula.aprobado === 'N' ? 'selected' : ''}>No</option>
            </select>
        </div>
    </form>
`;

    // Mostrar nombre del estudiante, justo después del campo de cédula
    const ciInput = document.getElementById('ci_est_per');
    const nombreCampo = document.createElement('div');
    nombreCampo.className = 'mb-3';
    nombreCampo.innerHTML = `
        <label class="form-label">Nombre del Estudiante</label>
        <input type="text" class="form-control" id="nombre_estudiante" readonly>
    `;

    // Insertar el campo justo después de la cédula
    ciInput.parentElement.insertAdjacentElement('afterend', nombreCampo);

    // Función para buscar y mostrar el nombre
    function cargarNombreEstudiante(ci) {
        if (ci) {
            fetch(`${API_BASE_URL}/estudiantes/${ci}`)
                .then(response => {
                    if (!response.ok) throw new Error('No encontrado');
                    return response.json();
                })
                .then(estudiante => {
                    document.getElementById('nombre_estudiante').value = estudiante.nombres || 'No disponible';
                })
                .catch(() => {
                    document.getElementById('nombre_estudiante').value = 'No encontrado';
                });
        } else {
            document.getElementById('nombre_estudiante').value = '';
        }
    }

    // Ejecutar al cargar el formulario
    if (isEdit) {
        cargarNombreEstudiante(ciInput.value);
    }

    // Y si es modo nuevo, que escuche cambios en el campo CI
    ciInput.addEventListener('input', () => {
        cargarNombreEstudiante(ciInput.value);
    });



    // Obtener referencias a los campos
    const nota1Input = document.getElementById('nota1');
    const nota2Input = document.getElementById('nota2');
    const supletorioInput = document.getElementById('supletorio');
    const aprobadoSelect = document.getElementById('aprobado');

    // Deshabilitar el campo supletorio al inicio
    supletorioInput.disabled = true;

    function evaluarNotas() {
        const n1 = parseFloat(nota1Input.value);
        const n2 = parseFloat(nota2Input.value);
        const sup = parseFloat(supletorioInput.value);
        
        if (!isNaN(n1) && !isNaN(n2)) {
            const promedio = (n1 + n2) / 2;
    
            if (promedio >= 7) {
                supletorioInput.disabled = true;
                supletorioInput.value = '';
                aprobadoSelect.value = 'S';  // Aprobar si el promedio es mayor o igual a 7
            } else {
                supletorioInput.disabled = false;
                if (!isNaN(sup)) {
                    const nuevoPromedio = (promedio + sup) / 2;
                    aprobadoSelect.value = nuevoPromedio >= 7 ? 'S' : 'N';
                } else {
                    aprobadoSelect.value = 'N';  // No aprobado si el promedio es menor a 7
                }
            }
        } else if (!isNaN(n1) && isNaN(n2)) {
            // Solo la nota1 está presente, se establece como "Pendiente"
            aprobadoSelect.value = 'Pendiente';
            supletorioInput.disabled = true;
            supletorioInput.value = '';  // Deshabilitar supletorio hasta que se tenga la segunda nota
        } else if (isNaN(n1) && !isNaN(n2)) {
            // Solo la nota2 está presente, se establece como "Pendiente"
            aprobadoSelect.value = 'Pendiente';
            supletorioInput.disabled = true;
            supletorioInput.value = '';  // Deshabilitar supletorio hasta que se tenga la primera nota
        } else {
            supletorioInput.disabled = true;
            supletorioInput.value = '';
            aprobadoSelect.value = 'Pendiente';  // Se asigna Pendiente si no se tienen notas
        }
    }
    
    
    // Escuchar cambios en los campos de nota
    nota1Input.addEventListener('input', evaluarNotas);
    nota2Input.addEventListener('input', evaluarNotas);
    supletorioInput.addEventListener('input', evaluarNotas);

    // Ejecutar evaluación inicial si ya vienen notas cargadas
    evaluarNotas();

        
    document.getElementById('modalSaveBtn').onclick = () => {
        const formData = {
        // Solo se toman las notas y el aprobado, y el supletorio si es necesario
        nota1: document.getElementById('nota1').value ? parseFloat(document.getElementById('nota1').value) : null,
        nota2: document.getElementById('nota2').value ? parseFloat(document.getElementById('nota2').value) : null,
        supletorio: document.getElementById('supletorio').value ? parseFloat(document.getElementById('supletorio').value) : null,
        aprobado: document.getElementById('aprobado').value === "" ? "Pendiente" : document.getElementById('aprobado').value
        };
        
        const isEdit = document.getElementById('id_matricula') !== null;

        // Imprimir el JSON antes de enviarlo
        console.log('Datos a enviar:', JSON.stringify(formData));

    // Obtener el id de la matrícula solo si es una edición
    const url = isEdit 
        ? `${API_BASE_URL}/matriculas/${document.getElementById('id_matricula').value}`  // ID en la URL para la actualización
        : `${API_BASE_URL}/matriculas`;
    
        const method = isEdit ? 'PUT' : 'POST';
    
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.ok) {
                showAlert('success', 'Éxito', isEdit ? 'Matrícula actualizada' : 'Matrícula creada');
                modal.hide();
                loadMatriculas();
            } else {
                throw new Error('Error en la operación');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('error', 'Error', isEdit ? 'No se pudo actualizar la matrícula' : 'No se pudo crear la matrícula');
        });
    };
    

                // Asegurarse de que el foco no quede atrapado en el modal
        const previousFocus = document.querySelector('[data-previous-focus]');
        if (previousFocus) {
            previousFocus.focus();
        }
        
        modal.show();
    }
    
    // ========== CICLOS ==========
    function loadCiclos() {
        Promise.all([
            fetch(`${API_BASE_URL}/asignaturas`).then(res => res.json()),
            fetch(`${API_BASE_URL}/docentes`).then(res => res.json()),
            fetch(`${API_BASE_URL}/ciclos`).then(res => res.json())
        ])
        .then(([asignaturas, docentes, ciclos]) => {
            // Mapear id_asignatura a nombre_asignatura
            const asignaturaMap = new Map(asignaturas.map(a => [a.id_asignatura, a.nombre_asignatura]));
    
            // Mapear ci_doc_per a nombre del docente
            const docenteMap = new Map(docentes.map(d => [d.ci, d.nombres]));
    
            const tableBody = document.getElementById('ciclos-table-body');
            tableBody.innerHTML = '';
    
            ciclos.forEach(ciclo => {
                const nombreAsignatura = asignaturaMap.get(Number(ciclo.id_asig_per)) || ciclo.id_asig_per;
                const nombreDocente = docenteMap.get(ciclo.ci_doc_per) || ciclo.ci_doc_per;
    
                const row = document.createElement('tr');
                row.className = 'fade-in';
                row.innerHTML = `
                    <td>${ciclo.id_ciclo}</td>
                    <td>${ciclo.nom_ciclo}</td>
                    <td>${nombreAsignatura}</td>
                    <td>${nombreDocente}</td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-action btn-editar" data-id="${ciclo.id_ciclo}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-action btn-eliminar" data-id="${ciclo.id_ciclo}">Eliminar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('error', 'Error', 'No se pudieron cargar los ciclos');
        });
    }
    
    
    function setupCicloEvents() {
        // Nuevo ciclo
        document.getElementById('btnNuevoCiclo')?.addEventListener('click', () => {
            showCicloForm();
        });
        
        // Delegación de eventos para editar/eliminar
        document.getElementById('ciclos-table-body')?.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.getAttribute('data-id');
            
            if (target.classList.contains('btn-editar')) {
                fetch(`${API_BASE_URL}/ciclos/${id}`)
                    .then(response => response.json())
                    .then(ciclo => {
                        showCicloForm(ciclo);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo cargar el ciclo');
                    });
            } else if (target.classList.contains('btn-eliminar')) {
                confirmAction('¿Eliminar este ciclo?', () => {
                    fetch(`${API_BASE_URL}/ciclos/${id}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            showAlert('success', 'Éxito', 'Ciclo eliminado');
                            loadCiclos();
                        } else {
                            throw new Error('Error al eliminar');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo eliminar el ciclo');
                    });
                });
            }
        });
    }
    
    function showCicloForm(ciclo = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
    
        const isEdit = ciclo !== null;
        modalTitle.textContent = isEdit ? 'Editar Ciclo' : 'Nuevo Ciclo';
    
        // Obtener datos necesarios
        Promise.all([
            fetch(`${API_BASE_URL}/asignaturas`).then(res => res.json()),
            fetch(`${API_BASE_URL}/docentes`).then(res => res.json())
        ])
        .then(([asignaturas, docentes]) => {
            // Construir <option> para asignaturas
            const asignaturaOptions = asignaturas.map(a => `
                <option value="${a.id_asignatura}" ${isEdit && a.id_asignatura == ciclo?.id_asig_per ? 'selected' : ''}>
                    ${a.nombre_asignatura}
                </option>
            `).join('');
    
            // Construir <option> para docentes
            const docenteOptions = docentes.map(d => `
                <option value="${d.ci}" ${isEdit && d.ci == ciclo?.ci_doc_per ? 'selected' : ''}>
                    ${d.nombres}
                </option>
            `).join('');
    
            modalBody.innerHTML = `
                <form id="cicloForm">
                    ${isEdit ? `<input type="hidden" id="id_ciclo" value="${ciclo.id_ciclo}">` : ''}
                    <div class="mb-3">
                        <label for="nom_ciclo" class="form-label">Ciclo</label>
                        <input type="text" class="form-control" id="nom_ciclo" value="${isEdit ? ciclo.nom_ciclo : ''}" required>
                    </div>
                    <div class="mb-3">
                        <label for="id_asig_per" class="form-label">Asignatura</label>
                        <select class="form-select" id="id_asig_per" required>
                            <option value="">Seleccione una asignatura</option>
                            ${asignaturaOptions}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="ci_doc_per" class="form-label">Docente</label>
                        <select class="form-select" id="ci_doc_per" required>
                            <option value="">Seleccione un docente</option>
                            ${docenteOptions}
                        </select>
                    </div>
                </form>
            `;
    
            document.getElementById('modalSaveBtn').onclick = () => {
                const formData = {
                    nom_ciclo: document.getElementById('nom_ciclo').value,
                    id_asig_per: document.getElementById('id_asig_per').value,
                    ci_doc_per: document.getElementById('ci_doc_per').value
                };
    
                const url = isEdit ? `${API_BASE_URL}/ciclos/${ciclo.id_ciclo}` : `${API_BASE_URL}/ciclos`;
                const method = isEdit ? 'PUT' : 'POST';
    
                fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                .then(response => {
                    if (response.ok) {
                        showAlert('success', 'Éxito', isEdit ? 'Ciclo actualizado' : 'Ciclo creado');
                        modal.hide();
                        loadCiclos();
                    } else {
                        throw new Error('Error en la operación');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('error', 'Error', isEdit ? 'No se pudo actualizar el ciclo' : 'No se pudo crear el ciclo');
                });
            };
    
            modal.show();
        })
        .catch(error => {
            console.error('Error cargando datos para el formulario:', error);
            showAlert('error', 'Error', 'No se pudieron cargar asignaturas o docentes');
        });
    }
    
    
    // ========== ASIGNATURAS ==========
    function loadAsignaturas() {
        fetch(`${API_BASE_URL}/asignaturas`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('asignaturas-table-body');
                tableBody.innerHTML = '';
                
                data.forEach(asignatura => {
                    const row = document.createElement('tr');
                    row.className = 'fade-in';
                    row.innerHTML = `
                        <td>${asignatura.id_asignatura}</td>
                        <td>${asignatura.nombre_asignatura}</td>
                        <td>${asignatura.nivel}</td>
                        <td>
                            <button class="btn btn-primary btn-sm btn-action btn-editar" data-id="${asignatura.id_asignatura}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-action btn-eliminar" data-id="${asignatura.id_asignatura}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'Error', 'No se pudieron cargar las asignaturas');
            });
    }
    
    function setupAsignaturaEvents() {
        // Nueva asignatura
        document.getElementById('btnNuevaAsignatura')?.addEventListener('click', () => {
            showAsignaturaForm();
        });
        
        // Delegación de eventos para editar/eliminar
        document.getElementById('asignaturas-table-body')?.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.getAttribute('data-id');
            
            if (target.classList.contains('btn-editar')) {
                fetch(`${API_BASE_URL}/asignaturas/${id}`)
                    .then(response => response.json())
                    .then(asignatura => {
                        showAsignaturaForm(asignatura);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo cargar la asignatura');
                    });
            } else if (target.classList.contains('btn-eliminar')) {
                confirmAction('¿Eliminar esta asignatura?', () => {
                    fetch(`${API_BASE_URL}/asignaturas/${id}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            showAlert('success', 'Éxito', 'Asignatura eliminada');
                            loadAsignaturas();
                        } else {
                            throw new Error('Error al eliminar');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo eliminar la asignatura');
                    });
                });
            }
        });
    }
    
    function showAsignaturaForm(asignatura = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        const isEdit = asignatura !== null;
        
        modalTitle.textContent = isEdit ? 'Editar Asignatura' : 'Nueva Asignatura';
        
        modalBody.innerHTML = `
            <form id="asignaturaForm">
                ${isEdit ? `<input type="hidden" id="id_asignatura" value="${asignatura.id_asignatura}">` : ''}
                <div class="mb-3">
                    <label for="nombre_asignatura" class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="nombre_asignatura" value="${isEdit ? asignatura.nombre_asignatura : ''}" required>
                </div>
                <div class="mb-3">
                    <label for="nivel" class="form-label">Nivel</label>
                    <input type="number" class="form-control" id="nivel" value="${isEdit ? asignatura.nivel : ''}" required>
                </div>
            </form>
        `;
        
        document.getElementById('modalSaveBtn').onclick = () => {
            const formData = {
                nombre_asignatura: document.getElementById('nombre_asignatura').value,
                nivel: document.getElementById('nivel').value
            };
            
            const url = isEdit ? `${API_BASE_URL}/asignaturas/${asignatura.id_asignatura}` : `${API_BASE_URL}/asignaturas`;
            const method = isEdit ? 'PUT' : 'POST';
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) {
                    showAlert('success', 'Éxito', isEdit ? 'Asignatura actualizada' : 'Asignatura creada');
                    modal.hide();
                    loadAsignaturas();
                } else {
                    throw new Error('Error en la operación');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'Error', isEdit ? 'No se pudo actualizar la asignatura' : 'No se pudo crear la asignatura');
            });
        };
        
        modal.show();
    }
    
    // ========== DOCENTES ==========
    function loadDocentes() {
        fetch(`${API_BASE_URL}/docentes`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('docentes-table-body');
                tableBody.innerHTML = '';
                
                data.forEach(docente => {
                    const row = document.createElement('tr');
                    row.className = 'fade-in';
                    row.innerHTML = `
                        <td>${docente.ci}</td>
                        <td>${docente.nombres}</td>
                        <td>
                            <button class="btn btn-primary btn-sm btn-action btn-editar" data-id="${docente.ci}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-action btn-eliminar" data-id="${docente.ci}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'Error', 'No se pudieron cargar los docentes');
            });
    }
    
    function setupDocenteEvents() {
        // Nuevo docente
        document.getElementById('btnNuevoDocente')?.addEventListener('click', () => {
            showDocenteForm();
        });
        
        // Delegación de eventos para editar/eliminar
        document.getElementById('docentes-table-body')?.addEventListener('click', (e) => {
            const target = e.target;
            const ci = target.getAttribute('data-id');
            
            if (target.classList.contains('btn-editar')) {
                fetch(`${API_BASE_URL}/docentes/${ci}`)
                    .then(response => response.json())
                    .then(docente => {
                        showDocenteForm(docente);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo cargar el docente');
                    });
            } else if (target.classList.contains('btn-eliminar')) {
                confirmAction('¿Eliminar este docente?', () => {
                    fetch(`${API_BASE_URL}/docentes/${ci}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            showAlert('success', 'Éxito', 'Docente eliminado');
                            loadDocentes();
                        } else {
                            throw new Error('Error al eliminar');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'No se pudo eliminar el docente');
                    });
                });
            }
        });
    }
    
    function showDocenteForm(docente = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        const isEdit = docente !== null;
        
        modalTitle.textContent = isEdit ? 'Editar Docente' : 'Nuevo Docente';
        
        modalBody.innerHTML = `
            <form id="docenteForm">
                <div class="mb-3">
                    <label for="ci" class="form-label">Cédula de Identidad</label>
                    <input type="number" class="form-control" id="ci" ${isEdit ? 'readonly' : ''} maxlength="10" required>
                </div>
                <div class="mb-3">
                    <label for="nombres" class="form-label">Nombres</label>
                    <input type="text" class="form-control" id="nombres" required>
                </div>
            </form>
        `;
        
        if (isEdit) {
            document.getElementById('ci').value = docente.ci;
            document.getElementById('nombres').value = docente.nombres;
        }

        // Validación para que solo se ingresen números y máximo 10
        const ciInput = document.getElementById('ci');
        ciInput.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
        
        document.getElementById('modalSaveBtn').onclick = () => {
            const ci = document.getElementById('ci').value.trim();
            const nombres = document.getElementById('nombres').value.trim();
    
            if (!/^\d{10}$/.test(ci)) {
                showAlert('warning', 'Cédula inválida', 'Debe tener exactamente 10 números sin letras ni signos.');
                return;
            }
    
            const formData = {
                ci: ci,
                nombres: nombres
            };
            
            const url = isEdit ? `${API_BASE_URL}/docentes/${docente.ci}` : `${API_BASE_URL}/docentes`;
            const method = isEdit ? 'PUT' : 'POST';
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) {
                    showAlert('success', 'Éxito', isEdit ? 'Docente actualizado' : 'Docente creado');
                    modal.hide();
                    loadDocentes();
                } else {
                    throw new Error('Error en la operación');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('error', 'Error', isEdit ? 'No se pudo actualizar el docente' : 'No se pudo crear el docente');
            });
        };
        
        modal.show();
    }
});