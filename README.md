# brindajeraullopezmx
proteccion fiscal

Instrucciones rápidas para ejecutar el proxy y el frontend localmente:

- Instala dependencias y arranca el servidor proxy:

```bash
cd server
npm install
npm start
```

El servidor servirá los archivos estáticos desde `server/public` (puerto `3000` por defecto) y expondrá:

- `GET /api/catalogs` - devuelve `{actividades, productos}` parseados del ZIP del SAT.
- `GET /api/valida-rfc?rfc=...` - valida RFC y verifica lista negra desde servidores del SAT.

Abre `http://localhost:3000` en tu navegador.

Nota: el proxy evita problemas de CORS al realizar las peticiones al SAT desde el servidor en lugar del navegador.

Si en lugar de usar Node tienes una app en Flask, puedes arrancarla en el puerto 8080 de cualquiera de estas maneras:

- Usando el servidor de desarrollo de Flask (requiere `FLASK_APP` o paquete):

```bash
flask run --port 8080
```

- O pasando el puerto como argumento si tu `app.py` lo soporta (ejemplo simple):

```bash
python app.py 8080
```

Ambas opciones inician la app en `http://localhost:8080`.
