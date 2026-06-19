function detectarPortal() {
  var host = window.location.hostname.toLowerCase()

  if (host.includes('indeed.com')) return 'indeed'
  if (host.includes('computrabajo')) return 'computrabajo'
  if (host.includes('bumeran')) return 'bumeran'
  if (host.includes('zonajobs')) return 'zonajobs'
  if (host.includes('linkedin')) return 'linkedin'
  if (host.includes('empleosit')) return 'empleosit'

  return 'manual'
}

function extraerEmpresa() {
  var portal = detectarPortal()
  var selectores = []

  switch (portal) {
    case 'indeed':
      selectores = [
        '[data-company-name]',
        'div[class*="company-name"]',
        'a[class*="company"]',
        'div[class*="employer"]',
        '[class*="InlineCompanyRating"]',
        'a[data-tn-element="companyName"]',
        'div[class*="CompanyReview"]'
      ]
      break

    case 'computrabajo':
      selectores = [
        '[class*="CompanyHeader"]',
        '[class*="company"]',
        '[class*="empresa"]',
        '.title-company',
        'h1'
      ]
      break

    case 'bumeran':
      selectores = [
        '[class*="company"]',
        '[class*="empresa"]',
        '[data-testid*="company"]',
        '[class*="CompanyHeader"]',
        'h1'
      ]
      break

    case 'zonajobs':
      selectores = [
        '[class*="company"]',
        '[class*="empresa"]',
        '.empresa',
        'h1'
      ]
      break

    case 'linkedin':
      selectores = [
        '.job-details-jobs-unified-top-card__company-name',
        '.job-card-container__company-name',
        'a[data-anonymize="company-name"]',
        '[class*="org-top-card"]',
        '[class*="artdeco-entity-lockup__title"]',
        '[class*="top-card"] span',
        'a[class*="company"]'
      ]
      break

    case 'empleosit':
      selectores = [
        '[class*="company"]',
        '[class*="empresa"]',
        '[class*="CompanyHeader"]',
        '[class*="employer"]',
        '.panel-body h2',
        'h2'
      ]
      break
  }

  for (var i = 0; i < selectores.length; i++) {
    var el = document.querySelector(selectores[i])
    if (el) {
      var texto = el.textContent.trim()
      if (texto.length > 1 && texto.length < 120) {
        return texto
      }
    }
  }

  return ''
}

function guardarDatos() {
  chrome.storage.local.set({
    _captured: {
      portal: detectarPortal(),
      empresa: extraerEmpresa(),
      url: window.location.href,
      timestamp: Date.now()
    }
  })
}

guardarDatos()
setTimeout(guardarDatos, 1500)
setTimeout(guardarDatos, 4000)
setTimeout(guardarDatos, 8000)
window.addEventListener('popstate', guardarDatos)
