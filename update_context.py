# Update Especificacion_React_Web_MVP_Sistema_Compras_Verduleria.md
path1 = 'context/Especificacion_React_Web_MVP_Sistema_Compras_Verduleria.md'
with open(path1, 'r', encoding='utf-8') as f:
    text1 = f.read()

text1 = text1.replace(
    \"compradorAsignadoNombre?: string | null;\",
    \"compradorAsignadoNombre?: string | null;\\n  encargadoCompra?: string;\"
)
text1 = text1.replace(
    \"- proveedor/lugar;\",
    \"- encargado de compra;\\n- proveedor/lugar;\"
)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(text1)

# Update especificacion.txt
path2 = 'context/especificacion.txt'
with open(path2, 'r', encoding='utf-8') as f:
    text2 = f.read()

text2 = text2.replace(
    \"compradorAsignadoId\\nproveedorId\",
    \"compradorAsignadoId\\nencargadoCompra\\nproveedorId\"
)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(text2)

print('Context updated!')
