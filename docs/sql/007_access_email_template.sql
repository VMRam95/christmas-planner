-- Apply only to the existing shared email-service database; no SMTP secrets here.
INSERT INTO email_admin.templates (name,slug,subject,html,description,variables,category,project_id,is_active,owner_id,created_by,updated_by)
SELECT 'Crear o recuperar contraseña','password-recovery','Tu acceso a Christmas Planner', $access_email$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#253d34">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5ef;padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e4d9;border-radius:16px">
<tr><td style="padding:28px;background:#1e483b;color:#fff"><p style="margin:0;font-size:20px;font-weight:700">✦ Christmas Planner</p></td></tr>
<tr><td style="padding:32px"><h1 style="margin:0 0 20px;font-size:27px;line-height:1.3">Tu carta sigue aquí.</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6">Has solicitado crear o recuperar tu contraseña. Pulsa el botón para elegirla y volver a preparar la Navidad con tu familia.</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:#245c49;border-radius:10px"><a href="{{recoveryUrl}}" style="display:inline-block;padding:15px 24px;color:#fff;font-size:16px;font-weight:600;text-decoration:none">Elegir mi contraseña</a></td></tr></table>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6"><strong>Tu perfil, tu carta y tus regalos se conservan.</strong> Este enlace es privado, temporal y de un solo uso.</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#637268">Si no has solicitado este acceso, puedes ignorar el correo. Tu contraseña no cambia hasta que elijas una nueva.</p></td></tr>
<tr><td style="padding:22px 32px;border-top:1px solid #e8e4d9;color:#637268;font-size:13px">Hecho para compartir la ilusión en familia.</td></tr>
</table></td></tr></table></body></html>
$access_email$,
'Enlace privado nativo Supabase para recuperar o activar el acceso familiar',
'[{"name":"recoveryUrl","required":true}]'::jsonb,
'christmas-planner',p.id,true,p.created_by,p.created_by,p.created_by
FROM email_admin.projects p WHERE p.slug='christmas-planner'
ON CONFLICT (category,slug) DO NOTHING;

UPDATE email_admin.templates
SET html = replace(html, 'Solo tienes que introducir tu email para entrar, ¡sin contraseña!', 'Si es tu primer acceso, pulsa Crear o recuperar contraseña y usa tu email autorizado para elegirla. Tu carta y tus regalos se conservan.'),
updated_at = now()
WHERE category = 'christmas-planner' AND slug = 'invitation';
