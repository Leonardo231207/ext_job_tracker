var ESTADOS_MAP = {
  guardado: 'Guardado',
  aplicado: 'Aplicado',
  en_proceso: 'En proceso',
  rechazado: 'Rechazado',
  sin_respuesta: 'Sin respuesta'
}

var PORTALES_MAP = {
  indeed: 'Indeed',
  computrabajo: 'Computrabajo',
  bumeran: 'Bumeran',
  zonajobs: 'ZonaJobs',
  linkedin: 'LinkedIn',
  empleosit: 'Empleos IT',
  manual: 'Otro / Manual'
}

var MODALIDADES_MAP = {
  remoto: 'Remoto',
  hibrido: 'Híbrido',
  presencial: 'Presencial'
}

var postulaciones = []
var editandoId = null

function escapeHtml(text) {
  if (!text) return ''
  var d = document.createElement('div')
  d.textContent = text
  return d.innerHTML
}

function escapeAttr(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatearFecha(iso) {
  if (!iso) return ''
  var d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatearFechaCompleta(iso) {
  if (!iso) return ''
  var d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

async function cargarPostulaciones() {
  var result = await chrome.storage.local.get('applications')
  postulaciones = result.applications || []
}

async function guardarTodo() {
  await chrome.storage.local.set({ applications: postulaciones })
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('show')
  editandoId = null
}

function aplicarFiltros() {
  var estado = document.getElementById('filtroEstado').value
  var portal = document.getElementById('filtroPortal').value
  var modalidad = document.getElementById('filtroModalidad').value

  var filtradas = postulaciones.slice()

  if (estado !== 'todos') filtradas = filtradas.filter(function (p) { return p.estado === estado })
  if (portal !== 'todos') filtradas = filtradas.filter(function (p) { return p.portal === portal })
  if (modalidad !== 'todos') filtradas = filtradas.filter(function (p) { return p.modalidad === modalidad })

  renderizarTabla(filtradas)
}

function renderizarTabla(lista) {
  var tbody = document.getElementById('tablaBody')
  var emptyState = document.getElementById('emptyState')
  var resultCount = document.getElementById('resultCount')

  resultCount.textContent = lista.length + ' postulación(es)'

  if (lista.length === 0) {
    tbody.innerHTML = ''
    emptyState.style.display = 'block'
    return
  }

  emptyState.style.display = 'none'

  tbody.innerHTML = lista.map(function (p) {
    var estadoLabel = ESTADOS_MAP[p.estado] || p.estado
    var portalLabel = PORTALES_MAP[p.portal] || p.portal || '—'
    var modalidadLabel = MODALIDADES_MAP[p.modalidad] || p.modalidad || '—'

    return '<tr data-id="' + p.id + '">' +
      '<td><strong>' + escapeHtml(p.empresa) + '</strong></td>' +
      '<td>' + escapeHtml(p.puesto) + '</td>' +
      '<td>' + portalLabel + '</td>' +
      '<td><span class="estado-badge ' + p.estado + '">' + estadoLabel + '</span></td>' +
      '<td>' + (escapeHtml(p.remuneracion) || '—') + '</td>' +
      '<td>' + modalidadLabel + '</td>' +
      '<td>' + formatearFecha(p.fecha_creacion) + '</td>' +
      '<td class="acciones">' +
        '<button class="btn-secondary btn-sm btn-editar" data-id="' + p.id + '">Editar</button> ' +
        '<button class="btn-danger btn-sm btn-eliminar" data-id="' + p.id + '">Eliminar</button>' +
      '</td>' +
    '</tr>'
  }).join('')

  Array.from(document.querySelectorAll('.btn-editar')).forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      abrirDetalle(btn.dataset.id, true)
    })
  })

  Array.from(document.querySelectorAll('.btn-eliminar')).forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      eliminarPost(btn.dataset.id)
    })
  })

  Array.from(tbody.querySelectorAll('tr')).forEach(function (tr) {
    tr.addEventListener('click', function () {
      abrirDetalle(tr.dataset.id, false)
    })
  })
}

async function cargarYRenderizar() {
  await cargarPostulaciones()
  aplicarFiltros()
}

