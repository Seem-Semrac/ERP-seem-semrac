// ══════════════════════════════════════════════════════════════
// PAGE DE CONNEXION (matricule + code PIN) — ERP Seem Semrac
// Autonome (sans sidebar). POST /api/login → pose le cookie session.
// ══════════════════════════════════════════════════════════════
import { seemLogo } from './shared'

const HEAD = `
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{font-family:'Inter',sans-serif;box-sizing:border-box;}
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#29ABE2 0%,#1577B4 100%);}
  </style>`

export const pageLogin = (next = '/'): string => `<!DOCTYPE html>
<html lang="fr"><head><title>Connexion · ERP Seem Semrac</title>${HEAD}</head>
<body>
  <div style="width:380px;max-width:92%;background:white;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.45);padding:32px 30px;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:7px;margin-bottom:10px;">
      ${seemLogo(56)}
      <div style="font-size:.68rem;color:#64748b;letter-spacing:.03em;font-weight:600;">ERP · Accès sécurisé</div>
    </div>
    <div style="font-size:.78rem;color:#64748b;margin:14px 0 18px;">Identifiez-vous avec votre <strong>matricule</strong> et votre <strong>code PIN</strong>.</div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="display:block;font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Matricule</label>
        <input id="lg-mat" type="text" autocomplete="username" autofocus oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')document.getElementById('lg-pin').focus()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:.6rem .85rem;font-size:.95rem;font-family:monospace;letter-spacing:.04em;background:#f8fafc;outline:none;"/>
      </div>
      <div>
        <label style="display:block;font-size:.68rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Code PIN</label>
        <input id="lg-pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••" onkeydown="if(event.key==='Enter')lgSubmit()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:.6rem .85rem;font-size:1.1rem;text-align:center;letter-spacing:.5rem;background:#f8fafc;outline:none;"/>
      </div>
      <div id="lg-err" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:9px;padding:8px 12px;font-size:.76rem;text-align:center;"></div>
      <button id="lg-btn" onclick="lgSubmit()" style="margin-top:4px;padding:.7rem;border:none;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;font-weight:700;font-size:.9rem;cursor:pointer;box-shadow:0 4px 14px rgba(59,130,246,.35);">
        <i class="fas fa-right-to-bracket" style="margin-right:7px;"></i>Se connecter
      </button>
    </div>
    <div style="margin-top:18px;font-size:.62rem;color:#94a3b8;text-align:center;">En cas de problème d'accès, contactez le service RH / Direction.</div>
  </div>
  <script>
    var LG_NEXT=${JSON.stringify(next || '/').replace(/</g, '\\u003c')};
    function lgErr(m){ var e=document.getElementById('lg-err'); e.textContent=m; e.style.display='block'; }
    function lgSubmit(){
      var mat=(document.getElementById('lg-mat').value||'').trim();
      var pin=(document.getElementById('lg-pin').value||'').trim();
      if(!mat||!pin){ lgErr('Matricule et code PIN requis.'); return; }
      var btn=document.getElementById('lg-btn'); btn.disabled=true; btn.style.opacity='.6';
      fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matricule:mat,pin:pin})})
        .then(function(r){return r.json();})
        .then(function(j){
          if(j&&j.ok){ window.location.href=LG_NEXT||'/'; }
          else { lgErr((j&&j.error)||'Connexion refusée.'); btn.disabled=false; btn.style.opacity='1'; document.getElementById('lg-pin').value=''; document.getElementById('lg-pin').focus(); }
        })
        .catch(function(){ lgErr('Erreur réseau.'); btn.disabled=false; btn.style.opacity='1'; });
    }
  </script>
</body></html>`

export const pageAccesRefuse = (user?: { nom?: string; role?: string }): string => `<!DOCTYPE html>
<html lang="fr"><head><title>Accès refusé · ERP</title>${HEAD}</head>
<body>
  <div style="width:420px;max-width:92%;background:white;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.45);padding:34px 30px;text-align:center;">
    <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 16px;"><i class="fas fa-ban"></i></div>
    <div style="font-weight:800;font-size:1.15rem;color:#0f172a;margin-bottom:8px;">Accès refusé</div>
    <div style="font-size:.82rem;color:#64748b;line-height:1.55;margin-bottom:20px;">Votre profil${user && user.role ? ` (<strong>${user.role}</strong>)` : ''} n'a pas l'autorisation d'accéder à cette section. Rapprochez-vous de la Direction si vous pensez que c'est une erreur.</div>
    <div style="display:flex;gap:10px;justify-content:center;">
      <a href="/" style="padding:.6rem 1.1rem;border-radius:10px;background:#3b82f6;color:white;text-decoration:none;font-weight:700;font-size:.84rem;"><i class="fas fa-house" style="margin-right:6px;"></i>Accueil</a>
      <a href="/logout" style="padding:.6rem 1.1rem;border-radius:10px;background:#f1f5f9;color:#475569;text-decoration:none;font-weight:700;font-size:.84rem;border:1.5px solid #e2e8f0;"><i class="fas fa-right-from-bracket" style="margin-right:6px;"></i>Déconnexion</a>
    </div>
  </div>
</body></html>`
