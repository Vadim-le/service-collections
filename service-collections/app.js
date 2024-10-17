const express = require('express');
const config = require('config');
const fs = require('fs');
const multer = require('multer'); // Подключение multer для загрузки файлов
const path = require('path');
const app = express();
const PORT = config.get('port');

app.use(express.json());

// Настройка multer для сохранения загружаемых файлов в папку 'images'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images'); // Указание папки для сохранения файлов
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Указание имени файла (добавление временной метки к имени файла)
  }
});

const upload = multer({ storage: storage });

const { Pool } = require('pg');
const pool = new Pool({
  user: config.get('pg_user'),
  host: config.get('pg_host'),
  database: config.get('pg_database'),
  password: config.get('pg_password'),
  port: config.get('pg_port')
});

app.get('/api/service', async (req, res) => {
  try {
    const cursor = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');

    const servicesQuery = `
      SELECT service.*, service_categories.name AS category_name
      FROM services.service
      LEFT JOIN services.service_categories AS service_categories ON service.category_id = service_categories.id
    `;
    const servicesResult = await cursor.query(servicesQuery);
    cursor.release();

    const servicesWithImages = await Promise.all(servicesResult.rows.map(async service => {
      const imagePath = `./images/${service.logo}`;
      console.log(imagePath);

      const image = fs.readFileSync(imagePath, { encoding: 'base64' });
      return {
        ...service,
        image: `data:image/jpeg;base64,${image}`
      };
    }));

    res.json(servicesWithImages);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Ошибка выполнения запроса к базе данных' });
  }
});

app.get('/api/services/:serviceName', async (req, res) => {
  const serviceName = req.params.serviceName;
  try {
    const cursor = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');

    const serviceInfo = await cursor.query('SELECT id, description, logo FROM services.service WHERE name = $1', [serviceName]);
    const serviceId = serviceInfo.rows[0].id;
    const serviceDescription = serviceInfo.rows[0].description;
    const serviceLogo = serviceInfo.rows[0].logo;

    const servicePoints = await cursor.query('SELECT uri, description, id FROM services.service_points WHERE service_id = $1', [serviceId]);

    const serviceParameters = await Promise.all(servicePoints.rows.map(async (point) => {
      const parameters = await cursor.query(`
        SELECT sp.id, sp.name, sp.description, sp.required, ct.type 
        FROM services.service_parameters sp 
        LEFT JOIN components.type ct ON sp.type_id = ct.id 
        WHERE sp.service_point_id = $1`, [point.id]);
        console.log(parameters);
      return {
        ...point,
        parameters: parameters.rows
      };
    }));

    const imagePath = `./images/${serviceLogo}`;
    const image = fs.readFileSync(imagePath, { encoding: 'base64' });
    console.log(imagePath);

    cursor.release();

    res.json({
      serviceName,
      serviceDescription,
      servicePoints: serviceParameters,
      serviceLogo: `data:image/jpeg;base64,${image}`
    });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Ошибка выполнения запроса к базе данных' });
  }
});

app.post('/api/services/:serviceName/endpoints', async (req, res) => {
  const serviceName = req.params.serviceName;
  const { uri, description, parameters } = req.body;

  try {
    const cursor = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');

    const serviceInfo = await cursor.query('SELECT id FROM services.service WHERE name = $1', [serviceName]);
    const serviceId = serviceInfo.rows[0].id;

    const insertEndpointQuery = 'INSERT INTO services.service_points (service_id, uri, description) VALUES ($1, $2, $3) RETURNING id';
    const result = await cursor.query(insertEndpointQuery, [serviceId, uri, description]);
    const servicePointId = result.rows[0].id;

    const insertParameterQuery = 'INSERT INTO services.service_parameters (service_point_id, name, description, required, type_id) VALUES ($1, $2, $3, $4, $5)';
    for (const parameter of parameters) {
      const typeIdQuery = 'SELECT id FROM components.type WHERE type = $1';
      const typeResult = await cursor.query(typeIdQuery, [parameter.type]);
      const typeId = typeResult.rows[0].id;

      await cursor.query(insertParameterQuery, [servicePointId, parameter.name, parameter.description, parameter.required, typeId]);
    }

    const updatedServicePoints = await cursor.query('SELECT uri, description, id FROM services.service_points WHERE service_id = $1', [serviceId]);
    const updatedServiceParameters = await Promise.all(updatedServicePoints.rows.map(async (point) => {
      const parameters = await cursor.query(`SELECT sp.name, sp.description, sp.required, ct.type FROM services.service_parameters sp JOIN components.type 
          ct ON sp.type_id = ct.id WHERE sp.service_point_id = $1`, [point.id]);
      return {
        ...point,
        parameters: parameters.rows
      };
    }));

    cursor.release();

    res.status(201).json(updatedServiceParameters);
  } catch (err) {
    console.error('Error adding endpoint:', err);
    res.status(500).json({ error: 'Ошибка добавления нового endpoint' });
  }
});