async function eliminarPost(id) {
  if (!confirm('¿Eliminar esta postulación?')) return
  postulaciones = postulaciones.filter(function (p) { return p.id !== id })
  await guardarTodo()
  await cargarYRenderizar()
  cerrarModal()
}

async function actualizarEstadoPost(id, nuevoEstado) {
  var post = postulaciones.find(function (p) { return p.id === id })
  if (!post) return
  post.estado = nuevoEstado
  post.fecha_actualizacion = new Date().toISOString()
  await guardarTodo()
}

async function actualizarPost(id, data) {
  var idx = postulaciones.findIndex(function (p) { return p.id === id })
  if (idx === -1) return
  data.fecha_actualizacion = new Date().toISOString()
  data.fecha_creacion = postulaciones[idx].fecha_creacion
  data.id = id
  postulaciones[idx] = data
  await guardarTodo()
}

function abrirDetalle(id, editMode) {
  var post = postulaciones.find(function (p) { return p.id === id })
  if (!post) return
  editandoId = id

  var overlay = document.getElementById('modalOverlay')
  document.getElementById('modalTitulo').textContent = editMode ? 'Editar postulación' : post.empresa + ' — ' + post.puesto

  if (editMode) {
    renderizarFormularioEdicion(post)
  } else {
    renderizarDetalle(post)
  }

  overlay.classList.add('show')
}

function renderizarDetalle(post) {
  var body = document.getElementById('modalBody')
  body.innerHTML = '' +
    '<div class="detail-grid">' +
      '<div class="detail-field"><label>Empresa</label><div class="value">' + escapeHtml(post.empresa) + '</div></div>' +
      '<div class="detail-field"><label>Puesto</label><div class="value">' + escapeHtml(post.puesto) + '</div></div>' +
      '<div class="detail-field"><label>Portal</label><div class="value">' + (PORTALES_MAP[post.portal] || post.portal || '—') + '</div></div>' +
      '<div class="detail-field"><label>Estado</label><div class="value"><span class="estado-badge ' + post.estado + '">' + (ESTADOS_MAP[post.estado] || post.estado) + '</span></div></div>' +
      '<div class="detail-field"><label>Remuneración</label><div class="value">' + (escapeHtml(post.remuneracion) || '—') + '</div></div>' +
      '<div class="detail-field"><label>Modalidad</label><div class="value">' + (MODALIDADES_MAP[post.modalidad] || post.modalidad || '—') + '</div></div>' +
      '<div class="detail-field"><label>Ubicación</label><div class="value">' + (escapeHtml(post.ubicacion) || '—') + '</div></div>' +
      '<div class="detail-field"><label>Contacto</label><div class="value">' + (escapeHtml(post.contacto) || '—') + '</div></div>' +
      '<div class="detail-field"><label>CV usado</label><div class="value">' + (escapeHtml(post.cv_usado) || '—') + '</div></div>' +
      '<div class="detail-field"><label>Fecha</label><div class="value">' + formatearFechaCompleta(post.fecha_creacion) + '</div></div>' +
      '<div class="detail-field full-width"><label>URL</label><div class="value">' + (post.url ? '<a href="' + escapeAttr(post.url) + '" target="_blank">' + escapeHtml(post.url) + '</a>' : '—') + '</div></div>' +
      '<div class="detail-field full-width"><label>Descripción</label><div class="value">' + (escapeHtml(post.descripcion) || '—') + '</div></div>' +
      '<div class="detail-field full-width"><label>Nota</label><div class="value">' + (escapeHtml(post.nota) || '—') + '</div></div>' +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="btn-secondary" id="detalleVolver">Volver</button>' +
      '<select id="detalleCambioEstado" style="width:auto;">' +
        '<option value="guardado"' + (post.estado === 'guardado' ? ' selected' : '') + '>Guardado</option>' +
        '<option value="aplicado"' + (post.estado === 'aplicado' ? ' selected' : '') + '>Aplicado</option>' +
        '<option value="en_proceso"' + (post.estado === 'en_proceso' ? ' selected' : '') + '>En proceso</option>' +
        '<option value="rechazado"' + (post.estado === 'rechazado' ? ' selected' : '') + '>Rechazado</option>' +
        '<option value="sin_respuesta"' + (post.estado === 'sin_respuesta' ? ' selected' : '') + '>Sin respuesta</option>' +
      '</select>' +
      '<button class="btn-primary" id="detalleEditar">Editar</button>' +
      '<button class="btn-danger" id="detalleEliminar">Eliminar</button>' +
    '</div>'

  document.getElementById('detalleVolver').addEventListener('click', cerrarModal)

  document.getElementById('detalleCambioEstado').addEventListener('change', async function (e) {
    var nuevoEstado = e.target.value
    await actualizarEstadoPost(post.id, nuevoEstado)
    await cargarYRenderizar()
    var updated = postulaciones.find(function (p) { return p.id === post.id })
    if (updated) renderizarDetalle(updated)
  })

  document.getElementById('detalleEditar').addEventListener('click', function () {
    abrirDetalle(post.id, true)
  })

  document.getElementById('detalleEliminar').addEventListener('click', async function () {
    await eliminarPost(post.id)
  })
}

