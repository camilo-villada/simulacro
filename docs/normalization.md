# Proceso de Normalización

## Tabla Original (Sin Normalizar)
Tabla plana única, tal como se recibió de los archivos de Excel:

| nombre_del_cliente | correo_del_cliente | teléfono | ciudad | nombre_del_asesor | plataforma | importe | fecha | estado | puntuación | resultado |

## Primera Forma Normal (1FN)
- Claves primarias atómicas añadidas: id_cliente, id_asesor, id_plataforma, id_transacción, id_validación
- Cada celda contiene un único valor atómico
- Sin grupos repetidos
- Cada fila se identifica de forma única por su clave principal

Resultado: Una tabla con claves principales definidas, todos los valores son atómicos.

## Segunda Forma Normal (2FN)
- Dependencias parciales eliminadas
- Datos de clientes (nombre, correo electrónico, teléfono, ciudad) trasladados a la tabla clientes
- Datos de asesores (nombre, rol, canal, ciudad) trasladados a la tabla asesores
- Datos de plataformas (nombre) trasladados a la tabla plataformas
- La tabla transacciones solo conserva claves de función y datos específicos de transacciones

Resultado: 4 tablas: clientes, asesores, plataformas, transacciones

## Tercera Forma Normal (3FN)
- Dependencias transitivas eliminadas
- Datos de validación separados en la tabla validaciones
- La puntuación y el resultado se mantienen juntos, pero el resultado se deriva de la puntuación (puntuación >= 3.0 = aprobado)
- Ninguna columna depende de una columna que no sea clave de función

Resultado: 5 tablas finales: clientes, asesores, plataformas, transacciones, validaciones

## Decisión Final de Diseño
- clientes: almacena datos únicos de clientes
- asesores: almacena datos únicos de asesores
- plataformas: almacena Nequi y Daviplata como registros
- transacciones: vincula todas las entidades, almacena Importe/fecha/estado
- Validaciones: almacena la verificación del pago por transacción