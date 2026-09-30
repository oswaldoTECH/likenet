# fix.py — elimina optional chaining (?.)
import io, sys

with io.open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # (buscar, reemplazar)
    ("currentUser.nodosAsignados?.length",
     "currentUser.nodosAsignados && currentUser.nodosAsignados.length"),

    ("role = c?.value;",
     "role = c ? c.value : undefined;"),

    ("const on = me?.onShift || false;",
     "const on = !!(me && me.onShift);"),

    ("$('confirmSector')?.value || ''",
     "($('confirmSector') ? $('confirmSector').value : '') || ''"),

    ("mySquad?.sector || me.area || '—'",
     "(mySquad ? mySquad.sector : '') || me.area || '—'"),

    ("mySquad?.sector || 'Sin asignar'",
     "(mySquad ? mySquad.sector : '') || 'Sin asignar'"),

    ("mySquad?.sector || me.area",
     "(mySquad ? mySquad.sector : '') || me.area"),

    ("cuadrillaOrigenId:mySquad?.id||null",
     "cuadrillaOrigenId: mySquad ? mySquad.id : null"),

    ("cuadrillaOrigenNombre:mySquad?.name||'—'",
     "cuadrillaOrigenNombre: mySquad ? mySquad.name : '—'"),

    ("$('mapFilterSector')?.value || 'ALL'",
     "($('mapFilterSector') ? $('mapFilterSector').value : 'ALL') || 'ALL'"),

    ("req.result?.blob || null",
     "(req.result && req.result.blob) ? req.result.blob : null"),

    ("document.getElementById('installAppBtn')?.remove();",
     "var _b = document.getElementById('installAppBtn'); if (_b) _b.remove();"),
]

faltantes = []
for old, new in replacements:
    if old not in content:
        faltantes.append(old)
    content = content.replace(old, new)

with io.open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

if faltantes:
    print("⚠️  No encontrados (revisa que ya no estén aplicados):")
    for x in faltantes: print("   -", x)
else:
    print("✅ Todos los reemplazos aplicados")

# Verificación final
if '?.' in content:
    print("⚠️  Aún quedan '?.' en el archivo — revisa manualmente")
    # Muestra las líneas
    for i, line in enumerate(content.split('\n'), 1):
        if '?.' in line:
            print(f"   Línea {i}: {line.strip()[:100]}")
else:
    print("✅ Archivo limpio de optional chaining")