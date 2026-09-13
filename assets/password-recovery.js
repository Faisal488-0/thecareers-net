/* TheCareers — branded forgot/reset password flow.
   Keeps Supabase behind the scenes and never exposes provider branding in UI. */
(() => {
  'use strict';
  if (window.__TC_PASSWORD_RECOVERY__) return;
  window.__TC_PASSWORD_RECOVERY__ = true;

  const cfg = window.THECAREERS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/$/, '');
  const apiKey = cfg.SUPABASE_PUBLISHABLE_KEY || '';
  const redirectUrl = cfg.AUTH_REDIRECT_URL || `${location.origin}/`;
  const SESSION_KEY = 'thecareers_auth_session_v1';

  const style = document.createElement('style');
  style.id = 'tc-password-recovery-style';
  style.textContent = `
    .tc-forgot-wrap{display:flex;justify-content:flex-end;margin-top:-3px}
    .tc-forgot-password{border:0;background:transparent;color:#2f6feb;padding:0;font-size:10.5px;font-weight:800;cursor:pointer}
    .tc-forgot-password:hover{text-decoration:underline;text-underline-offset:3px}
    .tc-forgot-password:focus-visible,.tc-pw-btn:focus-visible,.tc-pw-input:focus-visible{outline:2px solid #2f6feb;outline-offset:3px}
    .tc-pw-backdrop{position:fixed;inset:0;z-index:10030;display:grid;place-items:center;padding:20px;background:rgba(18,22,28,.34);backdrop-filter:blur(4px)}
    .tc-pw-card{width:min(460px,94vw);background:#fff;border:1px solid #dfe5ec;border-radius:18px;box-shadow:0 24px 70px rgba(23,32,44,.24);padding:24px;position:relative;color:#15191f}
    .tc-pw-close{position:absolute;right:14px;top:14px;width:34px;height:34px;border:1px solid #dfe5ec;border-radius:9px;background:#fff;cursor:pointer;font-size:18px}
    .tc-pw-brand{display:inline-flex;align-items:center;gap:8px;margin-bottom:12px;color:#1f7650;font:800 10px/1 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase}
    .tc-pw-brand::before{content:"";width:8px;height:8px;border-radius:50%;background:#1fb567;box-shadow:0 0 0 4px rgba(31,181,103,.11)}
    .tc-pw-card h3{margin:0 0 7px;font-size:20px;letter-spacing:-.025em}.tc-pw-card p{margin:0 0 16px;color:#68717d;font-size:11.5px;line-height:1.65}
    .tc-pw-form{display:grid;gap:10px}.tc-pw-label{font-size:10.5px;font-weight:800;color:#424b57}.tc-pw-input{width:100%;box-sizing:border-box;border:1px solid #d7dee7;border-radius:10px;padding:11px 12px;font:inherit;background:#fff}
    .tc-pw-btn{min-height:44px;border:1px solid #101318;border-radius:11px;background:#101318;color:#fff;font-weight:850;cursor:pointer}.tc-pw-btn:disabled{opacity:.55;cursor:wait}
    .tc-pw-note{padding:10px 12px;border:1px solid #dfe6ee;background:#f8fafc;border-radius:10px;color:#56606d;font-size:10.5px;line-height:1.55}.tc-pw-note.ok{border-color:#ccebd9;background:#f5fcf8;color:#277248}.tc-pw-note.err{border-color:#f2d4d4;background:#fff8f8;color:#9e3737}
    .tc-pw-security{margin-top:12px;color:#89929d;font-size:9.5px;line-height:1.5}
  `;
  document.head.appendChild(style);

  function parseJsonSafe(text){ try{return text?JSON.parse(text):null}catch{return null} }
  function closeOwn(){ document.querySelector('.tc-pw-backdrop')?.remove(); }
  function cleanAuthUrl(){
    const clean = `${location.pathname}${location.search}`;
    history.replaceState(null, '', clean || '/');
  }

  function openCard(title, copy, bodyHtml){
    closeOwn();
    const back=document.createElement('div');
    back.className='tc-pw-backdrop';
    back.innerHTML=`<section class="tc-pw-card" role="dialog" aria-modal="true" aria-label="${title.replace(/"/g,'&quot;')}"><button class="tc-pw-close" type="button" aria-label="Close">×</button><div class="tc-pw-brand">TheCareers Secure Account</div><h3>${title}</h3><p>${copy}</p>${bodyHtml}</section>`;
    back.querySelector('.tc-pw-close')?.addEventListener('click',closeOwn);
    back.addEventListener('click',e=>{if(e.target===back)closeOwn();});
    document.body.appendChild(back);
    return back;
  }

  async function requestRecovery(email){
    const res=await fetch(`${base}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectUrl)}`,{
      method:'POST',
      headers:{apikey:apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    if(!res.ok){
      const data=parseJsonSafe(await res.text());
      if(res.status===429) throw new Error('Please wait a minute before requesting another reset email.');
      throw new Error(data?.msg||data?.message||'Password reset email could not be sent. Please try again.');
    }
  }

  function showForgot(prefill=''){
    document.querySelector('.tc-modal-backdrop')?.remove();
    const card=openCard('Reset your password','Enter the email used for your TheCareers account. We will send a secure reset link.',`<form class="tc-pw-form" id="tcPwForgotForm"><label class="tc-pw-label" for="tcPwEmail">Email</label><input class="tc-pw-input" id="tcPwEmail" type="email" autocomplete="email" required value="${String(prefill||'').replace(/[&<>"']/g,'')}"><button class="tc-pw-btn" type="submit">Send reset link</button><div class="tc-pw-note">For privacy, the confirmation message is the same whether or not an account exists.</div></form><div class="tc-pw-security">The reset link returns only to thecareers.net.</div>`);
    const form=card.querySelector('#tcPwForgotForm');
    const note=card.querySelector('.tc-pw-note');
    form?.addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=form.querySelector('.tc-pw-btn');
      const email=card.querySelector('#tcPwEmail')?.value.trim();
      if(!email)return;
      btn.disabled=true;btn.textContent='Sending…';
      try{
        await requestRecovery(email);
        note.className='tc-pw-note ok';
        note.textContent='If this email belongs to a TheCareers account, a password reset link has been sent. Check your inbox and spam folder.';
        btn.textContent='Email sent';
      }catch(err){
        note.className='tc-pw-note err';note.textContent=err.message||'Could not send the reset email.';
        btn.disabled=false;btn.textContent='Send reset link';
      }
    });
    setTimeout(()=>card.querySelector('#tcPwEmail')?.focus(),50);
  }

  async function updatePassword(accessToken,password){
    const res=await fetch(`${base}/auth/v1/user`,{
      method:'PUT',
      headers:{apikey:apiKey,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
      body:JSON.stringify({password})
    });
    const text=await res.text();
    const data=parseJsonSafe(text);
    if(!res.ok) throw new Error(data?.msg||data?.message||'Could not update your password.');
    return data;
  }

  function showNewPassword(tokens){
    const card=openCard('Choose a new password','Create a new password for your TheCareers account.',`<form class="tc-pw-form" id="tcPwNewForm"><label class="tc-pw-label" for="tcPwNew">New password</label><input class="tc-pw-input" id="tcPwNew" type="password" minlength="8" autocomplete="new-password" required><label class="tc-pw-label" for="tcPwConfirm">Confirm password</label><input class="tc-pw-input" id="tcPwConfirm" type="password" minlength="8" autocomplete="new-password" required><button class="tc-pw-btn" type="submit">Update password</button><div class="tc-pw-note">Use at least 8 characters.</div></form>`);
    const form=card.querySelector('#tcPwNewForm');
    const note=card.querySelector('.tc-pw-note');
    form?.addEventListener('submit',async e=>{
      e.preventDefault();
      const p1=card.querySelector('#tcPwNew')?.value||'';
      const p2=card.querySelector('#tcPwConfirm')?.value||'';
      const btn=form.querySelector('.tc-pw-btn');
      if(p1.length<8){note.className='tc-pw-note err';note.textContent='Password must be at least 8 characters.';return;}
      if(p1!==p2){note.className='tc-pw-note err';note.textContent='Passwords do not match.';return;}
      btn.disabled=true;btn.textContent='Updating…';
      try{
        await updatePassword(tokens.access_token,p1);
        const session={access_token:tokens.access_token,refresh_token:tokens.refresh_token||'',token_type:tokens.token_type||'bearer',expires_in:Number(tokens.expires_in||3600),expires_at:Math.floor(Date.now()/1000)+Number(tokens.expires_in||3600)};
        localStorage.setItem(SESSION_KEY,JSON.stringify(session));
        cleanAuthUrl();
        note.className='tc-pw-note ok';note.textContent='Password updated successfully. Your TheCareers account is ready.';
        btn.textContent='Password updated';
        try{await window.TheCareersAuth?.refresh?.()}catch{}
        window.setTimeout(()=>{closeOwn();location.reload();},900);
      }catch(err){
        note.className='tc-pw-note err';note.textContent=err.message||'Could not update your password.';
        btn.disabled=false;btn.textContent='Update password';
      }
    });
    setTimeout(()=>card.querySelector('#tcPwNew')?.focus(),50);
  }

  function injectForgot(){
    const form=document.querySelector('#tcAuthForm');
    if(!form || form.querySelector('.tc-forgot-wrap')) return;
    const heading=form.closest('.tc-modal')?.querySelector('h3')?.textContent?.trim().toLowerCase();
    if(heading!=='sign in') return;
    const pass=form.querySelector('#tcPassword');
    if(!pass)return;
    const wrap=document.createElement('div');
    wrap.className='tc-forgot-wrap';
    wrap.innerHTML='<button type="button" class="tc-forgot-password">Forgot password?</button>';
    pass.insertAdjacentElement('afterend',wrap);
    wrap.querySelector('button')?.addEventListener('click',()=>showForgot(form.querySelector('#tcEmail')?.value||''));
  }

  function readRecoveryTokens(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,''));
    const search=new URLSearchParams(location.search);
    const type=hash.get('type')||search.get('type');
    const access_token=hash.get('access_token')||search.get('access_token');
    if(type!=='recovery'||!access_token)return null;
    return {access_token,refresh_token:hash.get('refresh_token')||search.get('refresh_token')||'',token_type:hash.get('token_type')||'bearer',expires_in:hash.get('expires_in')||'3600'};
  }

  function boot(){
    const tokens=readRecoveryTokens();
    if(tokens){setTimeout(()=>showNewPassword(tokens),50);return;}
    injectForgot();
    const observer=new MutationObserver(()=>injectForgot());
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
