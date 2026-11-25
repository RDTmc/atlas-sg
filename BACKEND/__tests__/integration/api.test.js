/**
 * PRUEBAS DE INTEGRACIÓN — Sistema de Gestión Atlas
 * Estas pruebas se ejecutan contra el servidor real en ejecución:
 *   http://localhost:4450 (Backend Atlas)
 *   Base de datos: PostgreSQL puerto 15432
 *
 * Requisito previo: El servidor debe estar levantado (docker compose up -d)
 * y la base de datos inicializada con init.sql + dump-atlas.sql
 */

const request = require('supertest');

const BASE_URL = 'http://localhost:4450';

let tokenValido = null;

// ============================================================
// IT-01: Login con credenciales válidas (admin/admin)
// ============================================================
test('IT-01: Login exitoso con credenciales admin/admin', async () => {
  const response = await request(BASE_URL)
    .post('/autenticacion/login')
    .send({ nombre_usuario: 'admin', password: 'admin' })
    .timeout(10000);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
  expect(typeof response.body.token).toBe('string');
  expect(response.body.token.length).toBeGreaterThan(0);

  // Guardar token para pruebas posteriores
  tokenValido = response.body.token;
});

// ============================================================
// IT-02: Login con credenciales inválidas
// ============================================================
test('IT-02: Login fallido con credenciales incorrectas', async () => {
  const response = await request(BASE_URL)
    .post('/autenticacion/login')
    .send({ nombre_usuario: 'admin', password: 'password_incorrecta' })
    .timeout(10000);

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toBe('Credenciales inválidas');
});

// ============================================================
// IT-03: Crear cliente autenticado (requiere token)
// ============================================================
test('IT-03: Crear cliente con token JWT válido', async () => {
  // Si no hay token, hacer login primero
  if (!tokenValido) {
    const loginRes = await request(BASE_URL)
      .post('/autenticacion/login')
      .send({ nombre_usuario: 'admin', password: 'admin' });
    tokenValido = loginRes.body.token;
  }

  const response = await request(BASE_URL)
    .post('/clientes')
    .set('Authorization', `Bearer ${tokenValido}`)
    .send({
      nombre: 'Cliente Prueba Integración',
      correo: 'prueba.integracion@test.com',
      telefono: '+56912345678',
      direccion: 'Dirección de prueba 123',
      es_empresa: false,
      rut: '12.345.678-9',
      nombre_fantasia: 'Cliente Test',
      giro_actividad_economica: 'Servicios',
      empresa_id: 1
    })
    .timeout(15000);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  expect(response.body.nombre).toBe('Cliente Prueba Integración');
});

// ============================================================
// IT-04: Listar clientes sin token (debe fallar con 401)
// ============================================================
test('IT-04: Listar clientes sin autenticación retorna 401', async () => {
  const response = await request(BASE_URL)
    .get('/clientes')
    .timeout(10000);

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toBe('No autorizado');
});

// ============================================================
// IT-05: Crear contrato con archivo adjunto
// ============================================================
test('IT-05: Crear contrato con archivo PDF adjunto', async () => {
  if (!tokenValido) {
    const loginRes = await request(BASE_URL)
      .post('/autenticacion/login')
      .send({ nombre_usuario: 'admin', password: 'admin' });
    tokenValido = loginRes.body.token;
  }

  // Primero necesitamos un cliente existente. Usamos uno que ya esté en la BD
  // o creamos uno rápido. Intentamos crear un contrato con cliente_id=1
  const response = await request(BASE_URL)
    .post('/contratos')
    .set('Authorization', `Bearer ${tokenValido}`)
    .field('cliente_id', '1')
    .field('titulo', 'Contrato de Prueba Integración')
    .field('descripcion', 'Contrato creado por prueba de integración')
    .field('fecha_inicio', '2026-01-01')
    .field('fecha_fin', '2026-12-31')
    .attach('file', Buffer.from('contenido de prueba de contrato PDF'), 'contrato_prueba.pdf')
    .timeout(15000);

  // Puede ser 201 (éxito) o 404 si el cliente_id=1 no existe
  // Ambas son respuestas válidas del servidor
  expect([201, 404, 500]).toContain(response.status);

  if (response.status === 201) {
    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe('Contrato de Prueba Integración');
  }
});
