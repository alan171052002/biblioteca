const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const multer = require('multer');
const bodyParser = require('body-parser');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 5432;
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar sesiones
app.use(session({
    secret: 'secret_key', // Cambia esto por una clave secreta más segura
    resave: false,
    saveUninitialized: true,
}));

// Middleware para manejar datos de formularios
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos
const connection = mysql.createConnection({
    host: 'dpg-crhh2clsvqrc738e1de0-a.oregon-postgres.render.com', // Cambia esto al host de tu base de datos en Render
    user: 'alanuwu', // Cambia esto al usuario de tu base de datos en Render
    password: 'V1oCwY2vGxub0PxOft248xeH89qNV5Mn', // Cambia esto a la contraseña de tu base de datos en Render
    database: 'biblioteca_6fyp' // Cambia esto al nombre de tu base de datos en Render
});

// Conecta a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos establecida con éxito');
});

app.use(bodyParser.json()); // Esto permite que Express entienda JSON en el cuerpo de la solicitud
// Ruta para manejar el registro de usuarios
app.post('/registro', (req, res) => {
    const { cargo, Nombre, user_name, password, repetirPassword } = req.body;

    if (password !== repetirPassword) {
        return res.status(400).send('Las contraseñas no coinciden.');
    }

    const sql = 'INSERT INTO usuarios (cargo, Nombre, user_name, password) VALUES (?, ?, ?, ?)';
    connection.query(sql, [cargo, Nombre, user_name, password], (err, result) => {
        if (err) {
            return res.status(500).send('Error al registrar el usuario.');
        }
        res.redirect('/login');
    });
});
app.put('/usuarios/editar/:id', (req, res) => {
    const userId = req.params.id;
    const { Nombre, cargo, user_name, password } = req.body;

    if (!Nombre || !cargo || !user_name) {
        return res.status(400).json({ success: false, message: 'Datos faltantes.' });
    }

    let query;
    let values;

    if (password) {
        // Actualizar todo incluyendo la contraseña
        query = `UPDATE usuarios SET Nombre = ?, cargo = ?, user_name = ?, password = ? WHERE id = ?`;
        values = [Nombre, cargo, user_name, password, userId];
    } else {
        // Actualizar sin modificar la contraseña
        query = `UPDATE usuarios SET Nombre = ?, cargo = ?, user_name = ? WHERE id = ?`;
        values = [Nombre, cargo, user_name, userId];
    }

    // Usar connection.query en lugar de db.query
    connection.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar usuario.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.json({ success: true, message: 'Usuario actualizado exitosamente.' });
    });
});
// Ruta para eliminar un usuario
app.delete('/usuarios/eliminar/:id', (req, res) => {
    const userId = req.params.id;

    const sql = 'DELETE FROM usuarios WHERE id = ?';
    connection.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el usuario:', err);
            return res.status(500).json({ success: false, message: 'Error al eliminar usuario.' });
        }

        res.json({ success: true, message: 'Usuario eliminado exitosamente.' });
    });
});

// Ruta para listar los usuarios
app.get('/usuarios/listar', (req, res) => {
    const sql = 'SELECT * FROM usuarios';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener usuarios.' });
        }

        res.json(results);
    });
});


// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE user_name = ?';
    connection.query(sql, [usuario], (err, results) => {
        if (err) {
            return res.status(500).send('Error en la base de datos.');
        }
        if (results.length === 0) {
            return res.status(400).send('Usuario no encontrado.');
        }

        const user = results[0];
        if (user.password !== password) {
            return res.status(400).send('Contraseña incorrecta.');
        }

        // Guardar información del usuario en la sesión
        req.session.user = {
            id: user.id,
            nombre: user.Nombre,
            cargo: user.cargo,
        };

        // Redirigir al menú principal
        res.redirect('/');
    });
});

app.get('/getUser', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user); // Devuelve la información del usuario
    } else {
        res.json(null); // Devuelve null si no hay un usuario en la sesión
    }
});

app.get('/logout', (req, res) => {
    // Destruir la sesión del usuario
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/'); // Redirigir al inicio después de cerrar sesión
    });
});
app.get('/user-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));



// Ruta principal
app.get('/', (req, res) => {
    // Verificar si el usuario está en la sesión
    const user = req.session.user;
    if (user) {
        // Si el usuario está autenticado, mostrar la vista con su nombre
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // Si no está autenticado, redirigir a la página de inicio de sesión
        res.redirect('/login');
    }
});
// Obtener usuario por ID
app.get('/usuarios/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'SELECT * FROM usuarios WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al modificar el usuario.' });
        }
        res.json({ success: true });
    });
});

// Ruta para verificar si el usuario está autenticado
app.get('/api/usuario', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, userName: req.session.user.user_name });
    } else {
        res.json({ loggedIn: false });
    }
});

// Otras rutas
app.get('/manuales', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ventanas', 'manuales.html'));
});

app.get('/cursos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ventanas', 'cursos.html'));
});

app.get('/archivos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ventanas', 'archivos.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sesion', 'login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sesion', 'registro.html'));
});
app.get('/Usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sesion', 'usuarios.html'));
});





/*





*/
// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post('/archivos/agregar', upload.single('fileUpload'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo.' });
    }

    console.log('Archivo subido:', req.file);

    const { fileName, fileDescription } = req.body;
    const pdfPath = 'uploads/' + req.file.filename; // Guardar la ruta relativa


    const sql = 'INSERT INTO archivos (nombre, descripcion, pdf_path) VALUES (?, ?, ?)';
    connection.query(sql, [fileName, fileDescription, pdfPath], (err, result) => {
        if (err) {
            console.error('Error al agregar archivo:', err);
            return res.status(500).json({ success: false, message: 'Error al agregar archivo.' });
        }
        res.json({ success: true });
    });
});
app.delete('/archivos/eliminar/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM archivos WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al eliminar archivo.' });
        }
        res.json({ success: true });
    });
});

app.get('/archivos/listar', (req, res) => {
    const sql = 'SELECT * FROM archivos';
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al obtener archivos.' });
        }
        res.json(results);
    });
});
/*


*/


// Ruta para agregar un manual
app.post('/manuales/agregar', upload.single('fileManual'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha subido ningún manual.' });
    }

    const { manualName, manualDescription } = req.body;
    const manualPath = 'uploads/manuales/' + req.file.filename;

    const sql = 'INSERT INTO manuales (nombre, descripcion, pdf_path) VALUES (?, ?, ?)';
    connection.query(sql, [manualName, manualDescription, manualPath], (err, result) => {
        if (err) {
            console.error('Error al agregar manual:', err);
            return res.status(500).json({ success: false, message: 'Error al agregar manual.' });
        }
        res.json({ success: true, message: 'Manual agregado exitosamente.' });
    });
});
app.get('/api/rol', (req, res) => {
    if (req.session.user) {
        res.json({ role: req.session.user.cargo });
    } else {
        res.json({ role: 'invitado' }); // O cualquier valor por defecto si no está autenticado
    }
});
// Ruta para eliminar un manual
app.delete('/manuales/eliminar/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM manuales WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al eliminar manual.' });
        }
        res.json({ success: true, message: 'Manual eliminado exitosamente.' });
    });
});

// Ruta para listar los manuales
app.get('/manuales/listar', (req, res) => {
    const sql = 'SELECT * FROM manuales';
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al obtener manuales.' });
        }
        res.json(results);
    });
});

// Ruta para descargar un manual
app.get('/manuales/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'public/uploads/manuales', file);
    res.download(filePath);
});

/*

*/

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