function renderizarFormularioEdicion(post) {
  var body = document.getElementById('modalBody')
  body.innerHTML = '' +
    '<form id="editForm" class="editing-form">' +

      '<div class="form-row">' +
        '<label for="editEmpresa">Empresa *</label>' +
        '<input type="text" id="editEmpresa" value="' + escapeAttr(post.empresa) + '" required>' +
      '</div>' +

      '<div class="form-row">' +
        '<label for="editPuesto">Puesto *</label>' +
        '<input type="text" id="editPuesto" value="' + escapeAttr(post.puesto) + '" required>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="editPortal">Portal</label>' +
          '<select id="editPortal">' +
            '<option value="indeed"' + (post.portal === 'indeed' ? ' selected' : '') + '>Indeed</option>' +
            '<option value="computrabajo"' + (post.portal === 'computrabajo' ? ' selected' : '') + '>Computrabajo</option>' +
            '<option value="bumeran"' + (post.portal === 'bumeran' ? ' selected' : '') + '>Bumeran</option>' +
            '<option value="zonajobs"' + (post.portal === 'zonajobs' ? ' selected' : '') + '>ZonaJobs</option>' +
            '<option value="linkedin"' + (post.portal === 'linkedin' ? ' selected' : '') + '>LinkedIn</option>' +
            '<option value="empleosit"' + (post.portal === 'empleosit' ? ' selected' : '') + '>Empleos IT</option>' +
            '<option value="manual"' + (post.portal === 'manual' ? ' selected' : '') + '>Otro / Manual</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="editRemuneracion">Remuneración</label>' +
          '<input type="text" id="editRemuneracion" value="' + escapeAttr(post.remuneracion) + '">' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<label for="editDescripcion">Descripción</label>' +
        '<textarea id="editDescripcion" rows="3">' + escapeHtml(post.descripcion) + '</textarea>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="editCv">CV usado</label>' +
          '<input type="text" id="editCv" value="' + escapeAttr(post.cv_usado) + '">' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="editModalidad">Modalidad</label>' +
          '<select id="editModalidad">' +
            '<option value="">—</option>' +
            '<option value="remoto"' + (post.modalidad === 'remoto' ? ' selected' : '') + '>Remoto</option>' +
            '<option value="hibrido"' + (post.modalidad === 'hibrido' ? ' selected' : '') + '>Híbrido</option>' +
            '<option value="presencial"' + (post.modalidad === 'presencial' ? ' selected' : '') + '>Presencial</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="editUbicacion">Ubicación</label>' +
          '<input type="text" id="editUbicacion" value="' + escapeAttr(post.ubicacion) + '">' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="editContacto">Contacto</label>' +
          '<input type="text" id="editContacto" value="' + escapeAttr(post.contacto) + '">' +
        '</div>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="editEstado">Estado *</label>' +
          '<select id="editEstado" required>' +
            '<option value="guardado"' + (post.estado === 'guardado' ? ' selected' : '') + '>Guardado</option>' +
            '<option value="aplicado"' + (post.estado === 'aplicado' ? ' selected' : '') + '>Aplicado</option>' +
            '<option value="en_proceso"' + (post.estado === 'en_proceso' ? ' selected' : '') + '>En proceso</option>' +
            '<option value="rechazado"' + (post.estado === 'rechazado' ? ' selected' : '') + '>Rechazado</option>' +
            '<option value="sin_respuesta"' + (post.estado === 'sin_respuesta' ? ' selected' : '') + '>Sin respuesta</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="editUrl">URL</label>' +
          '<input type="url" id="editUrl" value="' + escapeAttr(post.url) + '">' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<label for="editNota">Nota</label>' +
        '<textarea id="editNota" rows="2">' + escapeHtml(post.nota) + '</textarea>' +
      '</div>' +

      '<div class="form-actions">' +
        '<button type="submit" class="btn-primary">Guardar cambios</button>' +
        '<button type="button" class="btn-secondary" id="editCancelar">Cancelar</button>' +
      '</div>' +
    '</form>'

  document.getElementById('editForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    var updatedData = {
      empresa: document.getElementById('editEmpresa').value.trim(),
      puesto: document.getElementById('editPuesto').value.trim(),
      portal: document.getElementById('editPortal').value,
      remuneracion: document.getElementById('editRemuneracion').value.trim(),
      descripcion: document.getElementById('editDescripcion').value.trim(),
      cv_usado: document.getElementById('editCv').value.trim(),
      modalidad: document.getElementById('editModalidad').value,
      ubicacion: document.getElementById('editUbicacion').value.trim(),
      contacto: document.getElementById('editContacto').value.trim(),
      estado: document.getElementById('editEstado').value,
      url: document.getElementById('editUrl').value.trim(),
      nota: document.getElementById('editNota').value.trim()
    }
    await actualizarPost(post.id, updatedData)
    await cargarYRenderizar()
    abrirDetalle(post.id, false)
  })

  document.getElementById('editCancelar').addEventListener('click', function () {
    abrirDetalle(post.id, false)
  })
}

