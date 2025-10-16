# 🌐 Guía DNS en OVH - Paso a Paso (Para No Desarrolladores)

## ¿Qué vamos a hacer?

Vamos a conectar tu dominio **laligafantasyspain.com** con tu servidor OVH.

**Analogía simple**: Es como poner la dirección de tu casa en Google Maps.
Cuando alguien busca "laligafantasyspain.com", el DNS le dice "está en el
servidor 151.80.119.163".

---

## 📋 Paso 1: Entrar al Panel de OVH

### 1.1 Abrir el navegador

- Abre Chrome, Firefox o Safari
- Ve a: **https://www.ovh.com/manager/** o **https://www.ovh.es/manager/**

### 1.2 Iniciar sesión

- Introduce tu **usuario** (normalmente es tu email)
- Introduce tu **contraseña**
- Click en **"Iniciar sesión"** o **"Log in"**

**¿No recuerdas la contraseña?**

- Click en "¿Has olvidado tu contraseña?"
- Sigue las instrucciones del email

---

## 📋 Paso 2: Encontrar tu Dominio

### 2.1 En el menú lateral izquierdo:

Busca una de estas opciones (depende de tu idioma):

- **"Dominios"** (español)
- **"Domain names"** (inglés)
- **"Noms de domaine"** (francés)

### 2.2 Haz click ahí

Verás una lista de tus dominios. Busca:

```
laligafantasyspain.com
```

### 2.3 Haz click en **laligafantasyspain.com**

Se abrirá la página de configuración de ese dominio.

---

## 📋 Paso 3: Ir a la Zona DNS

En la página del dominio, busca pestañas en la parte superior. Busca:

- **"Zona DNS"** (español)
- **"DNS Zone"** (inglés)
- **"Zone DNS"** (francés)

**Haz click ahí.**

Verás una tabla con registros DNS existentes (probablemente hay algunos ya
creados).

---

## 📋 Paso 4: Añadir el Primer Registro DNS

### 4.1 Busca un botón que diga:

- **"Añadir entrada"**
- **"Add entry"**
- **"Ajouter une entrée"**

**Haz click ahí.**

### 4.2 Selecciona tipo de registro:

Busca y haz click en **"A"** (es el tipo más común)

### 4.3 Rellena el formulario:

**Campo "Subdominio" o "Subdomain":**

- Pon: **@**
- (Si no te deja poner @, déjalo vacío)

**Campo "Destino" o "Target" o "IP":**

- Pon: **151.80.119.163**

**Campo "TTL":**

- Deja el valor por defecto (probablemente 3600)
- Si no aparece, no te preocupes

### 4.4 Haz click en:

- **"Confirmar"**
- **"Add"**
- **"Ajouter"**

✅ **Primer registro creado**

---

## 📋 Paso 5: Añadir el Segundo Registro DNS

### 5.1 De nuevo, haz click en:

- **"Añadir entrada"** / **"Add entry"**

### 5.2 Selecciona tipo:

- **"A"**

### 5.3 Rellena el formulario:

**Campo "Subdominio" o "Subdomain":**

- Pon: **www**

**Campo "Destino" o "Target" o "IP":**

- Pon: **151.80.119.163**

**Campo "TTL":**

- Deja el valor por defecto

### 5.4 Haz click en:

- **"Confirmar"** / **"Add"**

✅ **Segundo registro creado**

---

## 📋 Paso 6: Guardar los Cambios

**Importante:** Algunos paneles de OVH requieren un último paso de confirmación.

Busca un botón grande que diga:

- **"Aplicar configuración"**
- **"Apply configuration"**
- **"Guardar cambios"**
- **"Save changes"**

Si ves ese botón, **haz click ahí**.

Si no ves ningún botón así, no te preocupes, significa que los cambios ya se
guardaron automáticamente.

---

## 📋 Paso 7: Verificar que lo hiciste bien

Deberías ver en la tabla de registros DNS algo como esto:

```
Tipo    Subdominio    Destino            TTL
A       @             151.80.119.163     3600
A       www           151.80.119.163     3600
```

Si ves esas dos líneas, **¡perfecto!** Lo hiciste bien.

---

## ⏳ Paso 8: Esperar la Propagación

**¿Qué es la propagación?** Es el tiempo que tarda internet en actualizar la
información de tu dominio. Como cuando cambias de casa y tardas unos días en
actualizar tu dirección en todos los sitios.

**Tiempo estimado:** 5-30 minutos (a veces hasta 2 horas)

**Mientras esperas:**

- Puedes cerrar OVH
- Tómate un café ☕
- Dentro de 10 minutos volveremos a verificar

---

## ✅ Paso 9: Verificar que el DNS ya funciona

### Opción A: Desde tu ordenador (Mac/Linux)

Abre la **Terminal** (la aplicación negra donde se escriben comandos):

```bash
cd /Users/fran/Desktop/CURSOR/Fantasy\ la\ liga
./deploy/validate-dns.sh
```

Si dice **"DNS CORRECTAMENTE PROPAGADO"** → ✅ ¡Listo!

Si dice **"DNS AÚN NO PROPAGADO"** → ⏳ Espera 10 minutos más y vuelve a
ejecutar.

### Opción B: Desde un sitio web

Ve a esta página:

- https://dnschecker.org

Escribe: **laligafantasyspain.com**

Haz click en **"Search"**

Deberías ver **151.80.119.163** en la mayoría de ubicaciones.

---

## 🎉 ¿Todo listo?

Una vez que el DNS esté propagado, avísame y continuamos con el siguiente paso:

**Siguiente paso:** Configurar SSH en el servidor (5 minutos)

---

## 🆘 ¿Tienes problemas?

### "No encuentro la opción Zona DNS"

- Busca en las pestañas superiores: "DNS", "Gestión", "Management"
- Puede estar en un menú desplegable llamado "Configuración avanzada"

### "Me pide confirmación por email"

- Revisa tu email
- Haz click en el enlace de confirmación que te envió OVH
- Vuelve al panel y refresca la página

### "No me deja poner @ en el subdominio"

- Deja el campo vacío
- Algunos paneles no aceptan @, vacío funciona igual

### "Veo registros DNS antiguos"

- No los borres
- Simplemente añade los dos nuevos (@ y www apuntando a 151.80.119.163)

### "Dice que la IP no es válida"

- Verifica que pusiste: **151.80.119.163** (sin espacios)
- No incluyas "http://" ni "https://"

---

## 📞 Ayuda Directa

Si encuentras algo diferente a lo que describí:

1. **Haz una captura de pantalla** de lo que ves en OVH
2. **Avísame** con la captura
3. Te ayudo a encontrar la opción exacta

---

**Creado por:** Claude Code **Fecha:** 16 Oct 2025 **Nivel:** Principiante