// Обработчик маршрута для получения списка типов параметров
app.get('/api/parameter-types', async (req, res) => {
  try {
    const cursor = await pool.connect(); // Установка соединения с базой данных
    const parameterTypesQuery = 'SELECT id, type FROM components.type'; // Запрос типов параметров
    const result = await cursor.query(parameterTypesQuery); // Выполнение запроса
    cursor.release(); // Освобождение соединения с базой данных
    res.json(result.rows); // Отправка списка типов параметров клиенту
  } catch (err) {
    console.error('Error fetching parameter types:', err); // Вывод сообщения об ошибке
    res.status(500).json({ error: 'Ошибка получения типов параметров' }); // Отправка сообщения об ошибке клиенту
  }
});

app.put('/api/service-points/:id/parameters', async (req, res) => {
  const { parameters, uri, description } = req.body;
  const servicePointId = req.params.id;

  try {
    const client = await pool.connect();

    // Обновляем название и описание сервиса
    const updateServicePointQuery = `
      UPDATE services.service_points
      SET uri = $1, description = $2
      WHERE id = $3
    `;
    await client.query(updateServicePointQuery, [uri, description, servicePointId]);

    // Обновляем существующие параметры и добавляем новые параметры
    for (const param of parameters) {
      const { id, name, description, required, type } = param;

      // Получаем id типа на основе его имени
      const typeResult = await client.query(
        'SELECT id FROM components.type WHERE type = $1',
        [type]
      );
      
      const typeId = typeResult.rows[0]?.id;
      console.log(`Type: ${type}, Type ID: ${typeId}`); // Выводим только id типа
      

      if (!typeId) {
        throw new Error(`Type '${type}' not found`);
      }

      if (id) {
        // Обновляем существующий параметр
        const updateQuery = `
          UPDATE services.service_parameters
          SET "name" = $1,
              description = $2,
              required = $3,
              type_id = $4
          WHERE id = $5
        `;
        await client.query(updateQuery, [name, description, required, typeId, id]);
      } else {
        // Добавляем новый параметр
        const insertQuery = `
          INSERT INTO services.service_parameters (service_point_id, "name", description, required, type_id)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertQuery, [servicePointId, name, description, required, typeId]);
      }
    }

    client.release();

    res.status(200).send('Parameters and service point updated successfully');
  } catch (error) {
    console.error('Error updating service point and parameters:', error);
    res.status(500).send('Error updating service point and parameters');
  }
});


app.delete('/api/service-points/:pointId/parameters/:paramId', async (req, res) => {
  const { pointId, paramId } = req.params;

  try {
    const client = await pool.connect();
    const deleteQuery = `
      DELETE FROM services.service_parameters
      WHERE service_point_id = $1 AND id = $2
    `;
    await client.query(deleteQuery, [pointId, paramId]);
    client.release();

    res.status(200).send('Parameter deleted successfully');
  } catch (error) {
    console.error('Error deleting parameter:', error);
    res.status(500).send('Error deleting parameter');
  }
});

app.delete('/api/service-points/:pointId', async (req, res) => {
  const { pointId } = req.params;

  try {
    const client = await pool.connect();

    // Delete the endpoint
    const deleteEndpointQuery = `
      DELETE FROM services.service_points
      WHERE id = $1
    `;
    await client.query(deleteEndpointQuery, [pointId]);

    // Get the updated list of endpoints after deletion
    const updatedEndpointsQuery = `
      SELECT uri, description, id FROM services.service_points
    `;
    const updatedEndpointsResult = await client.query(updatedEndpointsQuery);
    const updatedEndpoints = updatedEndpointsResult.rows;

    client.release();

    res.status(200).json(updatedEndpoints); // Send the updated list of endpoints to the client
  } catch (error) {
    console.error('Error deleting service point:', error);
    res.status(500).send('Error deleting service point');
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const cursor = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');

    const categoriesQuery = 'SELECT * FROM services.service_categories';
    const categoriesResult = await cursor.query(categoriesQuery);

    cursor.release();

    res.json(categoriesResult.rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Ошибка выполнения запроса к базе данных' });
  }
});

// Новый обработчик маршрута для добавления нового сервиса
app.post('/api/services', upload.single('image'), async (req, res) => {
  const { uri, name, categoryId, description } = req.body; // Get new service data from request body
  const logoFile = req.file; // Get image file from request

  try {
    const cursor = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');

    // Check if the service name already exists
    const checkQuery = 'SELECT * FROM services.service WHERE name = $1';
    const checkResult = await cursor.query(checkQuery, [name]);

    if (checkResult.rows.length > 0) {
      // Service name already exists
      cursor.release();
      return res.status(409).json({ error: 'Сервис с таким названием уже существует' }); // Conflict status code
    }

    const apiSource = 'manual';
    const token = 'no';
    var logoFileName = '';
    if (logoFile == null){
      logoFileName = "default.jpg";
    }
    else{
      logoFileName = logoFile.filename;
    }
    // Insert new service
    const insertQuery = `
      INSERT INTO services.service (uri, token, name, category_id, logo, description, api_source)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await cursor.query(insertQuery, [uri, token, name, categoryId, logoFileName, description, apiSource]);

    cursor.release();

    res.status(201).json({ message: `Service ${name} added successfully.` });
  } catch (error) {
    console.error('Error inserting service:', error);
    res.status(500).json({ error: 'Error adding service' });
  }
});


app.post('/api/create-auth-service', async (req, res) => {
  const client = await pool.connect();

  try {
    const cursor = await pool.connect();
    const {  token, paramName,serviceName,auth_id} = req.body;

    const serviceInfo = await cursor.query('SELECT id FROM services.service WHERE name = $1', [serviceName]);
    const serviceId = serviceInfo.rows[0].id;
    
    // Вставляем данные в другую таблицу с использованием ID новой записи
    const authQueryText = `
      INSERT INTO services.default_auth ("token", service_id, type_id, param_name)
      VALUES ($1, $2, $3, $4)
    `;
    const authValues = [token, serviceId, auth_id, paramName];
    await client.query(authQueryText, authValues);

    res.status(201).json({ message: 'Service created successfully.' });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

app.post('/api/create-oauth-service', async (req, res) => {
  const client = await pool.connect();

  try {
    const cursor = await pool.connect();
    const { serviceName, clientId, clientSecret, clientUrl ,authorizationContentType, authorizationUrl, scope } = req.body;
    const serviceInfo = await cursor.query('SELECT id FROM services.service WHERE name = $1', [serviceName]);
    const serviceId = serviceInfo.rows[0].id;
   

    // Вставляем данные в другую таблицу с использованием ID новой записи
    const authQueryText = `
      INSERT INTO services.oauth_auth (service_id, client_id, client_secret, client_url, authorization_url, authorization_content_type, scope)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const authValues = [serviceId, clientId, clientSecret, clientUrl, authorizationContentType, authorizationUrl, scope];
    await client.query(authQueryText, authValues);

    res.status(201).json({ message: 'Service created successfully.' });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

app.put('/api/service-update/:serviceName', async (req, res) => {
  const serviceName = req.params.serviceName;
  const { serviceDisplayName, serviceDescription } = req.body;
  console.log(serviceName)
  try {
    const updateQuery = 'UPDATE services.service SET name = $1, description = $2 WHERE name = $3 RETURNING *';
    const values = [serviceDisplayName, serviceDescription, serviceName];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      throw new Error('No service found to update.');
    }

    const updatedService = result.rows[0];
    console.log('Updated service:', updatedService);
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error.message);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/service-delete/:serviceName', async (req, res) => {
  const serviceName = req.params.serviceName;

  try {
    const deleteQuery = 'DELETE FROM services.service WHERE name = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [serviceName]);

    if (result.rows.length === 0) {
      throw new Error('No service found to delete.');
    }

    console.log('Deleted service:', result.rows[0]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error.message);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Обслуживание статических файлов из папки build
app.use(express.static(path.join(__dirname, 'build')));

// Обслуживание index.html для всех нераспознанных маршрутов
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