function renderizarFormularioNuevo() {
  var body = document.getElementById('modalBody')
  document.getElementById('modalTitulo').textContent = 'Nueva postulación'
  editandoId = null

  body.innerHTML = '' +
    '<form id="nuevoForm" class="editing-form">' +

      '<div class="form-row">' +
        '<label for="nuevaEmpresa">Empresa *</label>' +
        '<input type="text" id="nuevaEmpresa" required placeholder="Ej: Mercado Libre">' +
      '</div>' +

      '<div class="form-row">' +
        '<label for="nuevoPuesto">Puesto *</label>' +
        '<input type="text" id="nuevoPuesto" required placeholder="Ej: Software Engineer">' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="nuevoPortal">Portal</label>' +
          '<select id="nuevoPortal">' +
            '<option value="indeed">Indeed</option>' +
            '<option value="computrabajo">Computrabajo</option>' +
            '<option value="bumeran">Bumeran</option>' +
            '<option value="zonajobs">ZonaJobs</option>' +
            '<option value="linkedin">LinkedIn</option>' +
            '<option value="empleosit">Empleos IT</option>' +
            '<option value="manual">Otro / Manual</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="nuevaRemuneracion">Remuneración</label>' +
          '<input type="text" id="nuevaRemuneracion" placeholder="Ej: 250k ARS">' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<label for="nuevaDescripcion">Descripción</label>' +
        '<textarea id="nuevaDescripcion" rows="3" placeholder="Copiá la descripción acá..."></textarea>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="nuevoCv">CV usado</label>' +
          '<input type="text" id="nuevoCv" placeholder="Ej: CV_v2.pdf">' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="nuevaModalidad">Modalidad</label>' +
          '<select id="nuevaModalidad">' +
            '<option value="">—</option>' +
            '<option value="remoto">Remoto</option>' +
            '<option value="hibrido">Híbrido</option>' +
            '<option value="presencial">Presencial</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="nuevaUbicacion">Ubicación</label>' +
          '<input type="text" id="nuevaUbicacion" placeholder="Ej: CABA">' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="nuevoContacto">Contacto</label>' +
          '<input type="text" id="nuevoContacto" placeholder="Nombre reclutador">' +
        '</div>' +
      '</div>' +

      '<div class="form-row-inline">' +
        '<div class="form-row">' +
          '<label for="nuevoEstado">Estado *</label>' +
          '<select id="nuevoEstado" required>' +
            '<option value="guardado">Guardado</option>' +
            '<option value="aplicado">Aplicado</option>' +
            '<option value="en_proceso">En proceso</option>' +
            '<option value="rechazado">Rechazado</option>' +
            '<option value="sin_respuesta">Sin respuesta</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="nuevaUrl">URL</label>' +
          '<input type="url" id="nuevaUrl" placeholder="https://...">' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<label for="nuevaNota">Nota</label>' +
        '<textarea id="nuevaNota" rows="2" placeholder="Cualquier comentario adicional..."></textarea>' +
      '</div>' +

      '<div class="form-actions">' +
        '<button type="submit" class="btn-primary">Guardar</button>' +
        '<button type="button" class="btn-secondary" id="nuevoCancelar">Cancelar</button>' +
      '</div>' +
    '</form>'

  document.getElementById('nuevoForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    var data = {
      empresa: document.getElementById('nuevaEmpresa').value.trim(),
      puesto: document.getElementById('nuevoPuesto').value.trim(),
      portal: document.getElementById('nuevoPortal').value,
      remuneracion: document.getElementById('nuevaRemuneracion').value.trim(),
      descripcion: document.getElementById('nuevaDescripcion').value.trim(),
      cv_usado: document.getElementById('nuevoCv').value.trim(),
      modalidad: document.getElementById('nuevaModalidad').value,
      ubicacion: document.getElementById('nuevaUbicacion').value.trim(),
      contacto: document.getElementById('nuevoContacto').value.trim(),
      estado: document.getElementById('nuevoEstado').value,
      url: document.getElementById('nuevaUrl').value.trim(),
      nota: document.getElementById('nuevaNota').value.trim()
    }
    data.id = generarId()
    data.fecha_creacion = new Date().toISOString()
    data.fecha_actualizacion = data.fecha_creacion
    postulaciones.unshift(data)
    await guardarTodo()
    await cargarYRenderizar()
    cerrarModal()
  })

  document.getElementById('nuevoCancelar').addEventListener('click', cerrarModal)
}

