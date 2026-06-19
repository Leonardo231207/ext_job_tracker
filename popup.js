const ESTADOS_MAP = {
  guardado: 'Guardado',
  aplicado: 'Aplicado',
  en_proceso: 'En proceso',
  rechazado: 'Rechazado',
  sin_respuesta: 'Sin respuesta'
}

const PORTALES_MAP = {
  indeed: 'Indeed',
  computrabajo: 'Computrabajo',
  bumeran: 'Bumeran',
  zonajobs: 'ZonaJobs',
  linkedin: 'LinkedIn',
  empleosit: 'Empleos IT',
  manual: 'Otro / Manual'
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function escapeHtml(text) {
  if (!text) return ''
  var d = document.createElement('div')
  d.textContent = text
  return d.innerHTML
}

function formatearFecha(iso) {
  if (!iso) return ''
  var d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

async function obtenerPostulaciones() {
  var result = await chrome.storage.local.get('applications')
  return result.applications || []
}

async function obtenerDatosCapturados() {
  var result = await chrome.storage.local.get('_captured')
  return result._captured || null
}

async function guardarPostulacion(data) {
  var postulaciones = await obtenerPostulaciones()
  data.id = generarId()
  data.fecha_creacion = new Date().toISOString()
  data.fecha_actualizacion = data.fecha_creacion
  postulaciones.unshift(data)
  await chrome.storage.local.set({ applications: postulaciones })
  return data
}

async function existeEmpresa(empresa, ignorarId) {
  if (!empresa) return false
  var postulaciones = await obtenerPostulaciones()
  return postulaciones.some(function (p) {
    return p.empresa.toLowerCase() === empresa.toLowerCase() && p.id !== ignorarId
  })
}

async function renderRecent() {
  var postulaciones = await obtenerPostulaciones()
  var container = document.getElementById('recentList')
  var top5 = postulaciones.slice(0, 5)

  if (top5.length === 0) {
    container.innerHTML = '<div class="empty-state">Todavía no hay postulaciones</div>'
    return
  }

  container.innerHTML = top5.map(function (p) {
    return '<div class="recent-item">' +
      '<div class="recent-item-info">' +
        '<div class="recent-item-title">' + escapeHtml(p.empresa) + ' — ' + escapeHtml(p.puesto) + '</div>' +
        '<div class="recent-item-sub">' + (PORTALES_MAP[p.portal] || p.portal) + ' · ' + formatearFecha(p.fecha_creacion) + '</div>' +
      '</div>' +
      '<span class="estado-badge ' + p.estado + '">' + (ESTADOS_MAP[p.estado] || p.estado) + '</span>' +
    '</div>'
  }).join('')
}

function limpiarFormulario() {
  document.getElementById('empresa').value = ''
  document.getElementById('puesto').value = ''
  document.getElementById('remuneracion').value = ''
  document.getElementById('descripcion').value = ''
  document.getElementById('cv_usado').value = ''
  document.getElementById('modalidad').value = ''
  document.getElementById('ubicacion').value = ''
  document.getElementById('contacto').value = ''
  document.getElementById('nota').value = ''
  document.getElementById('url').value = ''
  document.getElementById('estado').value = 'guardado'
  document.getElementById('duplicateAlert').classList.remove('show')
}

document.addEventListener('DOMContentLoaded', async function () {
  var captured = await obtenerDatosCapturados()

  if (captured) {
    document.getElementById('detectedPortal').textContent = PORTALES_MAP[captured.portal] || captured.portal || '—'
    document.getElementById('detectedCompany').textContent = captured.empresa || '—'
    document.getElementById('detectedUrl').textContent = captured.url || '—'

    if (captured.empresa) document.getElementById('empresa').value = captured.empresa
    if (captured.portal && captured.portal !== 'manual') document.getElementById('portal').value = captured.portal
    if (captured.url) document.getElementById('url').value = captured.url
  }

  await renderRecent()

  document.getElementById('jobForm').addEventListener('submit', async function (e) {
    e.preventDefault()

    var empresa = document.getElementById('empresa').value.trim()
    var puesto = document.getElementById('puesto').value.trim()
    if (!empresa || !puesto) return

    var duplicado = await existeEmpresa(empresa)
    if (duplicado) {
      document.getElementById('duplicateAlert').classList.add('show')
      return
    }

    var data = {
      empresa: empresa,
      puesto: puesto,
      portal: document.getElementById('portal').value,
      url: document.getElementById('url').value.trim(),
      remuneracion: document.getElementById('remuneracion').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      cv_usado: document.getElementById('cv_usado').value.trim(),
      modalidad: document.getElementById('modalidad').value,
      ubicacion: document.getElementById('ubicacion').value.trim(),
      contacto: document.getElementById('contacto').value.trim(),
      estado: document.getElementById('estado').value,
      nota: document.getElementById('nota').value.trim()
    }

    await guardarPostulacion(data)
    limpiarFormulario()
    await renderRecent()
    await chrome.storage.local.remove('_captured')

    document.getElementById('detectedPortal').textContent = '—'
    document.getElementById('detectedCompany').textContent = '—'
    document.getElementById('detectedUrl').textContent = '—'
  })

  document.getElementById('btnLimpiar').addEventListener('click', function () {
    limpiarFormulario()
    document.getElementById('duplicateAlert').classList.remove('show')
  })

  document.getElementById('btnDashboard').addEventListener('click', function () {
    chrome.tabs.create({ url: 'dashboard.html' })
  })

  document.getElementById('empresa').addEventListener('input', function () {
    document.getElementById('duplicateAlert').classList.remove('show')
  })
})
