import json

json_path = r"c:\Users\Benjamin Gerik\Desktop\paso celulares\productos.json"
js_path = r"c:\Users\Benjamin Gerik\Desktop\paso celulares\productos.js"

# Load current catalog
with open(json_path, "r", encoding="utf-8") as f:
    products = json.load(f)

# Find max ID
max_id = max(p.get("id", 0) for p in products) if products else 0
print(f"Current catalog size: {len(products)} products. Max ID: {max_id}")

# New cell phones list (without ROM/RAM size specs)
new_devices = [
    {
        "nombre": "Motorola Moto G04",
        "marca": "Motorola",
        "categoria": "Celulares",
        "subcategoria": "Motorola",
        "descripcion": "Pantalla IPS de 6.6 pulgadas con tasa de refresco de 90Hz, procesador Unisoc T606, cámara de 16MP con inteligencia artificial y batería de 5000mAh.",
        "imagen": "fotos_productos/moto_g04.webp"
    },
    {
        "nombre": "Nokia 106",
        "marca": "Nokia",
        "categoria": "Celulares",
        "subcategoria": "Nokia",
        "descripcion": "Teléfono celular básico ideal para llamadas y mensajes de texto, pantalla a color de 1.8 pulgadas, batería de larga duración y linterna integrada.",
        "imagen": "fotos_productos/nokia_106.webp"
    },
    {
        "nombre": "Samsung Galaxy A16",
        "marca": "Samsung",
        "categoria": "Celulares",
        "subcategoria": "Samsung",
        "descripcion": "Pantalla Super AMOLED de 6.7 pulgadas con resolución FHD+ a 90Hz, procesador Exynos 1330 (5G) o Helio G99 (4G), cámara triple de 50MP y batería de 5000mAh con carga rápida.",
        "imagen": "fotos_productos/galaxy_a16.jpg"
    },
    {
        "nombre": "Samsung Galaxy A07",
        "marca": "Samsung",
        "categoria": "Celulares",
        "subcategoria": "Samsung",
        "descripcion": "Pantalla HD+ de 6.7 pulgadas a 90Hz, procesador MediaTek Helio G99, cámara dual de 50MP y batería de 5000mAh con soporte para carga rápida de 25W.",
        "imagen": "fotos_productos/galaxy_a07.png"
    },
    {
        "nombre": "Motorola Moto G06",
        "marca": "Motorola",
        "categoria": "Celulares",
        "subcategoria": "Motorola",
        "descripcion": "Pantalla IPS HD+ de 6.88 pulgadas a 120Hz, procesador MediaTek Helio G81 Ultra, cámara principal de 50MP y potente batería para el día a día.",
        "imagen": "fotos_productos/moto_g06.png"
    },
    {
        "nombre": "Motorola Moto G24",
        "marca": "Motorola",
        "categoria": "Celulares",
        "subcategoria": "Motorola",
        "descripcion": "Pantalla IPS de 6.56 pulgadas a 90Hz, procesador MediaTek Helio G85, cámara principal de 50MP con lente macro y batería de 5000mAh con TurboPower.",
        "imagen": "fotos_productos/moto_g24.png"
    },
    {
        "nombre": "Tecno Spark Go 1",
        "marca": "Tecno",
        "categoria": "Celulares",
        "subcategoria": "Otras Marcas",
        "descripcion": "Pantalla HD+ de 6.6 pulgadas con tasa de refresco de 90Hz, procesador Unisoc, cámara principal de 13MP y batería de 5000mAh con puerto USB Tipo-C.",
        "imagen": "fotos_productos/tecno_spark_go_1.jpg"
    },
    {
        "nombre": "Xiaomi Redmi 14C",
        "marca": "Xiaomi",
        "categoria": "Celulares",
        "subcategoria": "Xiaomi",
        "descripcion": "Pantalla de 6.88 pulgadas con tasa de refresco de 120Hz, procesador MediaTek Helio G81 Ultra, cámara principal de 50MP con IA y batería de 5160mAh.",
        "imagen": "fotos_productos/redmi_14c.png"
    },
    {
        "nombre": "Samsung Galaxy A36 5G",
        "marca": "Samsung",
        "categoria": "Celulares",
        "subcategoria": "Samsung",
        "descripcion": "Pantalla Super AMOLED de 6.7 pulgadas a 120Hz, procesador Snapdragon 6 Gen 3, cámara principal de 50MP con estabilización óptica (OIS) y carga rápida de 45W.",
        "imagen": "fotos_productos/galaxy_a36_5g.jpg"
    },
    {
        "nombre": "Itel A90 Special Edition",
        "marca": "Itel",
        "categoria": "Celulares",
        "subcategoria": "Otras Marcas",
        "descripcion": "Pantalla de 6.6 pulgadas a 90Hz, procesador Unisoc, cámara principal de 13MP y batería de 5000mAh. Edición especial con diseño elegante de textura premium.",
        "imagen": "fotos_productos/itel_a90.jpg"
    },
    {
        "nombre": "Motorola Moto G23",
        "marca": "Motorola",
        "categoria": "Celulares",
        "subcategoria": "Motorola",
        "descripcion": "Pantalla IPS HD+ de 6.5 pulgadas a 90Hz, procesador MediaTek Helio G85, cámara triple de 50MP y batería de 5000mAh con TurboPower.",
        "imagen": "fotos_productos/moto_g23.png"
    },
    {
        "nombre": "Motorola Moto E15",
        "marca": "Motorola",
        "categoria": "Celulares",
        "subcategoria": "Motorola",
        "descripcion": "Pantalla de 6.67 pulgadas a 90Hz, procesador MediaTek Helio G81 Extreme, cámara de 32MP y batería de 5200mAh con diseño moderno en acabado símil cuero.",
        "imagen": "fotos_productos/moto_e15.png"
    },
    {
        "nombre": "Motorola Moto G04s",
        "marca": "Motorola",
        "categoria": "Celulares",
        "subcategoria": "Motorola",
        "descripcion": "Pantalla IPS de 6.56 pulgadas a 90Hz, procesador Unisoc T606, cámara principal mejorada de 50MP con IA y batería de 5000mAh.",
        "imagen": "fotos_productos/moto_g04s.webp"
    },
    {
        "nombre": "Samsung Galaxy A26 5G",
        "marca": "Samsung",
        "categoria": "Celulares",
        "subcategoria": "Samsung",
        "descripcion": "Pantalla Super AMOLED de 6.7 pulgadas a 120Hz, procesador Exynos, cámara triple de 50MP con OIS, batería de 5000mAh y soporte extendido para actualizaciones.",
        "imagen": "fotos_productos/galaxy_a26_5g.jpg"
    },
    {
        "nombre": "Samsung Galaxy Tab A11",
        "marca": "Samsung",
        "categoria": "Celulares",
        "subcategoria": "Tablets",
        "descripcion": "Tablet de 8.7 pulgadas con tasa de refresco de 90Hz, procesador MediaTek Helio G99, cámara de 8MP y batería de 5100mAh. Ideal para entretenimiento y estudio.",
        "imagen": "fotos_productos/galaxy_tab_a11.png"
    }
]

# Set IDs, price=0, destacado=False, etc.
current_id = max_id
for dev in new_devices:
    current_id += 1
    dev["id"] = current_id
    dev["precio"] = 0
    dev["destacado"] = False
    products.append(dev)

# Save JSON
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

# Save JS
js_content = f"const PRODUCTOS_DATA = {json.dumps(products, indent=2, ensure_ascii=False)};\n"
with open(js_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Added {len(new_devices)} new devices. New catalog size: {len(products)} products.")