function exportarCSV() {
  if (postulaciones.length === 0) {
    alert('No hay postulaciones para exportar')
    return
  }

  var headers = ['Empresa', 'Puesto', 'Portal', 'Estado', 'Remuneración', 'Modalidad', 'Ubicación', 'Contacto', 'CV usado', 'URL', 'Descripción', 'Nota', 'Fecha creación', 'Fecha actualización']
  var lines = postulaciones.map(function (p) {
    return [
      p.empresa || '',
      p.puesto || '',
      PORTALES_MAP[p.portal] || p.portal || '',
      ESTADOS_MAP[p.estado] || p.estado || '',
      p.remuneracion || '',
      MODALIDADES_MAP[p.modalidad] || p.modalidad || '',
      p.ubicacion || '',
      p.contacto || '',
      p.cv_usado || '',
      p.url || '',
      (p.descripcion || '').replace(/"/g, '""'),
      (p.nota || '').replace(/"/g, '""'),
      p.fecha_creacion || '',
      p.fecha_actualizacion || ''
    ].map(function (v) { return '"' + v + '"' }).join(',')
  })

  var csv = '\uFEFF' + headers.join(',') + '\n' + lines.join('\n')
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = 'postulaciones_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}

document.addEventListener('DOMContentLoaded', async function () {
  await cargarYRenderizar()

  document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros)
  document.getElementById('filtroPortal').addEventListener('change', aplicarFiltros)
  document.getElementById('filtroModalidad').addEventListener('change', aplicarFiltros)

  document.getElementById('btnNueva').addEventListener('click', function () {
    renderizarFormularioNuevo()
    document.getElementById('modalOverlay').classList.add('show')
  })

  document.getElementById('modalCerrar').addEventListener('click', cerrarModal)

  document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === this) cerrarModal()
  })

  document.getElementById('btnExportar').addEventListener('click', exportarCSV)
})
