/*
 * Boekingswidget: het lesrooster van een sportschool op de eigen website.
 *
 * Plak op de pagina waar het rooster moet komen:
 *   <script src="https://<ons-domein>/widget/aiyourgym-widget.js" data-sportschool="<slug>" data-vestiging="<vestiging>" async></script>
 * Optioneel data-doel="<id van een element>" om het rooster in dat element te zetten.
 *
 * Het script plaatst een iframe en past de hoogte aan op berichten uit dat
 * iframe. Alleen berichten van onze eigen origin en uit precies dit iframe
 * tellen; al het andere wordt genegeerd.
 */
(function () {
  'use strict'

  var SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/
  var VESTIGING = /^[a-z0-9][a-z0-9_-]{1,59}$/
  var BERICHT = 'ayg-widget-hoogte'

  function plaats(script) {
    if (!script || script.getAttribute('data-ayg-klaar') === '1') return
    script.setAttribute('data-ayg-klaar', '1')
    var sportschool = (script.getAttribute('data-sportschool') || '').toLowerCase()
    var vestiging = (script.getAttribute('data-vestiging') || '').toLowerCase()
    if (!SLUG.test(sportschool) || !VESTIGING.test(vestiging)) {
      if (window.console) window.console.warn('Boekingswidget: controleer data-sportschool en data-vestiging.')
      return
    }
    var bron
    try {
      bron = new URL(script.src)
    } catch {
      return
    }
    var origin = bron.origin
    var iframe = document.createElement('iframe')
    iframe.src = origin + '/widget/' + encodeURIComponent(sportschool) + '/' + encodeURIComponent(vestiging) + '/rooster'
    iframe.title = 'Lesrooster en proefles aanvragen'
    iframe.loading = 'lazy'
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    iframe.style.cssText = 'display:block;width:100%;max-width:100%;height:640px;border:0;background:transparent;color-scheme:normal;'

    window.addEventListener('message', function (e) {
      if (e.origin !== origin || e.source !== iframe.contentWindow) return
      var d = e.data
      if (!d || typeof d !== 'object' || d.type !== BERICHT) return
      var hoogte = Number(d.hoogte)
      if (!isFinite(hoogte) || hoogte < 120 || hoogte > 12000) return
      iframe.style.height = Math.ceil(hoogte) + 'px'
    })

    var doelId = script.getAttribute('data-doel')
    function zet() {
      var doel = doelId ? document.getElementById(doelId) : null
      if (doel) doel.appendChild(iframe)
      else if (script.parentNode && script.parentNode !== document.head) script.parentNode.insertBefore(iframe, script.nextSibling)
      else if (document.body) document.body.appendChild(iframe)
    }
    if (doelId && !document.getElementById(doelId) && document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zet)
    else zet()
  }

  plaats(document.currentScript)
  // Vangnet: meerdere widgets op een pagina, of een omgeving zonder currentScript.
  var alle = document.querySelectorAll('script[data-sportschool][src*="aiyourgym-widget.js"]')
  for (var i = 0; i < alle.length; i++) plaats(alle[i])
})()
