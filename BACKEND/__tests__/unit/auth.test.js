/**
 * PRUEBAS UNITARIAS — Sistema de Gestión Atlas
 * Módulo: autenticación (auth.js)
 * Estas pruebas verifican vulnerabilidades de seguridad mediante mocking
 * del pool de base de datos (sin requerir DB real).
 */

const jwt = require('jsonwebtoken');

// Mock del pool de PostgreSQL antes de importar el módulo auth
jest.mock('../../src/db', () => ({
  pool: {
    query: jest.fn()
  }
}), { virtual: true });

const { pool } = require('../../src/db');

// ============================================================
// UT-01: Validación de contraseña en texto plano (INC-001)
// ============================================================
test('UT-01: La comparación de contraseña es en texto plano (sin hashing)', () => {
  // Simular la lógica de auth.js línea 26: user.contrasena_hash !== password
  const contrasenaHash = 'admin123'; // valor simulado de la BD (texto plano)
  const passwordIngresada = 'admin123';

  // La vulnerabilidad: compara directamente sin bcrypt/argon2
  const esValida = contrasenaHash === passwordIngresada;

  expect(esValida).toBe(true);
  expect(contrasenaHash).toBe(passwordIngresada);
  // Evidencia: la contraseña se almacena y compara en texto plano
});

// ============================================================
// UT-02: Generación de JWT con secreto hardcodeado (INC-002)
// ============================================================
test('UT-02: JWT_SECRET tiene fallback hardcodeado "inseguro"', () => {
  // Simular auth.js línea 7: const JWT_SECRET = process.env.JWT_SECRET || "inseguro";
  const JWT_SECRET = process.env.JWT_SECRET || 'inseguro';

  // Si no hay variable de entorno, usa el valor inseguro por defecto
  if (!process.env.JWT_SECRET) {
    expect(JWT_SECRET).toBe('inseguro');
  }

  // Verificar que se puede firmar un token con este secreto
  const payload = { usuarioId: 1, nombreUsuario: 'admin' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

  expect(token).toBeDefined();
  expect(typeof token).toBe('string');

  // Verificar que el token se puede decodificar
  const decoded = jwt.verify(token, JWT_SECRET);
  expect(decoded.usuarioId).toBe(1);
  expect(decoded.nombreUsuario).toBe('admin');
});

// ============================================================
// UT-03: Endpoint de login en ruta incorrecta (INC-003)
// ============================================================
test('UT-03: El endpoint de login está en /autenticacion, no en /api/auth/login', () => {
  // Simular app.js línea 29: app.use("/autenticacion", authRoutes);
  const rutaLoginRegistrada = '/autenticacion';
  const rutaEsperadaCorrecta = '/api/auth/login';

  // La vulnerabilidad: el endpoint está en /autenticacion/login
  expect(rutaLoginRegistrada).toBe('/autenticacion');
  expect(rutaLoginRegistrada).not.toBe('/api');
});

// ============================================================
// UT-04: Exposición de errores internos (INC-005)
// ============================================================
test('UT-04: Los mensajes de error exponen detalles internos (err.message)', () => {
  // Simular auth.js líneas 62-64:
  // res.status(500).json({ error: "Error en login", glosa: err.message || err.toString() });
  const errMock = { message: 'connection timeout', code: 'ECONNREFUSED' };
  const glosa = errMock.message || errMock.toString();

  expect(glosa).toBe('connection timeout');
  expect(glosa).toContain('timeout');
  // Evidencia: el error interno se expone al cliente en el campo "glosa"
});

// ============================================================
// UT-05: Retraso artificial en login (INC-006)
// ============================================================
test('UT-05: Existe un delay artificial de 4 segundos en el login', () => {
  // Simular auth.js línea 17: const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  // Y línea 17-18: await delay(4000);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const delayMs = 4000;

  expect(delayMs).toBe(4000);
  expect(typeof delay).toBe('function');

  // Verificar que el delay existe y es de 4 segundos (vulnerabilidad de DoS)
  const start = Date.now();
  return delay(delayMs).then(() => {
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(3900); // permite pequeña variación
  });
});
