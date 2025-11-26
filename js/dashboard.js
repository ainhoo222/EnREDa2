// dashboard.js - Con estadísticas del usuario
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/index.html';
            return;
        }
        const user = await response.json();
        loadUserData(user);
        loadPersonas();
        setupEventListeners();
    } catch (error) {
        window.location.href = '/index.html';
    }
}

function loadUserData(user) {
    document.getElementById('user-welcome').textContent = `Hola, ${user.nombre}`;
}

function setupEventListeners() {
    document.getElementById('persona-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        if (data.edad) data.edad = parseInt(data.edad, 10);
        if (data.altura) data.altura = parseFloat(data.altura);
        if (data.belleza) data.belleza = parseInt(data.belleza, 10);
        try {
            const response = await fetch('/api/personas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                alert('Persona agregada correctamente');
                hideAddPersonForm();
                loadPersonas();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error al agregar persona');
        }
    });
}

async function loadPersonas() {
    try {
        const response = await fetch('/api/personas');
        if (!response.ok) throw new Error('Error al cargar personas');
        const personas = await response.json();
        displayPersonas(personas);
    } catch (error) {
        document.getElementById('personas-list').innerHTML = '<p class="muted">Error al cargar las personas.</p>';
    }
}

function displayPersonas(personas) {
    const container = document.getElementById('personas-list');
    if (personas.length === 0) {
        container.innerHTML = '<div class="card"><h4>No tienes personas agregadas</h4><p>Usa el botón "Agregar Persona" para comenzar.</p></div>';
        return;
    }
    container.innerHTML = personas.map(persona => `
        <article class="card persona-card" data-persona-id="${persona.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 style="margin: 0;">${persona.nombre}</h4>
                <button class="btn-eliminar" onclick="confirmarEliminarPersona(${persona.id}, '${persona.nombre.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>
            </div>
            <p><strong>Sexo:</strong> ${persona.sexo || 'No especificado'}</p>
            <p><strong>Sexualidad:</strong> ${persona.sexualidad || 'No especificado'}</p>
            <p><strong>Edad:</strong> ${persona.edad || 'No especificada'}</p>
            <p><strong>Belleza:</strong> ${persona.belleza || 'No especificado'}/10</p>
            <p><strong>Residencia:</strong> ${persona.vive || 'No especificada'}</p>
            ${persona.comentario ? `<p><strong>Comentario:</strong> ${persona.comentario}</p>` : ''}
        </article>
    `).join('');
}

async function loadEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas');
        const stats = await response.json();
        displayEstadisticas(stats);
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function displayEstadisticas(stats) {
    const container = document.getElementById('stats-container');
    
    let html = '';
    
    // Mensaje si no hay datos
    if (stats.mensaje) {
        html = `
            <div class="card">
                <h4>Mis Estadísticas</h4>
                <p>${stats.mensaje}</p>
                <p><a href="#" onclick="showSection('personas'); showAddPersonForm()" class="btn">Agregar mi primera persona</a></p>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    // Estadísticas generales
    html += `
        <article class="card">
            <h4>Resumen General</h4>
            <div class="stat-number">${stats.total_personas}</div>
            <p>personas en tu red</p>
        </article>
    `;

    // Promedios
    html += `
        <article class="card">
            <h4>Promedios</h4>
            ${stats.promedio_edad > 0 ? `<p><strong>Edad promedio:</strong> ${stats.promedio_edad} años</p>` : ''}
            ${stats.promedio_belleza > 0 ? `<p><strong>Belleza promedio:</strong> ${stats.promedio_belleza}/10</p>` : ''}
            ${stats.promedio_altura > 0 ? `<p><strong>Altura promedio:</strong> ${stats.promedio_altura} cm</p>` : ''}
        </article>
    `;

    // Distribución por sexo
    if (stats.por_sexo && stats.por_sexo.length > 0) {
        html += `<article class="card"><h4>Distribución por Sexo</h4>`;
        stats.por_sexo.forEach(item => {
            const porcentaje = ((item.count / stats.total_personas) * 100).toFixed(1);
            html += `<p><strong>${item.sexo || 'No especificado'}:</strong> ${item.count} persona${item.count !== 1 ? 's' : ''} (${porcentaje}%)</p>`;
        });
        html += `</article>`;
    }

    // Distribución por sexualidad
    if (stats.por_sexualidad && stats.por_sexualidad.length > 0) {
        html += `<article class="card"><h4>Distribución por Sexualidad</h4>`;
        stats.por_sexualidad.forEach(item => {
            const porcentaje = ((item.count / stats.total_personas) * 100).toFixed(1);
            html += `<p><strong>${item.sexualidad || 'No especificado'}:</strong> ${item.count} persona${item.count !== 1 ? 's' : ''} (${porcentaje}%)</p>`;
        });
        html += `</article>`;
    }

    // Distribución por estudios
    if (stats.por_estudios && stats.por_estudios.length > 0) {
        html += `<article class="card"><h4>Distribución por Estudios</h4>`;
        stats.por_estudios.forEach(item => {
            const porcentaje = ((item.count / stats.total_personas) * 100).toFixed(1);
            html += `<p><strong>${item.estudios || 'No especificado'}:</strong> ${item.count} persona${item.count !== 1 ? 's' : ''} (${porcentaje}%)</p>`;
        });
        html += `</article>`;
    }

    // Distribución por ciudad
    if (stats.por_ciudad && stats.por_ciudad.length > 0) {
        html += `<article class="card"><h4>Distribución por Ciudad</h4>`;
        stats.por_ciudad.forEach(item => {
            const porcentaje = ((item.count / stats.total_personas) * 100).toFixed(1);
            html += `<p><strong>${item.vive || 'No especificado'}:</strong> ${item.count} persona${item.count !== 1 ? 's' : ''} (${porcentaje}%)</p>`;
        });
        html += `</article>`;
    }

    container.innerHTML = html;
}

function showSection(sectionName) {
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionName + '-section').style.display = 'block';
    if (sectionName === 'estadisticas') {
        loadEstadisticas();
    }
}

// Funciones de eliminar (mantener igual)
function confirmarEliminarPersona(personaId, nombrePersona) {
    if (confirm(`¿Estás seguro de que quieres eliminar a "${nombrePersona}"?`)) {
        eliminarPersona(personaId);
    }
}

async function eliminarPersona(personaId) {
    try {
        const response = await fetch(`/api/personas/${personaId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            alert('Persona eliminada correctamente');
            loadPersonas();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        alert('Error al eliminar la persona');
    }
}

function showAddPersonForm() {
    document.getElementById('add-person-form').style.display = 'block';
}

function hideAddPersonForm() {
    document.getElementById('add-person-form').style.display = 'none';
    document.getElementById('persona-form').reset();
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/index.html';
    } catch (error) {
        window.location.href = '/index.html';
    }
}