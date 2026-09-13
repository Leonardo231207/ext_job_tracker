var ESTADOS_MAP = {
  guardado: 'Guardado',
  postulado: 'Postulado',
  entrevistado: 'Entrevistado',
  sin_respuesta: 'Sin respuesta',
  rechazado: 'Rechazado'
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

function escapeHtml(text) {
  if (!text) return ''
  var d = document.createElement('div')
  d.textContent = text
  return d.innerHTML
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

async function migrarEstados() {
  var result = await chrome.storage.local.get('applications')
  var apps = result.applications || []
  var modificado = false
  for (var i = 0; i < apps.length; i++) {
    if (apps[i].estado === 'aplicado') {
      apps[i].estado = 'postulado'
      modificado = true
    }
    if (apps[i].estado === 'en_proceso') {
      apps[i].estado = 'entrevistado'
      modificado = true
    }
  }
  if (modificado) {
    await chrome.storage.local.set({ applications: apps })
  }
}