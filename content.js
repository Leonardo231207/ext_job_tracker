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

  switch (portal) {
    case 'indeed':
      var el = document.querySelector('[data-company-name]') ||
               document.querySelector('div[class*="company"]') ||
               document.querySelector('a[class*="company"]')
      return el ? el.textContent.trim() : ''

    case 'computrabajo':
      var el = document.querySelector('h1[class*="company"]') ||
               document.querySelector('.company-header') ||
               document.querySelector('[class*="empresa"]')
      return el ? el.textContent.trim() : ''

    case 'bumeran':
      var el = document.querySelector('[class*="company"]') ||
               document.querySelector('[class*="empresa"]') ||
               document.querySelector('[data-testid*="company"]')
      return el ? el.textContent.trim() : ''

    case 'zonajobs':
      var el = document.querySelector('[class*="company"]') ||
               document.querySelector('[class*="empresa"]') ||
               document.querySelector('.empresa')
      return el ? el.textContent.trim() : ''

    case 'linkedin':
      var el = document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
               document.querySelector('a[class*="company"]') ||
               document.querySelector('[class*="org-top-card"]')
      return el ? el.textContent.trim() : ''
      
    case 'empleosit':
      var el = document.querySelector('[class*="company"]') ||
               document.querySelector('[class*="empresa"]') ||
               document.querySelector('.panel-body h2')
      return el ? el.textContent.trim() : ''

    default:
      return ''
  }
}

function ejecutar() {
  var portal = detectarPortal()
  var empresa = extraerEmpresa()
  var url = window.location.href

  var datos = {
    portal: portal,
    empresa: empresa,
    url: url,
    timestamp: Date.now()
  }

  chrome.storage.local.set({ _captured: datos })
}

ejecutar()

document.addEventListener('popstate', ejecutar)
